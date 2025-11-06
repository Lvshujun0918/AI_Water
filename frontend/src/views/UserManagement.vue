<template>
  <Layout :user="user">
    <el-card class="users-card">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" @click="handleAdd">新增用户</el-button>
        </div>
      </template>
      
      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="role" label="角色" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="250">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button size="small" type="primary" @click="handleResetPassword(scope.row)">重置密码</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 用户编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" placeholder="请选择角色" style="width: 100%">
            <el-option label="管理员" value="admin" />
            <el-option label="普通用户" value="user" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser">保存</el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script>
import Layout from '../components/Layout.vue'

export default {
  name: 'UserManagement',
  components: {
    Layout
  },
  data() {
    return {
      user: {},
      loading: false,
      users: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      dialogVisible: false,
      dialogTitle: '',
      form: {
        id: null,
        username: '',
        role: ''
      },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' }
        ],
        role: [
          { required: true, message: '请选择角色', trigger: 'change' }
        ]
      }
    }
  },
  mounted() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
    this.loadUsers()
  },
  methods: {
    loadUsers() {
      this.loading = true
      // 模拟加载数据
      setTimeout(() => {
        this.users = [
          { id: 1, username: 'admin', role: '管理员', createTime: '2023-01-01 12:00:00' }
        ]
        this.pagination.total = this.users.length
        this.loading = false
      }, 500)
    },
    
    handleAdd() {
      this.dialogTitle = '新增用户'
      this.form = { id: null, username: '', role: '' }
      this.dialogVisible = true
    },
    
    handleEdit(row) {
      this.dialogTitle = '编辑用户'
      this.form = { ...row }
      this.dialogVisible = true
    },
    
    handleResetPassword(row) {
      this.$confirm(`确认重置用户 ${row.username} 的密码吗？`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟重置密码操作
        this.$message.success('密码已重置为默认密码')
      }).catch(() => {
        // 用户取消操作
      })
    },
    
    handleDelete(row) {
      this.$confirm(`确认删除用户 ${row.username} 吗？`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.$message.success('删除成功')
        this.loadUsers()
      }).catch(() => {
        // 用户取消删除
      })
    },
    
    saveUser() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          // 模拟保存操作
          this.$message.success('保存成功')
          this.dialogVisible = false
          this.loadUsers()
        }
      })
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadUsers()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadUsers()
    }
  }
}
</script>

<style scoped>
.users-card {
  margin: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>