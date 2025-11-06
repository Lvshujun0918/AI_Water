<template>
  <Layout :user="user">
    <el-card class="upload-card">
      <template #header>
        <div class="card-header">
          <span>文件上传</span>
        </div>
      </template>
      
      <el-upload
        class="upload-demo"
        drag
        action="/api/upload"
        :multiple="true"
        :on-success="handleSuccess"
        :on-error="handleError"
        :on-progress="handleProgress"
        :on-remove="handleRemove"
        :file-list="fileList"
      >
        <el-icon class="el-icon--upload"><upload-filled /></el-icon>
        <div class="el-upload__text">
          将文件拖到此处，或<em>点击上传</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            请上传相关文件，支持常见格式
          </div>
        </template>
      </el-upload>
      
      <div class="upload-history">
        <h3>上传历史</h3>
        <el-table :data="uploadHistory" style="width: 100%">
          <el-table-column prop="name" label="文件名" />
          <el-table-column prop="size" label="大小" width="120" />
          <el-table-column prop="uploadTime" label="上传时间" width="180" />
          <el-table-column label="操作" width="150">
            <template #default="scope">
              <el-button size="small" type="primary">下载</el-button>
              <el-button size="small" type="danger">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>
  </Layout>
</template>

<script>
import Layout from '@/components/Layout.vue'
import { UploadFilled } from '@element-plus/icons-vue'

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
      uploadHistory: [
        { name: '示例文件1.txt', size: '1.2KB', uploadTime: '2023-01-01 12:00:00' },
        { name: '示例文件2.pdf', size: '2.5MB', uploadTime: '2023-01-02 14:30:00' }
      ]
    }
  },
  mounted() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
  },
  methods: {
    handleSuccess(response, file, fileList) {
      this.$message.success('上传成功')
      this.fileList = fileList
    },
    
    handleError(error, file, fileList) {
      this.$message.error('上传失败')
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

.upload-demo {
  margin-bottom: 30px;
}

.upload-history h3 {
  margin-bottom: 15px;
}
</style>