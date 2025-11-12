<template>
  <Layout :user="user">
    <div class="records-container">
      <el-card class="records-card">
        <template #header>
          <div class="card-header">
            <h2>音频记录管理</h2>
            <el-button type="primary" @click="goToUpload">上传新文件</el-button>
          </div>
        </template>
        
        <el-table 
          :data="records" 
          v-loading="loading"
          element-loading-text="加载中..."
          style="width: 100%"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="filename" label="文件名" />
          <el-table-column prop="risk_level" label="风险等级" width="120">
            <template #default="scope">
              <div v-if="scope.row.processingStatus && scope.row.processingStatus.status === 'processing'">
                <el-tag type="warning">处理中</el-tag>
              </div>
              <div v-else-if="scope.row.processingStatus && scope.row.processingStatus.status === 'error'">
                <el-tag type="danger">处理失败</el-tag>
              </div>
              <div v-else>
                <el-tag :type="getRiskLevelType(scope.row.risk_level)">
                  {{ scope.row.risk_level || '未知' }}
                </el-tag>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="confidence" label="置信度" width="100">
            <template #default="scope">
              <div v-if="scope.row.processingStatus && scope.row.processingStatus.status === 'processing'">
                <el-progress 
                  :percentage="scope.row.processingStatus.progress" 
                  :show-text="false" 
                  style="width: 80px"
                />
              </div>
              <div v-else-if="scope.row.processingStatus && scope.row.processingStatus.status === 'error'">
                <span>处理失败</span>
              </div>
              <div v-else>
                <span v-if="scope.row.confidence > 0">
                  {{ (scope.row.confidence * 100).toFixed(2) }}%
                </span>
                <span v-else>未知</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="upload_time" label="上传时间" width="200" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button 
                size="small" 
                type="primary"
                @click="playAudio(scope.row)"
                :disabled="scope.row.processingStatus && scope.row.processingStatus.status === 'processing'"
              >
                播放
              </el-button>
              <el-button 
                size="small" 
                type="danger"
                @click="deleteAudio(scope.row)"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
      
      <!-- 音频播放对话框 -->
      <el-dialog
        v-model="dialogVisible"
        :title="currentAudio.original_name"
        width="400px"
      >
        <audio 
          v-if="dialogVisible" 
          :src="audioUrl" 
          controls 
          style="width: 100%"
        />
        
        <div v-if="currentAudio.risk_level || currentAudio.confidence" class="audio-info">
          <el-descriptions :column="1" size="small" border>
            <el-descriptions-item label="风险等级">
              <el-tag :type="getRiskLevelType(currentAudio.risk_level)">
                {{ currentAudio.risk_level || '未知' }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="置信度">
              <span v-if="currentAudio.confidence > 0">
                {{ (currentAudio.confidence * 100).toFixed(2) }}%
              </span>
              <span v-else>未知</span>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </el-dialog>
    </div>
  </Layout>
</template>

<script>
import Layout from '../components/Layout.vue'
import { apiClient, default as API_CONFIG } from '../config/api'

export default {
  name: 'Records',
  components: {
    Layout
  },
  data() {
    return {
      user: {},
      records: [],
      loading: false,
      dialogVisible: false,
      currentAudio: {},
      audioUrl: '',
      currentPage: 1,
      pageSize: 10,
      total: 0,
      statusCheckInterval: null
    }
  },
  
  async mounted() {
    // 获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
    
    // 获取记录
    await this.fetchRecords()
    
    // 启动状态检查定时器
    this.startStatusCheck()
  },
  
  beforeUnmount() {
    // 清理定时器
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval)
    }
  },
  
  methods: {
    getRiskLevelType(riskLevel) {
      if (!riskLevel || riskLevel === '未知') return '';
      if (riskLevel === '低风险') return 'success';
      if (riskLevel === '高风险') return 'danger';
      return 'warning';
    },
    
    goToUpload() {
      this.$router.push('/upload')
    },
    
    async fetchRecords() {
      this.loading = true
      try {
        const response = await apiClient.get(`/audio-files?page=${this.currentPage}&size=${this.pageSize}`)
        if (response.data.success) {
          this.records = response.data.data
          this.total = response.data.total
          
          // 为每个记录添加处理状态属性
          this.records.forEach(record => {
            record.processingStatus = null
          })
        }
      } catch (error) {
        this.$message.error('获取记录失败')
      } finally {
        this.loading = false
      }
    },
    
    async checkProcessingStatus() {
      // 检查是否有正在处理的记录
      const processingRecords = this.records.filter(record => 
        !record.risk_level || record.risk_level === '未知' || 
        (record.processingStatus && record.processingStatus.status === 'processing')
      )
      
      // 为每个正在处理的记录获取状态
      for (const record of processingRecords) {
        try {
          const response = await apiClient.get(`/audio-processing-status/${record.id}`)
          if (response.data.success) {
            // 更新记录的处理状态
            record.processingStatus = response.data.data
            
            // 如果处理完成，刷新记录
            if (response.data.data.status === 'completed') {
              await this.fetchRecords()
            }
          }
        } catch (error) {
          console.error('获取处理状态失败:', error)
        }
      }
    },
    
    startStatusCheck() {
      // 每5秒检查一次处理状态
      this.statusCheckInterval = setInterval(() => {
        this.checkProcessingStatus()
      }, 5000)
    },
    
    playAudio(row) {
      this.currentAudio = row
      this.audioUrl = API_CONFIG.getAudioFileUrl(row.filename)
      this.dialogVisible = true
    },
    
    deleteAudio(row) {
      this.$confirm('此操作将永久删除该文件, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await apiClient.delete(`/audio-files/${row.id}`)
          this.$message.success('删除成功')
          await this.fetchRecords()
        } catch (error) {
          this.$message.error('删除失败')
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.fetchRecords()
    },
    
    handleCurrentChange(val) {
      this.currentPage = val
      this.fetchRecords()
    }
  }
}
</script>

<style scoped>
.records-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

.audio-info {
  margin-top: 20px;
}
</style>