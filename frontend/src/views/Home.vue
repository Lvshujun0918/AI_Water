<template>
  <div class="home-container">
    <div class="init-form" v-if="!initialized && initChecked">
      <el-card class="init-card" shadow="always">
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
        <p>© 2025 AI检漏管理系统. 保留所有权利.</p>
      </div>
    </div>
    
    <div class="init-success" v-else-if="initialized && !initChecked">
      <el-card class="success-card" shadow="always">
        <el-result 
          icon="success" 
          title="系统初始化成功" 
          subTitle="管理员账户已创建，正在跳转到登录页面..."
        >
        </el-result>
      </el-card>
    </div>
    
    <div class="checking-status" v-else>
      <!-- 空白占位，避免显示初始化界面 -->
    </div>
  </div>
</template>

<script>
import { apiClient } from '../config/api'
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
      initChecked: false, // 标记是否已完成初始化检查
      loading: false,
      initForm: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      
      // 表单验证规则
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
        const response = await apiClient.get('/init-status')
        this.initialized = response.data.initialized
        this.initChecked = true // 标记已完成初始化检查
        
        // 如果已经初始化完成，立即跳转到登录页面
        if (this.initialized) {
          this.$router.push('/login')
        }
      } catch (error) {
        this.$message.error('检查初始化状态失败')
        this.initChecked = true
      }
    },
    
    // 初始化系统
    handleInit() {
      this.$refs.initFormRef.validate(async (valid) => {
        if (valid) {
          this.loading = true
          
          try {
            const response = await apiClient.post('/init-admin', this.initForm)
            
            if (response.data.success) {
              this.$message.success('系统初始化成功')
              this.initialized = true
              
              // 初始化成功后立即跳转到登录页面
              this.$router.push('/login')
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
/* Home 页面样式 - 与登录页统一风格 */
.home-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
  padding: 20px;
  position: relative;
  overflow: hidden;
}

.home-container::before {
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

.home-container::after {
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

.init-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.init-card :deep(.el-card__header) {
  padding: 40px 40px 30px;
  border-bottom: 1px solid #f0f0f0;
  background: #ffffff;
}

.card-header {
  text-align: center;
}

.logo-container {
  margin-bottom: 20px;
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
}

.init-form { 
  width: 100%;
}

.init-card :deep(.el-card__body) {
  padding: 30px 40px 40px;
}

.init-form :deep(.el-form-item__label) {
  font-weight: 600;
  color: #333333;
}

.init-form :deep(.el-input__wrapper) {
  background: #f7f8fa;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 12px 15px;
  box-shadow: none;
  transition: all 0.3s ease;
}

.init-form :deep(.el-input__wrapper:hover) {
  border-color: #c0c4cc;
}

.init-form :deep(.el-input__wrapper.is-focus) {
  border-color: #1890ff;
  background: #ffffff;
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.init-form :deep(.el-button--primary) {
  background: #1890ff;
  border: none;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: 600;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(24, 144, 255, 0.3);
  transition: all 0.3s ease;
}

.init-form :deep(.el-button--primary:hover) {
  background: #40a9ff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(24, 144, 255, 0.4);
}

.success-card {
  width: 100%;
  max-width: 450px;
  border-radius: 12px;
  background: #ffffff;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;
}

.init-success {
  width: 100%;
  max-width: 450px;
  text-align: center;
}

.init-footer {
  text-align: center;
  color: #999999;
  font-size: 13px;
  margin-top: 20px;
  position: relative;
  z-index: 1;
}

@media (max-width: 768px) {
  .init-card,
  .success-card {
    max-width: 90%;
  }
  
  .init-card :deep(.el-card__header) {
    padding: 30px 25px 20px;
  }
  
  .init-card :deep(.el-card__body) {
    padding: 25px 25px 35px;
  }
  
  .card-header h1 {
    font-size: 24px;
  }
  
  .card-header h2 {
    font-size: 18px;
  }
}

@media (max-width: 480px) {
  .home-container {
    padding: 15px;
  }
  
  .init-card,
  .success-card {
    max-width: 100%;
  }
  
  .init-card :deep(.el-card__header) {
    padding: 25px 20px 15px;
  }
  
  .init-card :deep(.el-card__body) {
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