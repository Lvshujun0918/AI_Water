<template>
  <div class="home-container">
    <div class="init-form" v-if="!initialized">
      <el-card class="init-card" shadow="always">
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
            <h2>系统初始化</h2>
            <p class="subtitle">请设置管理员账户信息以完成系统初始化</p>
          </div>
        </template>
        
        <el-form 
          :model="initForm" 
          :rules="initRules" 
          ref="initFormRef"
          label-position="top"
          v-loading="loading"
          element-loading-text="正在初始化系统..."
        >
          <el-form-item label="管理员用户名" prop="username">
            <el-input 
              v-model="initForm.username" 
              placeholder="请输入管理员用户名"
              size="large"
              :prefix-icon="userIcon"
              minlength="3"
              maxlength="20"
            />
          </el-form-item>
          
          <el-form-item label="管理员密码" prop="password">
            <el-input 
              v-model="initForm.password" 
              type="password"
              placeholder="请输入管理员密码"
              size="large"
              :prefix-icon="lockIcon"
              minlength="6"
              maxlength="20"
              show-password
            />
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input 
              v-model="initForm.confirmPassword" 
              type="password"
              placeholder="请再次输入密码"
              size="large"
              :prefix-icon="lockIcon"
              show-password
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleInit" 
              :loading="loading"
              size="large"
              round
              style="width: 100%"
            >
              <span v-if="!loading">完成初始化</span>
              <span v-else>正在初始化...</span>
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
      
      <div class="init-footer">
        <p>© 2025 RISC-V 管理系统. 保留所有权利.</p>
      </div>
    </div>
    
    <div class="init-success" v-else>
      <el-card class="success-card" shadow="always">
        <el-result 
          icon="success" 
          title="系统初始化成功" 
          subTitle="管理员账户已创建，您可以使用该账户登录系统"
        >
          <template #extra>
            <el-button type="primary" @click="$router.push('/login')" size="large" round>
              前往登录页面
            </el-button>
          </template>
        </el-result>
      </el-card>
    </div>
  </div>
</template>

<script>
import axios from 'axios'
import API_CONFIG from '../config/api'
import { User, Lock } from '@element-plus/icons-vue'

export default {
  name: 'Home',
  components: {
    User,
    Lock,
  },
  data() {
    // 确认密码验证规则
    const validateConfirmPassword = (rule, value, callback) => {
      if (value !== this.initForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    
    return {
      userIcon: User,
      lockIcon: Lock,
      initialized: false,
      loading: false,
      initForm: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      initRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { min: 3, message: '用户名至少3个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码至少6个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  
  async mounted() {
    await this.checkInitStatus()
  },
  
  methods: {
    // 检查系统初始化状态
    async checkInitStatus() {
      try {
        const response = await axios.get(API_CONFIG.ENDPOINTS.INIT_STATUS)
        this.initialized = response.data.initialized
      } catch (error) {
        this.$message.error('检查初始化状态失败')
      }
    },
    
    // 初始化系统
    handleInit() {
      this.$refs.initFormRef.validate(async (valid) => {
        if (valid) {
          this.loading = true
          
          try {
            const response = await axios.post(API_CONFIG.ENDPOINTS.INIT_ADMIN, this.initForm)
            
            if (response.data.success) {
              this.$message.success('系统初始化成功')
              this.initialized = true
            } else {
              this.$message.error(response.data.message || '初始化失败')
            }
          } catch (error) {
            this.$message.error('系统初始化失败')
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
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  position: relative;
}

.home-container::before {
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

.init-card {
  width: 100%;
  max-width: 450px;
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

.init-form { 
  width: 500px;
}

.init-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #333;
}

.init-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 5px 15px;
}

.success-card {
  width: 100%;
  max-width: 500px;
  border-radius: 16px;
  border: none;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(10px);
  background: rgba(255, 255, 255, 0.95);
}

.init-success {
  width: 100%;
  max-width: 500px;
  text-align: center;
}

.init-footer {
  text-align: center;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  margin-top: 20px;
}

@media (max-width: 768px) {
  .init-card,
  .success-card {
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