<template>
  <Layout :user="user">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>系统首页</span>
        </div>
      </template>
      <div class="welcome-content">
        <h3>欢迎使用AI检漏管理系统</h3>
        <p>您已成功登录系统</p>
        <div class="stats">
          <el-row :gutter="20">
            <el-col :span="6">
              <div class="stat-item">
                <el-icon class="stat-icon"><User /></el-icon>
                <div class="stat-info">
                  <div class="stat-number">1</div>
                  <div class="stat-text">用户总数</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <el-icon class="stat-icon"><Document /></el-icon>
                <div class="stat-info">
                  <div class="stat-number">0</div>
                  <div class="stat-text">记录总数</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <el-icon class="stat-icon"><Upload /></el-icon>
                <div class="stat-info">
                  <div class="stat-number">0</div>
                  <div class="stat-text">上传文件</div>
                </div>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="stat-item">
                <el-icon class="stat-icon"><DataLine /></el-icon>
                <div class="stat-info">
                  <div class="stat-number">0</div>
                  <div class="stat-text">数据统计</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </el-card>
  </Layout>
</template>

<script>
import axios from 'axios'
import Layout from '../components/Layout.vue'
import { User, Document, Upload, DataLine } from '@element-plus/icons-vue'

export default {
  name: 'Dashboard',
  components: {
    Layout,
    User,
    Document,
    Upload,
    DataLine
  },
  data() {
    return {
      user: {}
    }
  },
  async mounted() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    } else {
      // 检查用户是否真的已登录
      try {
        await axios.get('/test')
      } catch (error) {
        // 如果无法访问受保护的资源，重定向到登录页
        this.$router.push('/login')
      }
    }
  }
}
</script>

<style scoped>
.welcome-card {
  max-width: 1200px;
  margin: 0 auto;
}

.card-header {
  font-size: 18px;
  font-weight: 600;
}

.welcome-content {
  text-align: center;
  padding: 20px;
}

.welcome-content h3 {
  margin-bottom: 10px;
  color: #333;
}

.welcome-content p {
  color: #666;
  margin-bottom: 30px;
}

.stats {
  margin-top: 30px;
}

.stat-item {
  display: flex;
  align-items: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-item:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  font-size: 32px;
  color: #409eff;
  margin-right: 15px;
}

.stat-info {
  text-align: left;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

.stat-text {
  font-size: 14px;
  color: #666;
}
</style>