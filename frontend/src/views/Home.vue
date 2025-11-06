<template>
  <div class="home-container">
    <div class="init-form" v-if="!initialized">
      <el-card class="init-card">
        <template #header>
          <div class="card-header">
            <h2>RISC-V 管理系统初始化</h2>
          </div>
        </template>
        
        <el-form 
          :model="initForm" 
          :rules="initRules" 
          ref="initFormRef"
          label-width="100px"
          v-loading="loading"
        >
          <el-form-item label="管理员用户名" prop="username">
            <el-input 
              v-model="initForm.username" 
              placeholder="请输入管理员用户名"
              minlength="3"
              maxlength="20"
            />
          </el-form-item>
          
          <el-form-item label="管理员密码" prop="password">
            <el-input 
              v-model="initForm.password" 
              type="password"
              placeholder="请输入管理员密码"
              minlength="6"
              maxlength="20"
            />
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input 
              v-model="initForm.confirmPassword" 
              type="password"
              placeholder="请再次输入密码"
            />
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="handleInit" 
              :loading="loading"
              style="width: 100%"
            >
              初始化系统
            </el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
    
    <div class="init-success" v-else>
      <el-result 
        icon="success" 
        title="系统初始化成功" 
        subTitle="您可以使用管理员账户登录系统"
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
import API_CONFIG from '../config/api'

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
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.init-card {
  width: 100%;
  max-width: 500px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #333;
}

.init-success {
  width: 100%;
  max-width: 500px;
  text-align: center;
}
</style>