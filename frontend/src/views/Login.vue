<template>
  <div class="login-container">
    <div class="login-form">
      <el-card class="login-card" shadow="always">
        <template #header>
          <div class="card-header">
            <div class="logo-container">
              <div class="logo-icon">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="#409eff">
                  <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,6A6,6 0 0,0 6,12A6,6 0 0,0 12,18A6,6 0 0,0 18,12A6,6 0 0,0 12,6M12,8A4,4 0 0,1 16,12A4,4 0 0,1 12,16A4,4 0 0,1 8,12A4,4 0 0,1 12,8Z" />
                </svg>
              </div>
              <h1>AI检漏管理系统</h1>
            </div>
            <h2>用户登录</h2>
            <p class="subtitle">请输入您的账户信息以访问系统</p>
          </div>
        </template>
        
        <el-form 
          :model="loginForm" 
          :rules="loginRules" 
          ref="loginFormRef"
          label-position="top"
          v-loading="loading"
          element-loading-text="正在登录..."
        >
          <el-form-item label="用户名" prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="请输入用户名"
              size="large"
              :prefix-icon="userIcon"
              minlength="3"
              maxlength="20"
            />
          </el-form-item>
          
          <el-form-item label="密码" prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password"
              placeholder="请输入密码"
              size="large"
              :prefix-icon="lockIcon"
              minlength="6"
              maxlength="20"
              show-password
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleLogin" 
              :loading="loading"
              size="large"
              round
              style="width: 100%"
            >
              <span v-if="!loading">登录系统</span>
              <span v-else>正在登录...</span>
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
      
      <div class="login-footer">
        <p>© 2025 AI检漏管理系统. 保留所有权利.</p>
      </div>
    </div>
  </div>
</template>

<script>
import { apiClient } from '../config/api'
import { User, Lock } from '@element-plus/icons-vue'
import { markRaw } from 'vue'

export default {
  name: 'Login',
  components: {
    User,
    Lock,
  },
  data() {
    return {
      userIcon: markRaw(User),
      lockIcon: markRaw(Lock),
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少6个字符', trigger: 'blur' }
        ]
      },
      loading: false
    }
  },
  
  methods: {
    handleLogin() {
      this.$refs.loginFormRef.validate(async (valid) => {
        if (valid) {
          this.loading = true
          
          try {
            const response = await apiClient.post('/login', this.loginForm)
            
            if (response.data.success) {
              // 保存JWT token和用户信息
              localStorage.setItem('token', response.data.data.accessToken)
              localStorage.setItem('refreshToken', response.data.data.refreshToken)
              localStorage.setItem('user', JSON.stringify(response.data.data.user))
              
              // 跳转到仪表板
              this.$router.push('/dashboard')
              
              this.$message.success('登录成功')
            } else {
              this.$message.error(response.data.message || '登录失败')
            }
          } catch (error) {
            this.$message.error('登录失败')
          } finally {
            this.loading = false
          }
        }
      })
    }
  }
}
</script>

<style scoped>
/* 企业级登录页面样式 - 简约现代 */
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1890ff;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

/* 背景几何装饰 */
.login-container::before {
  content: "";
  position: absolute;
  top: -10%;
  right: -5%;
  width: 400px;
  height: 400px;
  background: #e6f0ff;
  border-radius: 50%;
  opacity: 0.4;
  pointer-events: none;
}

.login-container::after {
  content: "";
  position: absolute;
  bottom: -10%;
  left: -5%;
  width: 350px;
  height: 350px;
  background: #f0e6ff;
  border-radius: 50%;
  opacity: 0.3;
  pointer-events: none;
}

.login-card {
  width: 600px;
  border-radius: 12px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* 头部区域 */
.card-header {
  padding: 40px 40px 30px;
  text-align: center;
  background: #ffffff;
}

.logo-container {
  text-align: center;
}

.logo-icon {
  margin-bottom: 20px;
}

.logo-icon svg {
  fill: #1890ff;
}

.card-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1890ff;
  letter-spacing: 0.5px;
}

.card-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
  color: #333333;
}

.subtitle {
  margin: 0;
  color: #666666;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

/* 表单区 */
.login-form {
  padding: 30px 40px 40px;
}

.login-form :deep(.el-form) {
  width: 100%;
}

.login-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #333333;
  font-size: 14px;
}

.login-form :deep(.el-input__wrapper) {
  background: #f7f8fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 15px;
  box-shadow: none;
  transition: all 0.3s ease;
}

.login-form :deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  border-color: #1890ff;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.login-form :deep(.el-input__inner) {
  color: #333333;
  font-size: 14px;
}

.login-form :deep(.el-button--primary) {
  background: #1890ff;
  border: none;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.login-form :deep(.el-button--primary:hover) {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.login-form :deep(.el-button--primary:active) {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  color: white;
  font-size: 13px;
  margin-top: 30px;
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    max-width: 90%;
  }
  
  .card-header {
    padding: 30px 25px 20px;
  }
  
  .card-header h1 {
    font-size: 24px;
  }
  
  .card-header h2 {
    font-size: 18px;
  }
  
  .login-form {
    padding: 25px 25px 35px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 15px;
  }
  
  .login-card {
    max-width: 100%;
  }
  
  .card-header {
    padding: 25px 20px 15px;
  }
  
  .login-form {
    padding: 20px 20px 30px;
  }
  
  .card-header h1 {
    font-size: 22px;
  }
  
  .card-header h2 {
    font-size: 16px;
  }
  
  .subtitle {
    font-size: 13px;
  }
}
</style>