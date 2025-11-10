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
              <h1>RISC-V 管理系统</h1>
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
        <p>© 2025 RISC-V 管理系统. 保留所有权利.</p>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import API_CONFIG from '../config/api'
import { User, Lock } from '@element-plus/icons-vue'

export default {
  name: 'Login',
  components: {
    User,
    Lock,
  },
  data() {
    return {
      userIcon: User,
      lockIcon: Lock,
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
            const response = await axios.post(API_CONFIG.ENDPOINTS.LOGIN, this.loginForm)
            
            if (response.data.success) {
              // 保存登录状态和用户信息
              localStorage.setItem('isLoggedIn', 'true')
              localStorage.setItem('user', JSON.stringify(response.data.user))
              
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
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
}

.login-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="80" r="1" fill="rgba(255,255,255,0.1)"/></svg>');
  background-size: 100px 100px;
  opacity: 0.3;
}

.login-card {
  width: 100%;
  max-width: 500px;
  border-radius: 16px;
  border: none;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
  margin-bottom: 20px;
}

.card-header {
  text-align: center;
  padding: 20px 0;
}

.logo-container {
  margin-bottom: 20px;
}

.logo-icon {
  margin-bottom: 15px;
}

.card-header h1 {
  margin: 0 0 10px 0;
  font-size: 28px;
  font-weight: 700;
  color: #333;
  letter-spacing: 1px;
}

.card-header h2 {
  margin: 0 0 10px 0;
  font-size: 22px;
  font-weight: 600;
  color: #409eff;
}

.subtitle {
  margin: 0;
  color: #666;
  font-size: 15px;
  line-height: 1.6;
}

.login-form { 
  width: 500px;
}

.login-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #333;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 5px 15px;
}

.login-footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .login-card {
    max-width: 90%;
    margin: 0 15px;
  }
  
  .card-header h1 {
    font-size: 24px;
  }
  
  .card-header h2 {
    font-size: 20px;
  }
}
</style>