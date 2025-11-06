import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import axios from 'axios'
import App from './App.vue'
import router from './router'

// 配置 axios 基础路径
axios.defaults.baseURL = 'http://localhost:3000/api'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')