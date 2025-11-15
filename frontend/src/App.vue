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
}

::-webkit-scrollbar-track {
  background-color: #f1f1f1;
}

/* Element Plus 组件样式覆盖 */
.el-card {
  border-radius: 4px;
  border: 1px solid #e1e1e1;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.el-button {
  border-radius: 4px;
}

.el-input__wrapper {
  border-radius: 4px;
}

.el-menu {
  border-right: none;
}

.el-table {
  background-color: #fff;
}

.el-table th {
  background-color: #fafafa;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .el-card {
    margin: 0 10px;
  }
}
</style>