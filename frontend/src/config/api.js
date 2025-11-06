// API 配置文件
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

export default API_CONFIG;