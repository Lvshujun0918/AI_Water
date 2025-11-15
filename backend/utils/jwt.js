const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT配置
const JWT_CONFIG = {
  // 使用更安全的密钥生成方式
  ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET || crypto.randomBytes(64).toString('hex'),
  REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET || crypto.randomBytes(64).toString('hex'),
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
};

/**
 * 生成访问令牌
 * @param {Object} payload - 要包含在令牌中的用户信息
 * @returns {String} 签名的JWT访问令牌
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.ACCESS_TOKEN_EXPIRES_IN,
    issuer: 'ai-water-system-admin',
    audience: 'ai-water-system-admin-users'
  });
};

/**
 * 生成刷新令牌
 * @param {Object} payload - 要包含在令牌中的用户信息
 * @returns {String} 签名的JWT刷新令牌
 */
const generateRefreshToken = (payload) => {
  return jwt.sign(payload, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_TOKEN_EXPIRES_IN,
    issuer: 'ai-water-system-admin',
    audience: 'ai-water-system-admin-users'
  });
};

/**
 * 验证访问令牌
 * @param {String} token - JWT令牌
 * @returns {Object|null} 解码后的令牌信息或null（如果验证失败）
 */
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.ACCESS_TOKEN_SECRET, {
      issuer: 'ai-water-system-admin',
      audience: 'ai-water-system-admin-users'
    });
  } catch (error) {
    return null;
  }
};

/**
 * 验证刷新令牌
 * @param {String} token - JWT令牌
 * @returns {Object|null} 解码后的令牌信息或null（如果验证失败）
 */
const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_CONFIG.REFRESH_TOKEN_SECRET, {
      issuer: 'ai-water-system-admin',
      audience: 'ai-water-system-admin-users'
    });
  } catch (error) {
    return null;
  }
};

module.exports = {
  JWT_CONFIG,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};