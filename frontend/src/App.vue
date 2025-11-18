<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
  min-height: 100vh;
  background-color: #f0f2f5;
}

body {
  margin: 0;
  padding: 0;
  font-size: 14px;
  line-height: 1.5;
}

* {
  box-sizing: border-box;
}

/* 滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-thumb {
  background-color: #c1c1c1;
  border-radius: 4px;
  transition: background-color 0.3s;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #a8a8a8;
}

::-webkit-scrollbar-track {
  background-color: #f1f1f1;
  border-radius: 4px;
}

/* Element Plus 组件样式覆盖 */
.el-card {
  border-radius: 8px;
  border: 1px solid #e1e1e1;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.el-card:hover {
  box-shadow: 0 4px 20px 0 rgba(0, 0, 0, 0.12);
}

.el-button {
  border-radius: 4px;
  transition: all 0.2s ease;
}

.el-button:hover {
  transform: translateY(-1px);
}

.el-input__wrapper {
  border-radius: 4px;
}

.el-menu {
  border-right: none;
}

.el-table {
  background-color: #fff;
  border-radius: 4px;
  overflow: hidden;
}

.el-table th {
  background-color: #fafafa;
}

.el-table .el-table__row:hover {
  background-color: #f5f7fa;
}

/* 页面标题样式 */
.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #ebeef5;
}

/* 卡片标题样式 */
.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 15px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-card {
    margin: 0 10px;
  }
  
  body {
    font-size: 13px;
  }
  
  .page-title {
    font-size: 18px;
    margin-bottom: 15px;
    padding-bottom: 12px;
  }
}

@media (max-width: 480px) {
  body {
    font-size: 12px;
  }
  
  .page-title {
    font-size: 16px;
    margin-bottom: 12px;
    padding-bottom: 10px;
  }
  
  .card-title {
    font-size: 14px;
    margin-bottom: 12px;
  }
}
</style>