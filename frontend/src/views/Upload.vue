<template>
  <Layout :user="user">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span>音频文件上传</span>
        </div>
      </template>
      
      <div class="upload-area">
        <el-upload
          class="upload-demo"
          drag
          :http-request="handleUpload"
          :multiple="false"
          :on-success="handleSuccess"
          :on-error="handleError"
          :on-progress="handleProgress"
          :on-remove="handleRemove"
          :file-list="fileList"
          accept="audio/*"
        >
          <el-icon class="el-icon--upload"><upload-filled /></el-icon>
          <div class="el-upload__text">
            将音频文件拖到此处，或<em>点击上传</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">
              请上传音频文件，支持 mp3, wav, ogg 等格式，文件大小不超过50MB
            </div>
          </template>
        </el-upload>
      </div>
    </el-card>
  </Layout>
</template>

<script>
import axios from 'axios'
import Layout from '../components/Layout.vue'
import { UploadFilled } from '@element-plus/icons-vue'
import API_CONFIG from '../config/api'

export default {
  name: 'Upload',
  components: {
    Layout,
    UploadFilled
  },
  data() {
    return {
      user: {},
      fileList: []
    }
  },
  mounted() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
  },
  methods: {
    // 自定义上传处理函数
    async handleUpload(options) {
      const { file } = options
      const formData = new FormData()
      formData.append('audio', file)
      formData.append('userId', this.user.id || '')
      
      try {
        const response = await axios.post(API_CONFIG.ENDPOINTS.UPLOAD_AUDIO, formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            // 更新上传进度
            const progress = (progressEvent.loaded / progressEvent.total) * 100
            options.onProgress({ percent: progress })
          }
        })
        
        // 上传成功
        options.onSuccess(response.data)
        return response
      } catch (error) {
        // 上传失败
        options.onError(error)
        throw error
      }
    },
    
    handleSuccess(response, file, fileList) {
      if (response.success) {
        this.$message.success('上传成功')
        this.fileList = fileList
      } else {
        this.$message.error(response.message || '上传失败')
        this.fileList = fileList.filter(f => f.uid !== file.uid)
      }
    },
    
    handleError(error, file, fileList) {
      this.$message.error('上传失败: ' + (error.message || '未知错误'))
      this.fileList = fileList.filter(f => f.uid !== file.uid)
    },
    
    handleProgress(event, file, fileList) {
      // 上传进度处理
    },
    
    handleRemove(file, fileList) {
      this.fileList = fileList
    }
  }
}
</script>

<style scoped>
.upload-card {
  margin: 20px;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.upload-area {
  margin-bottom: 30px;
}
</style>