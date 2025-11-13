<template>
  <el-container class="layout-container">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '200px'" class="layout-aside">
      <div class="logo">
        <h2 v-if="!isCollapse">AI检漏管理</h2>
        <h2 v-else>R-V</h2>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="layout-menu"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409eff"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><House /></el-icon>
          <template #title>首页</template>
        </el-menu-item>
        <el-menu-item index="/records">
          <el-icon><Document /></el-icon>
          <template #title>记录管理</template>
        </el-menu-item>
        <el-menu-item index="/upload">
          <el-icon><Upload /></el-icon>
          <template #title>上传文件</template>
        </el-menu-item>
        <el-menu-item index="/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <!-- 主体区域 -->
    <el-container>
      <!-- 头部 -->
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="menu-toggle" @click="toggleMenu">
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
        </div>
        <div class="header-right">
          <!-- 通知图标 -->
          <el-popover
            placement="bottom"
            :width="300"
            trigger="click"
            @show="markNotificationsAsRead"
          >
            <template #reference>
              <div class="notification-icon">
                <el-badge :value="unreadCount" :max="99" :hidden="unreadCount === 0">
                  <el-icon size="20"><Bell /></el-icon>
                </el-badge>
              </div>
            </template>
            
            <div class="notification-panel">
              <div class="notification-header">
                <span>通知</span>
                <el-button 
                  type="text" 
                  size="small" 
                  @click="clearNotifications"
                  :disabled="notifications.length === 0"
                >
                  清空
                </el-button>
              </div>
              
              <div class="notification-list" v-if="notifications.length > 0">
                <div 
                  v-for="notification in notifications" 
                  :key="notification.id"
                  class="notification-item"
                  :class="{ unread: !notification.read }"
                >
                  <div class="notification-content">
                    <div class="notification-title">{{ notification.title }}</div>
                    <div class="notification-message">{{ notification.message }}</div>
                    <div class="notification-time">{{ formatTime(notification.time) }}</div>
                  </div>
                </div>
              </div>
              
              <div v-else class="no-notifications">
                暂无通知
              </div>
            </div>
          </el-popover>
          
          <span class="user-name">欢迎, {{ user.username }}</span>
          <el-dropdown @command="handleUserCommand">
            <el-avatar class="user-avatar" :size="30">{{ user.username ? user.username.charAt(0).toUpperCase() : 'U' }}</el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 主要内容 -->
      <el-main class="layout-main">
        <slot></slot>
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { House, Document, Upload, User, Expand, Fold, Bell } from '@element-plus/icons-vue'
import { apiClient } from '../config/api'

export default {
  name: 'Layout',
  components: {
    House,
    Document,
    Upload,
    User,
    Expand,
    Fold,
    Bell
  },
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      isCollapse: false,
      activeMenu: '/dashboard',
      notifications: [],
      unreadCount: 0,
      pollingInterval: null
    }
  },
  mounted() {
    // 设置当前激活菜单
    this.activeMenu = this.$route.path
    
    // 从localStorage加载通知
    this.loadNotifications()
    
    // 开始轮询检查新通知
    this.startPolling()
  },
  beforeUnmount() {
    // 清除轮询
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
    }
  },
  methods: {
    toggleMenu() {
      this.isCollapse = !this.isCollapse
    },
    
    handleMenuSelect(index) {
      this.activeMenu = index
    },
    
    handleUserCommand(command) {
      switch (command) {
        case 'logout':
          this.handleLogout()
          break
        case 'profile':
          this.$router.push('/profile')
          break
      }
    },
    
    handleLogout() {
      // 清除登录状态
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      localStorage.removeItem('refreshToken')
      
      // 跳转到登录页
      this.$router.push('/login')
    },
    
    // 添加通知
    addNotification(title, message, type = 'info') {
      const notification = {
        id: Date.now() + Math.random(),
        title,
        message,
        type,
        time: new Date(),
        read: false
      }
      
      this.notifications.unshift(notification)
      this.unreadCount++
      
      // 限制通知数量为50条
      if (this.notifications.length > 50) {
        this.notifications = this.notifications.slice(0, 50)
      }
      
      // 保存到localStorage
      this.saveNotifications()
    },
    
    // 格式化时间
    formatTime(time) {
      const date = new Date(time)
      const now = new Date()
      
      // 如果是今天，只显示时间
      if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
      }
      
      // 如果是今年，显示月日和时间
      if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString('zh-CN', { 
          month: 'short', 
          day: 'numeric',
          hour: '2-digit', 
          minute: '2-digit' 
        })
      }
      
      // 其他情况显示完整日期
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    },
    
    // 标记所有通知为已读
    markNotificationsAsRead() {
      this.notifications.forEach(notification => {
        notification.read = true
      })
      this.unreadCount = 0
      this.saveNotifications()
    },
    
    // 清空所有通知
    clearNotifications() {
      this.notifications = []
      this.unreadCount = 0
      this.saveNotifications()
    },
    
    // 保存通知到localStorage
    saveNotifications() {
      try {
        const data = {
          notifications: this.notifications.map(n => ({
            ...n,
            time: n.time instanceof Date ? n.time.toISOString() : n.time
          })),
          unreadCount: this.unreadCount
        }
        localStorage.setItem('appNotifications', JSON.stringify(data))
      } catch (e) {
        console.error('保存通知失败:', e)
      }
    },
    
    // 从localStorage加载通知
    loadNotifications() {
      try {
        const data = localStorage.getItem('appNotifications')
        if (data) {
          const parsed = JSON.parse(data)
          this.notifications = parsed.notifications.map(n => ({
            ...n,
            time: new Date(n.time)
          }))
          this.unreadCount = parsed.unreadCount || 0
        }
      } catch (e) {
        console.error('加载通知失败:', e)
      }
    },
    
    // 开始轮询检查新通知
    startPolling() {
      // 每10秒检查一次新文件和处理状态
      this.pollingInterval = setInterval(() => {
        this.checkForNewFiles()
        this.checkProcessingStatus()
      }, 10000)
    },
    
    // 检查新文件
    async checkForNewFiles() {
      try {
        const response = await apiClient.get('/audio-files')
        if (response.data.success) {
          // 检查是否有新文件
          const storedFiles = JSON.parse(localStorage.getItem('knownFiles') || '[]')
          const currentFiles = response.data.data
          
          // 找出新文件
          const newFiles = currentFiles.filter(file => 
            !storedFiles.some(stored => stored.id === file.id)
          )
          
          // 添加新文件通知
          newFiles.forEach(file => {
            this.addNotification(
              '新文件上传',
              `文件 "${file.original_name || file.filename}" 已成功上传`,
              'success'
            )
          })
          
          // 保存已知文件列表
          localStorage.setItem('knownFiles', JSON.stringify(currentFiles))
        }
      } catch (error) {
        console.error('检查新文件失败:', error)
      }
    },
    
    // 检查处理状态
    async checkProcessingStatus() {
      try {
        const response = await apiClient.get('/audio-files')
        if (response.data.success) {
          const files = response.data.data
          
          // 检查已完成处理的文件
          for (const file of files) {
            // 如果文件有风险等级且不是"未检测"，说明已完成处理
            if (file.risk_level && file.risk_level !== '未检测') {
              // 检查是否已通知过
              const notifiedFiles = JSON.parse(localStorage.getItem('notifiedFiles') || '[]')
              if (!notifiedFiles.includes(file.id)) {
                // 添加处理完成通知
                this.addNotification(
                  '处理完成',
                  `文件 "${file.original_name || file.filename}" 处理完成，风险等级: ${file.risk_level}`,
                  'success'
                )
                
                // 标记为已通知
                notifiedFiles.push(file.id)
                localStorage.setItem('notifiedFiles', JSON.stringify(notifiedFiles))
              }
            }
          }
        }
      } catch (error) {
        console.error('检查处理状态失败:', error)
      }
    }
  },
  watch: {
    $route(to) {
      this.activeMenu = to.path
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

/* 侧边栏样式 */
.layout-aside {
  background-color: #304156;
  color: #fff;
  transition: width 0.3s ease;
  box-shadow: 2px 0 6px rgba(0, 21, 41, 0.35);
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2c3e50;
  color: #fff;
  overflow: hidden;
}

.logo h2 {
  margin: 0;
  font-weight: 600;
  font-size: 18px;
}

/* 菜单样式 */
.layout-menu {
  border: none;
}

/* 头部样式 */
.layout-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.12);
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
}

.menu-toggle {
  font-size: 20px;
  cursor: pointer;
  margin-right: 20px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-icon {
  cursor: pointer;
  padding: 5px;
}

.notification-icon:hover {
  color: #409eff;
}

.user-name {
  margin-right: 10px;
  font-size: 14px;
  color: #666;
}

.user-avatar {
  background-color: #409eff;
  color: white;
  cursor: pointer;
}

/* 通知面板样式 */
.notification-panel {
  padding: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
  font-weight: bold;
}

.notification-list {
  max-height: 300px;
  overflow-y: auto;
}

.notification-item {
  padding: 12px 15px;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background-color 0.2s;
}

.notification-item:hover {
  background-color: #f5f7fa;
}

.notification-item.unread {
  background-color: #f0f8ff;
}

.notification-title {
  font-weight: 500;
  margin-bottom: 5px;
  color: #333;
}

.notification-message {
  font-size: 13px;
  color: #666;
  margin-bottom: 5px;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: #999;
}

.no-notifications {
  padding: 30px;
  text-align: center;
  color: #999;
}

/* 主体内容样式 */
.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>