<template>
  <div class="init-container">
    <div class="init-box" v-if="!initialized">
      <h2 class="init-title">系统初始化</h2>
      <p class="init-description">请设置管理员账户用户名和密码</p>
      
      <el-form 
        ref="initFormRef" 
        :model="initForm" 
        :rules="initRules" 
        class="init-form"
        @submit.prevent="handleInit"
      >
        <el-form-item prop="username">
          <el-input 
            v-model="initForm.username" 
            placeholder="请输入管理员用户名" 
            prefix-icon="User"
            size="large"
          />
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="initForm.password" 
            type="password" 
            placeholder="请输入管理员密码" 
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item prop="confirmPassword">
          <el-input 
            v-model="initForm.confirmPassword" 
            type="password" 
            placeholder="请确认管理员密码" 
            prefix-icon="Lock"
            size="large"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button 
            type="primary" 
            size="large" 
            class="init-button"
            :loading="loading"
            @click="handleInit"
          >
            {{ loading ? '初始化中...' : '初始化系统' }}
          </el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div class="init-success" v-else>
      <el-result 
        icon="success" 
        title="系统已初始化" 
        sub-title="您可以使用管理员账户登录系统"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/login')">前往登录</el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script>
import axios from 'axios'

export default {
  name: 'Home',
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
          { min: 3, message: '用户名长度不能少于3个字符', trigger: 'blur' }
        ],
        password: [
          { required: true, message: '请输入密码', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6个字符', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  async mounted() {
    // 检查系统是否已初始化
    try {
      const response = await axios.get('/init-status')
      if (response.data.success) {
        this.initialized = response.data.initialized
      }
    } catch (error) {
      this.$message.error('检查初始化状态失败')
    }
  },
  methods: {
    handleInit() {
      this.$refs.initFormRef.validate(async (valid) => {
        if (valid) {
          this.loading = true
          
          try {
            const response = await axios.post('/init-admin', {
              username: this.initForm.username,
              password: this.initForm.password
            })
            
            if (response.data.success) {
              this.$message.success(response.data.message)
              this.initialized = true
            } else {
              this.$message.error(response.data.message)
            }
          } catch (error) {
            this.$message.error('初始化失败，请稍后重试')
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
.init-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.init-box {
  width: 100%;
  max-width: 400px;
  padding: 40px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.init-title {
  margin-bottom: 10px;
  color: #333;
  font-size: 24px;
}

.init-description {
  margin-bottom: 30px;
  color: #666;
}

.init-form {
  margin-top: 20px;
}

.init-button {
  width: 100%;
}
</style>