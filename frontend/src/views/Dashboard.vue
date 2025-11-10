<template>
  <Layout :user="user">
    <div class="dashboard-container">
      <el-card class="welcome-card">
        <template #header>
          <div class="card-header">
            <h2>系统概览</h2>
          </div>
        </template>
        
        <div class="welcome-content">
          <h3>欢迎, {{ user.username }}!</h3>
          <p>您已成功登录 RISC-V 管理系统</p>
        </div>
        
        <div class="stats-grid">
          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon class="stat-icon" color="#409eff"><Document /></el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ stats.audioFiles }}</div>
                <div class="stat-label">音频文件</div>
              </div>
            </div>
          </el-card>
          
          <el-card class="stat-card">
            <div class="stat-content">
              <el-icon class="stat-icon" color="#67c23a"><User /></el-icon>
              <div class="stat-info">
                <div class="stat-number">{{ stats.users }}</div>
                <div class="stat-label">用户数</div>
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
import { Document, User } from '@element-plus/icons-vue'
import { apiClient } from '../config/api'

export default {
  name: 'Dashboard',
  components: {
    Layout,
    Document,
    User
  },
  data() {
    return {
      user: {},
      stats: {
        audioFiles: 0,
        users: 1
      }
    }
  },
  
  async mounted() {
    // 获取用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
    
    // 获取统计信息
    await this.fetchStats()
  },
  
  methods: {
    async fetchStats() {
      try {
        // 获取音频文件统计
        const response = await apiClient.get('/audio-files')
        if (response.data.success) {
          this.stats.audioFiles = response.data.data.length
        }
      } catch (error) {
        console.error('获取统计信息失败:', error)
      }
    }
  }
}
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
}

.welcome-card {
  margin-bottom: 20px;
}

.card-header {
  text-align: center;
}

.welcome-content {
  text-align: center;
  margin-bottom: 30px;
}

.welcome-content h3 {
  margin: 0 0 10px 0;
  font-size: 24px;
  color: #333;
}

.welcome-content p {
  margin: 0;
  color: #666;
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.stat-card {
  border-radius: 12px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 20px;
}

.stat-icon {
  font-size: 40px;
  margin-right: 20px;
}

.stat-info {
  flex: 1;
}

.stat-number {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 16px;
  color: #666;
}
</style>