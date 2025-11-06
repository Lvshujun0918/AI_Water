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
          <span class="user-name">欢迎, {{ user.username }}</span>
          <el-dropdown @command="handleUserCommand">
            <el-avatar class="user-avatar" :size="30">{{ user.username ? user.username.charAt(0).toUpperCase() : 'U' }}</el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                <el-dropdown-item command="settings">设置</el-dropdown-item>
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
import { House, Document, Upload, User, Expand, Fold } from '@element-plus/icons-vue'

export default {
  name: 'Layout',
  components: {
    House,
    Document,
    Upload,
    User,
    Expand,
    Fold
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
      activeMenu: '/dashboard'
    }
  },
  mounted() {
    // 设置当前激活菜单
    this.activeMenu = this.$route.path
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
          this.$message.info('个人资料功能待开发')
          break
        case 'settings':
          this.$message.info('设置功能待开发')
          break
      }
    },
    
    handleLogout() {
      // 清除登录状态
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('user')
      
      // 跳转到登录页
      this.$router.push('/login')
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
  z-index: 1001;
  overflow: hidden;
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2c3e50;
}

.logo h2 {
  color: #fff;
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layout-menu {
  border-right: none;
  height: calc(100% - 60px);
}

.layout-menu :deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
}

.layout-menu :deep(.el-menu-item:hover) {
  background-color: #25354a !important;
}

.layout-menu :deep(.el-menu-item.is-active) {
  background-color: #25354a !important;
}

/* 头部样式 */
.layout-header {
  background-color: #fff;
  color: #333;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.12);
  z-index: 1000;
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

.user-name {
  font-size: 14px;
  color: #666;
}

.user-avatar {
  cursor: pointer;
  background-color: #409eff;
}

/* 主体内容样式 */
.layout-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
  height: calc(100% - 60px);
}
</style>