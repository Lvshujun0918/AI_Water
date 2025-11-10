// API 配置文件
import axios from 'axios'

const API_CONFIG = {
  // 基础URL
  BASE_URL: 'http://localhost:3000',
  
  // API前缀
  API_PREFIX: '/api',
  
  // 各个接口地址
  ENDPOINTS: {
    // 系统初始化相关
    INIT_STATUS: '/init-status',
    INIT_ADMIN: '/init-admin',
    
    // 用户认证相关
    LOGIN: '/login',
    REGISTER: '/register',
    TEST: '/test',
    
    // 音频文件相关
    UPLOAD_AUDIO: '/upload-audio',
    GET_AUDIO_FILES: '/audio-files',
    DELETE_AUDIO_FILE: (id) => `/audio-files/${id}`
  },
  
  // 构建完整URL的辅助函数
  getFullUrl(endpoint) {
    return `${this.BASE_URL}${this.API_PREFIX}${endpoint}`;
  },
  
  // 获取音频文件完整URL的辅助函数
  getAudioFileUrl(filename) {
    return `${this.BASE_URL}/uploads/${filename}`;
  }
};

// 创建axios实例
const apiClient = axios.create({
  baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}`,
  timeout: 10000,
});

// 请求拦截器 - 添加JWT token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // token无效或过期，清除本地存储并跳转到登录页
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export { apiClient };
export default API_CONFIG;