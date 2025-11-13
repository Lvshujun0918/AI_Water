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
    REFRESH_TOKEN: '/auth/refresh',
    
    // 用户相关
    GET_PROFILE: '/users/profile',
    CHANGE_PASSWORD: '/users/change-password',
    
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

// 存储刷新令牌的请求Promise，防止并发请求
let refreshingPromise = null;

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
  async (error) => {
    const originalRequest = error.config;
    
    // 检查是否是登录请求
    const isLoginRequest = originalRequest && originalRequest.url.includes('/login');
    
    // 检查是否是密码更新相关的401错误
    const isPasswordUpdateRequest = error.config && error.config.url.includes('/users/change-password');
    const isOldPasswordError = error.response && 
                              error.response.status === 401 && 
                              error.response.data && 
                              error.response.data.message === '旧密码错误';
    
    // 只有不是登录请求且不是旧密码错误时才执行登出操作
    if (error.response && error.response.status === 401 && !isLoginRequest && !(isPasswordUpdateRequest && isOldPasswordError)) {
      // 如果是访问令牌过期且不是刷新令牌请求
      if (!originalRequest._retry && !originalRequest.url.includes('/auth/refresh')) {
        originalRequest._retry = true;
        
        // 如果没有刷新令牌，则直接登出
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          handleLogout();
          return Promise.reject(error);
        }
        
        // 防止并发刷新请求
        if (!refreshingPromise) {
          refreshingPromise = refreshAccessToken(refreshToken);
        }
        
        try {
          const newToken = await refreshingPromise;
          refreshingPromise = null;
          
          if (newToken) {
            localStorage.setItem('token', newToken);
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            return apiClient(originalRequest);
          } else {
            handleLogout();
            return Promise.reject(error);
          }
        } catch (refreshError) {
          refreshingPromise = null;
          handleLogout();
          return Promise.reject(error);
        }
      } else {
        // token无效或过期，清除本地存储并提示用户重新登录
        handleLogout();
      }
    }
    return Promise.reject(error);
  }
);

// 刷新访问令牌
async function refreshAccessToken(refreshToken) {
  try {
    const response = await axios.post(`${API_CONFIG.BASE_URL}${API_CONFIG.API_PREFIX}${API_CONFIG.ENDPOINTS.REFRESH_TOKEN}`, {
      refreshToken
    });
    
    if (response.data.success) {
      return response.data.data.accessToken;
    }
    return null;
  } catch (error) {
    return null;
  }
}

// 处理登出逻辑
function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  localStorage.removeItem('isLoggedIn');
  
  // 显示提示框，用户点击确认后跳转到登录页
  import('element-plus').then(({ ElMessageBox }) => {
    ElMessageBox.alert('登录状态已过期，请重新登录', '提示', {
      confirmButtonText: '重新登录',
      type: 'warning',
      center: true,
      callback: () => {
        window.location.href = '/login';
      }
    });
  });
}

export { apiClient };
export default API_CONFIG;