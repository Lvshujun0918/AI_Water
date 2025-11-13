<template>
  <Layout :user="currentUser">
    <div class="profile-container">
      <el-card class="profile-card">
        <template #header>
          <div class="card-header">
            <h2>个人资料</h2>
          </div>
        </template>
        
        <el-form
          ref="profileForm"
          :model="profileForm"
          :rules="rules"
          label-width="100px"
          class="profile-form"
        >
          <el-form-item label="用户ID">
            <el-input v-model="profileForm.id" disabled></el-input>
          </el-form-item>
          
          <el-form-item label="用户名" prop="username">
            <el-input v-model="profileForm.username" disabled></el-input>
          </el-form-item>
          
          <el-form-item label="创建时间">
            <el-input v-model="profileForm.created_at" disabled></el-input>
          </el-form-item>
          
          <el-form-item label="旧密码" prop="oldPassword">
            <el-input 
              v-model="profileForm.oldPassword" 
              type="password" 
              placeholder="请输入当前密码"
              show-password
            ></el-input>
          </el-form-item>
          
          <el-form-item label="新密码" prop="newPassword">
            <el-input 
              v-model="profileForm.newPassword" 
              type="password" 
              placeholder="请输入新密码"
              show-password
            ></el-input>
          </el-form-item>
          
          <el-form-item label="确认密码" prop="confirmPassword">
            <el-input 
              v-model="profileForm.confirmPassword" 
              type="password" 
              placeholder="请再次输入新密码"
              show-password
            ></el-input>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="updatePassword"
              :loading="updating"
            >
              更新密码
            </el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </Layout>
</template>

<script>
import Layout from '../components/Layout.vue'
import { apiClient } from '../config/api'
import { ElMessageBox } from 'element-plus'

export default {
  name: 'Profile',
  components: {
    Layout
  },
  data() {
    // 确认密码验证规则
    const validateConfirmPassword = (rule, value, callback) => {
      if (this.profileForm.newPassword && !value) {
        callback(new Error('请确认新密码'))
      } else if (this.profileForm.newPassword && value !== this.profileForm.newPassword) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    }
    
    return {
      currentUser: {},
      profileForm: {
        id: '',
        username: '',
        created_at: '',
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      updating: false,
      rules: {
        oldPassword: [
          { required: true, message: '请输入当前密码', trigger: 'blur' }
        ],
        newPassword: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, max: 20, message: '密码长度应在6到20个字符之间', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '请确认新密码', trigger: 'blur' },
          { validator: validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  
  async mounted() {
    await this.fetchUserProfile();
  },
  
  methods: {
    async fetchUserProfile() {
      try {
        const response = await apiClient.get('/users/profile');
        if (response.data.success) {
          const user = response.data.data;
          this.currentUser = user;
          this.profileForm.id = user.id;
          this.profileForm.username = user.username;
          this.profileForm.created_at = user.created_at;
        } else {
          this.$message.error(response.data.message || '获取用户信息失败');
        }
      } catch (error) {
        this.$message.error('获取用户信息失败: ' + (error.response?.data?.message || error.message));
      }
    },
    
    updatePassword() {
      this.$refs.profileForm.validate(async (valid) => {
        if (valid) {
          this.updating = true
          try {
            const response = await apiClient.put('/users/change-password', {
              oldPassword: this.profileForm.oldPassword,
              newPassword: this.profileForm.newPassword
            })
            
            if (response.data.success) {
              this.$message.success(response.data.message)
              
              // 添加成功提示框
              ElMessageBox.confirm(
                '密码已更新成功，是否需要重新登录以确保账户安全？',
                '提示',
                {
                  confirmButtonText: '重新登录',
                  cancelButtonText: '稍后再说',
                  type: 'warning',
                  center: true
                }
              ).then(() => {
                // 用户点击确认，执行登出操作
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                localStorage.removeItem('isLoggedIn');
                window.location.href = '/login';
              }).catch(() => {
                // 用户点击取消，重置表单
                this.resetForm()
              })
            } else {
              this.$message.error(response.data.message)
              // 如果是旧密码错误，聚焦到旧密码输入框
              if (response.data.message === '旧密码错误') {
                this.$refs.profileForm.scrollToField('oldPassword')
              }
            }
          } catch (error) {
            this.$message.error('密码更新失败: ' + (error.response?.data?.message || error.message))
            // 如果是旧密码错误，聚焦到旧密码输入框
            if (error.response?.data?.message === '旧密码错误') {
              this.$refs.profileForm.scrollToField('oldPassword')
            }
          } finally {
            this.updating = false
          }
        } else {
          this.$message.warning('请正确填写表单信息')
          return false
        }
      })
    },
    
    resetForm() {
      this.$refs.profileForm.resetFields()
    },
    
    handleLogout() {
      // 清除登录状态
      localStorage.removeItem('isLoggedIn')
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      
      // 跳转到登录页
      this.$router.push('/login')
    }
  }
}
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 600px;
  margin: 0 auto;
}

.card-header {
  text-align: center;
}

.profile-form {
  margin-top: 20px;
}

.profile-form .el-form-item {
  margin-bottom: 25px;
}
</style>