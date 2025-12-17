<template>
  <Layout :user="user">
    <div class="upload-container">
      <el-card class="upload-card">
        <template #header>
          <div class="card-header">
            <h2>上传音频文件</h2>
          </div>
        </template>
        
        <el-form 
          :model="uploadForm" 
          :rules="uploadRules" 
          ref="uploadFormRef"
          v-loading="uploading"
          element-loading-text="上传中..."
        >
          <el-form-item prop="audioFile">
            <el-upload
              class="upload-demo"
              drag
              :auto-upload="false"
              :on-change="handleFileChange"
              :on-remove="handleFileRemove"
              :limit="1"
              accept="audio/*"
            >
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将文件拖到此处，或<em>点击上传</em>
              </div>
              <template #tip>
                <div class="el-upload__tip">
                  请上传音频文件，且不超过10MB
                </div>
              </template>
            </el-upload>
          </el-form-item>
          
          <el-form-item class="button-group">
            <el-button 
              type="primary" 
              @click="submitUpload"
              :disabled="!uploadForm.audioFile || uploading"
              round
            >
              {{ uploading ? '上传中...' : '提交上传' }}
            </el-button>
            <el-button @click="resetForm" round>重置</el-button>
          </el-form-item>
        </el-form>
        
        <!-- 上传成功后的处理进度显示 -->
        <div v-if="uploadedFile" class="processing-status">
          <el-alert
            v-if="processingStatus.status === 'completed'"
            title="处理完成"
            type="success"
            description="音频文件已成功处理，可以到记录管理页面查看详情。"
            show-icon
            closable
          />
          
          <el-card v-else class="status-card">
            <div class="status-content">
              <el-progress 
                :percentage="processingStatus.progress" 
                :status="processingStatus.status === 'error' ? 'exception' : ''"
              />
              <p class="status-message">{{ processingStatus.message }}</p>
              
              <div v-if="processingStatus.status === 'error'" class="error-info">
                <el-alert
                  :title="processingStatus.message"
                  type="error"
                  show-icon
                  :closable="false"
                />
                <el-button @click="retryProcessing" type="primary" size="small" style="margin-top: 10px;">
                  重试处理
                </el-button>
              </div>
            </div>
          </el-card>
        </div>
      </el-card>
    </div>
  </Layout>
</template>

<script>
import Layout from '../components/Layout.vue'
import { UploadFilled } from '@element-plus/icons-vue'
import { apiClient } from '../config/api'

export default {
  name: 'Upload',
  components: {
    Layout,
    UploadFilled
  },
  data() {
    return {
      user: {},
      uploadForm: {
        audioFile: null,
        remark: ''
      },
      uploadRules: {
        audioFile: [
          { required: true, message: '请选择音频文件', trigger: 'change' }
        ]
      },
      uploading: false,
      uploadedFile: null,
      processingStatus: {
        status: 'idle', // idle, processing, completed, error
        progress: 0,
        message: ''
      },
      statusCheckInterval: null
    }
  },
  
  mounted() {
    // 获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
  },
  
  beforeUnmount() {
    // 清理定时器
    if (this.statusCheckInterval) {
      clearInterval(this.statusCheckInterval)
    }
  },
  
  methods: {
    handleFileChange(file) {
      this.uploadForm.audioFile = file.raw
    },
    
    handleFileRemove() {
      this.uploadForm.audioFile = null
    },
    
    resetForm() {
      this.$refs.uploadFormRef.resetFields()
      this.uploadForm.remark = ''
      this.uploadedFile = null
      this.processingStatus = {
        status: 'idle',
        progress: 0,
        message: ''
      }
      
      // 清理定时器
      if (this.statusCheckInterval) {
        clearInterval(this.statusCheckInterval)
      }
    },
    
    async submitUpload() {
      this.$refs.uploadFormRef.validate(async (valid) => {
        if (valid) {
          this.uploading = true
          
          try {
            const formData = new FormData()
            formData.append('audio', this.uploadForm.audioFile)
            formData.append('remark', this.uploadForm.remark)
            
            const response = await apiClient.post('/upload-audio', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            })
            
            if (response.data.success) {
              this.$message.success('上传成功')
              this.uploadedFile = response.data.file
              
              // 开始检查处理状态
              this.startStatusCheck(response.data.file.filename)
            } else {
              this.$message.error(response.data.message || '上传失败')
            }
          } catch (error) {
            this.$message.error('上传失败')
          } finally {
            this.uploading = false
          }
        }
      })
    },
    
    async checkProcessingStatus(fileId) {
      try {
        const response = await apiClient.get(`/audio-processing-status/${fileId}`)
        if (response.data.success) {
          this.processingStatus = response.data.data
          
          // 如果处理完成或出错，停止检查
          if (response.data.data.status === 'completed' || response.data.data.status === 'error') {
            if (this.statusCheckInterval) {
              clearInterval(this.statusCheckInterval)
            }
          }
        }
      } catch (error) {
        console.error('获取处理状态失败:', error)
        this.processingStatus = {
          status: 'error',
          progress: 0,
          message: '获取处理状态失败'
        }
      }
    },
    
    startStatusCheck(fileId) {
      // 立即检查一次
      this.checkProcessingStatus(fileId)
      
      // 每3秒检查一次处理状态
      this.statusCheckInterval = setInterval(() => {
        this.checkProcessingStatus(fileId)
      }, 3000)
    },
    
    retryProcessing() {
      if (this.uploadedFile && this.uploadedFile.id) {
        this.processingStatus = {
          status: 'processing',
          progress: 0,
          message: '重新开始处理'
        }
        this.startStatusCheck(this.uploadedFile.id)
      }
    }
  }
}
</script>

<style scoped>
/* Upload 页面样式 - 统一风格 */
.upload-container {
  max-width: 700px;
  margin: 0 auto;
  padding: 24px;
}

.upload-card {
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.upload-card :deep(.el-card__header) {
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  padding: 20px 24px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #1890ff;
}

.upload-demo {
  width: 100%;
}

.upload-demo :deep(.el-upload-dragger) {
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  background: #fafafa;
  transition: all 0.3s ease;
}

.upload-demo :deep(.el-upload-dragger:hover) {
  border-color: #1890ff;
  background: #f0f7ff;
}

.button-group {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 24px;
}

.button-group :deep(.el-button) {
  border-radius: 8px;
  padding: 12px 28px;
  font-weight: 500;
}

.button-group :deep(.el-button--primary) {
  background: #1890ff;
  border: none;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
}

.button-group :deep(.el-button--primary:hover) {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.processing-status {
  margin-top: 24px;
}

.status-card {
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.status-content {
  text-align: center;
  padding: 24px;
}

.status-message {
  margin: 16px 0;
  font-size: 14px;
  color: #666666;
  font-weight: 500;
}

.error-info {
  margin-top: 16px;
}

.el-upload__tip {
  text-align: center;
  margin-top: 12px;
  color: #999999;
}
</style>