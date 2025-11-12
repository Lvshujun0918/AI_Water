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
          label-width="120px"
          v-loading="uploading"
          element-loading-text="上传中..."
        >
          <el-form-item label="选择音频文件" prop="audioFile">
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
          
          <el-form-item label="备注信息" prop="remark">
            <el-input 
              v-model="uploadForm.remark" 
              type="textarea"
              placeholder="请输入备注信息（可选）"
              :rows="3"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="submitUpload"
              :disabled="!uploadForm.audioFile || uploading"
            >
              {{ uploading ? '上传中...' : '提交上传' }}
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
        
        <el-alert
          v-if="uploadSuccess"
          title="上传成功"
          type="success"
          description="文件已成功上传，系统将自动进行风险分析，请稍后在记录管理中查看分析结果。"
          show-icon
          closable
          style="margin-top: 20px;"
        />
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
      uploadSuccess: false
    }
  },
  
  mounted() {
    // 获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
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
      this.uploadSuccess = false
    },
    
    submitUpload() {
      this.$refs.uploadFormRef.validate(async (valid) => {
        if (valid) {
          this.uploading = true
          this.uploadSuccess = false
          
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
              this.uploadSuccess = true
              this.resetForm()
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
    }
  }
}
</script>

<style scoped>
.upload-container {
  padding: 20px;
}

.card-header {
  text-align: center;
}

.upload-demo {
  width: 100%;
}
</style>