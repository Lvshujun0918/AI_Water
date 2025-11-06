import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import axios from 'axios'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import API_CONFIG from './config/api'

// 配置 axios 基础 URL
axios.defaults.baseURL = API_CONFIG.getFullUrl('');

const app = createApp(App)

app.use(ElementPlus)
app.use(router)
app.mount('#app')