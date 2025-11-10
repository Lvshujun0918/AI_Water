<template>
  <Layout :user="user">
    <div class="user-management-container">
      <el-card class="user-card">
        <template #header>
          <div class="card-header">
            <h2>用户管理</h2>
          </div>
        </template>
        
        <el-table 
          :data="users" 
          v-loading="loading"
          element-loading-text="加载中..."
          style="width: 100%"
        >
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="username" label="用户名" />
          <el-table-column prop="created_at" label="创建时间" width="200" />
        </el-table>
        
        <div class="pagination-container">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </Layout>
</template>

<script>
import Layout from '../components/Layout.vue'
import { apiClient } from '../config/api'

export default {
  name: 'UserManagement',
  components: {
    Layout
  },
  data() {
    return {
      user: {},
      users: [],
      loading: false,
      currentPage: 1,
      pageSize: 10,
      total: 0
    }
  },
  
  async mounted() {
    // 获取当前用户信息
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
    
    // 获取用户列表
    await this.fetchUsers()
  },
  
  methods: {
    async fetchUsers() {
      this.loading = true
      try {
        const response = await apiClient.get('/users', {
          params: {
            page: this.currentPage,
            limit: this.pageSize
          }
        })
        if (response.data.success) {
          this.users = response.data.data
          this.total = response.data.total
        }
      } catch (error) {
        this.$message.error('获取用户列表失败')
      } finally {
        this.loading = false
      }
    },
    
    handleSizeChange(val) {
      this.pageSize = val
      this.currentPage = 1
      this.fetchUsers()
    },
    
    handleCurrentChange(val) {
      this.currentPage = val
      this.fetchUsers()
    }
  }
}
</script>

<style scoped>
.user-management-container {
  padding: 20px;
}

.card-header {
  text-align: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>