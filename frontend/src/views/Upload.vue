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
      
      <div class="upload-history" v-if="audioFiles.length > 0">
        <h3>音频文件列表</h3>
        <el-table :data="audioFiles" style="width: 100%" v-loading="loading">
          <el-table-column prop="original_name" label="文件名" />
          <el-table-column prop="size" label="大小" width="120">
            <template #default="scope">
              {{ formatFileSize(scope.row.size) }}
            </template>
          </el-table-column>
          <el-table-column prop="upload_time" label="上传时间" width="180" />
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <el-button size="small" type="primary" @click="playAudio(scope.row)">播放</el-button>
              <el-button size="small" type="danger" @click="deleteAudio(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <!-- 音频播放器 -->
      <div class="audio-player" v-if="currentAudio">
        <h3>正在播放: {{ currentAudio.originalName }}</h3>
        <audio ref="audioPlayer" controls @ended="onAudioEnded">
          <source :src="currentAudio.url" :type="currentAudio.mimetype">
          您的浏览器不支持音频播放。
        </audio>
        <el-button @click="stopAudio" size="small">停止播放</el-button>
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
      fileList: [],
      audioFiles: [],
      loading: false,
      currentAudio: null
    }
  },
  mounted() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
    this.loadAudioFiles()
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
        this.loadAudioFiles() // 重新加载文件列表
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
    },
    
    // 加载音频文件列表
    async loadAudioFiles() {
      this.loading = true
      try {
        const response = await axios.get(API_CONFIG.ENDPOINTS.GET_AUDIO_FILES)
        if (response.data.success) {
          this.audioFiles = response.data.files
        }
      } catch (error) {
        this.$message.error('获取音频文件列表失败')
      } finally {
        this.loading = false
      }
    },
    
    // 播放音频
    playAudio(file) {
      // 构造完整的音频文件URL
      const fullUrl = API_CONFIG.getAudioFileUrl(file.filename)
      this.currentAudio = {
        ...file,
        url: fullUrl
      }
      
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
    },
    
    // 音频播放结束
    onAudioEnded() {
      this.currentAudio = null
    },
    
    // 删除音频文件
    async deleteAudio(file) {
      try {
        await this.$confirm(`确认删除文件 ${file.originalName} 吗？`, '提示', {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        const response = await axios.delete(API_CONFIG.ENDPOINTS.DELETE_AUDIO_FILE(file.id))
        if (response.data.success) {
          this.$message.success('删除成功')
          this.loadAudioFiles() // 重新加载文件列表
          
          // 如果正在播放的文件被删除，停止播放
          if (this.currentAudio && this.currentAudio.id === file.id) {
            this.stopAudio()
          }
        } else {
          this.$message.error(response.data.message || '删除失败')
        }
      } catch (error) {
        // 用户取消删除或删除失败
        if (error !== 'cancel') {
          this.$message.error('删除失败')
        }
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

.upload-history h3 {
  margin-bottom: 15px;
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