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
          <el-table-column prop="upload_time" label="上传时间" width="200" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button 
                size="small" 
                type="primary"
                @click="playAudio(scope.row)"
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
        :title="currentAudio.filename"
        width="400px"
      >
        <audio 
          v-if="dialogVisible" 
          :src="audioUrl" 
          controls 
          style="width: 100%"
        />
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
      total: 0
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
  },
  
  methods: {
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
        }
      } catch (error) {
        this.$message.error('获取记录失败')
      } finally {
        this.loading = false
      }
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
</style>