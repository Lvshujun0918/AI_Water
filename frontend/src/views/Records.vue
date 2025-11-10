<template>
  <Layout :user="user">
    <el-card class="records-card">
      <template #header>
        <div class="card-header">
          <span>记录管理</span>
          <el-button type="primary" @click="handleAdd">新增记录</el-button>
        </div>
      </template>
      
      <el-table :data="records" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="size" label="大小" />
        <el-table-column label="风险等级" width="120">
          <template #default="scope">
            <el-tag 
              :type="getRiskLevelType(scope.row.risk_level)"
              disable-transitions
            >
              {{ scope.row.risk_level }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="置信度" width="100">
          <template #default="scope">
            <el-progress 
              :percentage="Math.round(scope.row.confidence * 100)" 
              :status="getConfidenceStatus(scope.row.risk_level)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="上传时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="primary" @click="playAudio(scope.row)">播放</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>
    
    <!-- 音频播放器 -->
    <div class="audio-player" v-if="currentAudio">
      <el-dialog v-model="playerVisible" title="音频播放" width="500px">
        <h3>正在播放: {{ currentAudio.originalName }}</h3>
        <audio ref="audioPlayer" controls @ended="onAudioEnded" style="width: 100%;">
          <source :src="currentAudio.url" :type="currentAudio.mimetype">
          您的浏览器不支持音频播放。
        </audio>
        <template #footer>
          <el-button @click="stopAudio">关闭</el-button>
        </template>
      </el-dialog>
    </div>
  </Layout>
</template>

<script>
import axios from 'axios'
import Layout from '../components/Layout.vue'
import API_CONFIG from '../config/api'

export default {
  name: 'Records',
  components: {
    Layout
  },
  data() {
    return {
      user: {},
      loading: false,
      records: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      dialogVisible: false,
      playerVisible: false,
      dialogTitle: '',
      form: {
        id: null,
        name: '',
        description: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' }
        ]
      },
      currentAudio: null
    }
  },
  mounted() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
    this.loadRecords()
  },
  methods: {
    async loadRecords() {
      this.loading = true
      try {
        // 获取音频文件列表（作为记录）
        const response = await axios.get(API_CONFIG.ENDPOINTS.GET_AUDIO_FILES)
        if (response.data.success) {
          // 将音频文件转换为记录格式
          this.records = response.data.files.map(file => ({
            id: file.id,
            name: file.original_name,
            size: this.formatFileSize(file.size),
            risk_level: file.risk_level || '未知',
            confidence: file.confidence || 0.0,
            createTime: file.upload_time,
            audioData: file // 保存音频数据用于播放
          }))
          this.pagination.total = this.records.length
        }
      } catch (error) {
        this.$message.error('获取记录列表失败')
      } finally {
        this.loading = false
      }
    },
    
    handleAdd() {
      this.$router.push('/upload')
    },
    
    handleDelete(row) {
      this.$confirm('确认删除该记录吗？', '提示', {
        confirmButtonText: '确认',  
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await axios.delete(API_CONFIG.ENDPOINTS.DELETE_AUDIO_FILE(row.id))
          if (response.data.success) {
            this.$message.success('删除成功')
            this.loadRecords()
          } else {
            this.$message.error(response.data.message || '删除失败')
          }
        } catch (error) {
          this.$message.error('删除失败')
        }
      }).catch(() => {
        // 用户取消删除
      })
    },
    
    saveRecord() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          // 模拟保存操作
          this.$message.success('保存成功')
          this.dialogVisible = false
          this.loadRecords()
        }
      })
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadRecords()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadRecords()
    },
    
    // 播放音频
    playAudio(row) {
      // 构造完整的音频文件URL
      const fullUrl = API_CONFIG.getAudioFileUrl(row.audioData.filename)
      this.currentAudio = {
        ...row.audioData,
        url: fullUrl
      }
      
      this.playerVisible = true
      this.$nextTick(() => {
        if (this.$refs.audioPlayer) {
          this.$refs.audioPlayer.play()
        }
      })
    },
    
    // 停止播放
    stopAudio() {
      if (this.$refs.audioPlayer) {
        this.$refs.audioPlayer.pause()
        this.$refs.audioPlayer.currentTime = 0
      }
      this.currentAudio = null
      this.playerVisible = false
    },
    
    // 音频播放结束
    onAudioEnded() {
      this.currentAudio = null
      this.playerVisible = false
    },
    
    // 获取风险等级标签类型
    getRiskLevelType(riskLevel) {
      //const levelConfig = API_CONFIG.RISK_LEVELS[riskLevel]
      return riskLevel//levelConfig ? levelConfig.type : 'info'
    },
    
    // 获取置信度状态
    getConfidenceStatus(riskLevel) {
      switch (riskLevel) {
        case '高风险':
          return 'exception'
        case '中风险':
          return 'warning'
        case '低风险':
          return 'success'
        default:
          return null
      }
    },
    
    // 格式化文件大小
    formatFileSize(size) {
      if (size < 1024) {
        return size + ' B'
      } else if (size < 1024 * 1024) {
        return (size / 1024).toFixed(2) + ' KB'
      } else {
        return (size / (1024 * 1024)).toFixed(2) + ' MB'
      }
    }
  }
}
</script>

<style scoped>
.records-card {
  margin: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.audio-player {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  background-color: #f9f9f9;
}

.audio-player h3 {
  margin-top: 0;
}

.audio-player audio {
  width: 100%;
  margin: 10px 0;
}
</style>