<template>
  <div class="login-container">
    <div class="login-form">
      <el-card class="login-card">
        <template #header>
          <div class="card-header">
            <h2>RISC-V 管理系统</h2>
          </div>
        </template>
        
        <el-form 
          :model="loginForm" 
          :rules="loginRules" 
          ref="loginFormRef"
          label-width="0px"
          v-loading="loading"
        >
          <el-form-item prop="username">
            <el-input 
              v-model="loginForm.username" 
              placeholder="用户名"
              prefix-icon="User"
              size="large"
            />
          </el-form-item>
          
          <el-form-item prop="password">
            <el-input 
              v-model="loginForm.password" 
              type="password"
              placeholder="密码"
              prefix-icon="Lock"
              size="large"
              @keyup.enter="handleLogin"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleLogin" 
              :loading="loading"
              style="width: 100%"
              size="large"
            >
              登录
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import API_CONFIG from '../config/api'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: ''
      },
      loginRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' }
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
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #333;
}
</style>