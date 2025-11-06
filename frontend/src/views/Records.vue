<template>
  <Layout :user="user">
    <el-card class="records-card">
      <template #header>
        <div class="card-header">
          <span>记录管理</span>
          <el-button type="primary" @click="handleAdd">新增记录</el-button>
        </div>
      </template>
      
      <el-table :data="records" style="width: 100%" v-loading="loading">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" />
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
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
    
    <!-- 编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveRecord">保存</el-button>
      </template>
    </el-dialog>
  </Layout>
</template>

<script>
import Layout from '@/components/Layout.vue'

export default {
  name: 'Records',
  components: {
    Layout
  },
  data() {
    return {
      user: {},
      loading: false,
      records: [],
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      dialogVisible: false,
      dialogTitle: '',
      form: {
        id: null,
        name: '',
        description: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' }
        ]
      }
    }
  },
  mounted() {
    const userStr = localStorage.getItem('user')
    if (userStr) {
      this.user = JSON.parse(userStr)
    }
    this.loadRecords()
  },
  methods: {
    loadRecords() {
      this.loading = true
      // 模拟加载数据
      setTimeout(() => {
        this.records = [
          { id: 1, name: '示例记录1', description: '这是示例记录1的描述', createTime: '2023-01-01 12:00:00' },
          { id: 2, name: '示例记录2', description: '这是示例记录2的描述', createTime: '2023-01-02 12:00:00' }
        ]
        this.pagination.total = this.records.length
        this.loading = false
      }, 500)
    },
    
    handleAdd() {
      this.dialogTitle = '新增记录'
      this.form = { id: null, name: '', description: '' }
      this.dialogVisible = true
    },
    
    handleEdit(row) {
      this.dialogTitle = '编辑记录'
      this.form = { ...row }
      this.dialogVisible = true
    },
    
    handleDelete(row) {
      this.$confirm('确认删除该记录吗？', '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        this.$message.success('删除成功')
        this.loadRecords()
      }).catch(() => {
        // 用户取消删除
      })
    },
    
    saveRecord() {
      this.$refs.formRef.validate((valid) => {
        if (valid) {
          // 模拟保存操作
          this.$message.success('保存成功')
          this.dialogVisible = false
          this.loadRecords()
        }
      })
    },
    
    handleSizeChange(val) {
      this.pagination.pageSize = val
      this.loadRecords()
    },
    
    handleCurrentChange(val) {
      this.pagination.currentPage = val
      this.loadRecords()
    }
  }
}
</script>

<style scoped>
.records-card {
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