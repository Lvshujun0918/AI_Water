const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PythonShell } = require('python-shell');
const chokidar = require('chokidar');
const { 
  generateAccessToken, 
  generateRefreshToken, 
  verifyAccessToken,
  JWT_CONFIG
} = require('./utils/jwt');

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '访问被拒绝，缺少访问令牌'
    });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: '令牌无效或已过期'
    });
  }
  
  req.user = decoded;
  next();
};

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 确保上传目录存在
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 中间件，只允许音频文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 生成唯一文件名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// 文件过滤器，只允许音频文件
const fileFilter = (req, file, cb) => {
  // 检查文件类型是否为音频
  if (file.mimetype.startsWith('audio/')) {
    cb(null, true);
  } else {
    cb(new Error('只允许上传音频文件！'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 限制文件大小为50MB
  }
});

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static('uploads')); // 提供静态文件访问

// 初始化 SQLite 数据库
const db = new sqlite3.Database('./users.db', (err) => {
  if (err) {
    console.error('无法连接到 SQLite 数据库:', err.message);
  } else {
    console.log('已连接到 SQLite 数据库');
  }
});

// 创建用户表
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// 创建音频文件表
db.run(`CREATE TABLE IF NOT EXISTS audio_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mimetype TEXT NOT NULL,
  size INTEGER NOT NULL,
  upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER,
  risk_level TEXT DEFAULT '未检测',
  confidence REAL DEFAULT 0.0,
  FOREIGN KEY (user_id) REFERENCES users (id)
)`);

// 检查是否需要初始化数据库
app.get('/api/init-status', (req, res) => {
  const query = `SELECT COUNT(*) as count FROM users`;
  db.get(query, (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }

    res.json({
      success: true,
      initialized: result.count > 0
    });
  });
});

function getAudioID(filename) {
  const query = `SELECT id FROM audio_files WHERE filename = ?`;
  return new Promise((resolve, reject) => {
    db.get(query, [filename], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row ? row.id : null);
      }
    });
  });
}

// 初始化管理员账户
app.post('/api/init-admin', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }

  // 检查是否已经存在用户
  const checkQuery = `SELECT COUNT(*) as count FROM users`;
  db.get(checkQuery, async (err, result) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }

    if (result.count > 0) {
      return res.status(400).json({
        success: false,
        message: '系统已初始化，无法再次初始化'
      });
    }

    try {
      // 加密密码
      const hashedPassword = await bcrypt.hash(password, 10);

      // 插入管理员用户
      const insertQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
      db.run(insertQuery, [username, hashedPassword], function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '初始化失败'
          });
        }

        res.status(201).json({
          success: true,
          message: '系统初始化成功',
          userId: this.lastID
        });
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
  });
});

// 登录接口
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }

  // 查询用户
  const query = `SELECT * FROM users WHERE username = ?`;
  db.get(query, [username], (err, user) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }

    // 比较密码
    bcrypt.compare(password, user.password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({
          success: false,
          message: '用户名或密码错误'
        });
      }

      // 生成JWT token
      const accessToken = generateAccessToken({
        id: user.id,
        username: user.username
      });
      
      const refreshToken = generateRefreshToken({
        id: user.id,
        username: user.username
      });

      // 登录成功
      res.json({
        success: true,
        message: '登录成功',
        data: {
          accessToken: accessToken,
          refreshToken: refreshToken,
          user: {
            id: user.id,
            username: user.username
          }
        }
      });
    });
  });
});

// 注册接口（用于测试）
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: '用户名和密码不能为空'
    });
  }

  try {
    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 插入新用户
    const insertQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    db.run(insertQuery, [username, hashedPassword], function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.status(400).json({
            success: false,
            message: '用户名已存在'
          });
        }

        return res.status(500).json({
          success: false,
          message: '注册失败'
        });
      }

      res.status(201).json({
        success: true,
        message: '注册成功',
        userId: this.lastID
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取用户列表接口 - 需要认证
app.get('/api/users', authenticateToken, (req, res) => {
  const query = `SELECT id, username, created_at FROM users ORDER BY id`;
  db.all(query, [], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }

    res.json({
      success: true,
      data: rows,
      total: rows.length
    });
  });
});

// 获取当前用户信息接口 - 需要认证
app.get('/api/users/profile', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const query = `SELECT id, username, created_at FROM users WHERE id = ?`;
  
  db.get(query, [userId], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      data: row
    });
  });
});

// 获取音频文件列表接口 - 需要认证
app.get('/api/audio-files', authenticateToken, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const size = parseInt(req.query.size) || 10;
  const offset = (page - 1) * size;

  const query = `SELECT * FROM audio_files ORDER BY id DESC LIMIT ? OFFSET ?`;
  db.all(query, [size, offset], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }

    // 获取总数
    const countQuery = `SELECT COUNT(*) as total FROM audio_files`;
    db.get(countQuery, [], (err, result) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '服务器内部错误'
        });
      }

      res.json({
        success: true,
        data: rows,
        total: result.total
      });
    });
  });
});

// 删除音频文件接口 - 需要认证
app.delete('/api/audio-files/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  const query = `DELETE FROM audio_files WHERE id = ?`;
  db.run(query, [id], function (err) {
    if (err) {
      return res.status(500).json({
        success: false,
        message: '服务器内部错误'
      });
    }

    if (this.changes === 0) {
      return res.status(404).json({
        success: false,
        message: '文件不存在'
      });
    }

    res.json({
      success: true,
      message: '删除成功'
    });
  });
});

// 音频处理状态跟踪
const processingStatus = new Map();

// 更新用户密码接口 - 需要认证
app.put('/api/users/change-password', authenticateToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: '旧密码和新密码不能为空'
    });
  }

  if (newPassword.length < 6 || newPassword.length > 20) {
    return res.status(400).json({
      success: false,
      message: '密码长度应在6到20个字符之间'
    });
  }

  try {
    // 查询用户当前信息
    const query = `SELECT * FROM users WHERE id = ?`;
    db.get(query, [userId], async (err, user) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: '服务器内部错误'
        });
      }

      if (!user) {
        return res.status(404).json({
          success: false,
          message: '用户不存在'
        });
      }

      // 验证旧密码
      const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: '旧密码错误'
        });
      }

      // 加密新密码
      const hashedNewPassword = await bcrypt.hash(newPassword, 10);

      // 更新密码
      const updateQuery = `UPDATE users SET password = ? WHERE id = ?`;
      db.run(updateQuery, [hashedNewPassword, userId], function (err) {
        if (err) {
          return res.status(500).json({
            success: false,
            message: '更新密码失败'
          });
        }

        res.json({
          success: true,
          message: '密码更新成功'
        });
      });
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '服务器内部错误'
    });
  }
});

// 获取处理状态
app.get('/api/audio-processing-status/:name', authenticateToken, (req, res) => {
  const { name } = req.params;
  const status = processingStatus.get(name) || { status: 'unknown' };
  res.json({
    success: true,
    data: status
  });
});

// 刷新访问令牌接口
app.post('/api/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401).json({
      success: false,
      message: '缺少刷新令牌'
    });
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    return res.status(403).json({
      success: false,
      message: '刷新令牌无效或已过期'
    });
  }

  // 生成新的访问令牌
  const newAccessToken = generateAccessToken({
    id: decoded.id,
    username: decoded.username
  });

  res.json({
    success: true,
    message: '令牌刷新成功',
    data: {
      accessToken: newAccessToken
    }
  });
});

// 使用Python模型处理单个音频文件
function processAudioFile(file,id) {
  return new Promise((resolve, reject) => {
    const filePath = file;
    const dirpath = path.join(__dirname, 'py');
    console.log('Processing file ID:', id);
    let audioFile = {
      id: id,
      filename: path.basename(file),
    };

    // 更新处理状态为开始处理
    processingStatus.set(path.basename(file), {
      status: 'processing',
      progress: 10,
      message: '开始处理音频文件'
    });
    
    // 配置PythonShell选项
    const options = {
      scriptPath: dirpath,
      args: [filePath, dirpath]
    };

    // 更新处理状态
    processingStatus.set(path.basename(file), {
      status: 'processing',
      progress: 30,
      message: '正在加载模型'
    });

    // 调用Python脚本进行预测
    PythonShell.run('predict.py', options).then(results => {

      // 解析Python脚本返回的JSON结果
      const prediction = JSON.parse(results[0]);
      console.log('Prediction result:', prediction);
      // 更新处理状态
      processingStatus.set(audioFile.id, {
        status: 'processing',
        progress: 80,
        message: '正在保存结果到数据库'
      });
      
      if (prediction.error) {
        processingStatus.set(path.basename(file), {
          status: 'error',
          progress: 0,
          message: prediction.error
        });
        console.error('预测出错:', prediction.error);
        return reject(new Error(prediction.error));
      }

      // 更新数据库中的预测结果
      const updateQuery = `
        UPDATE audio_files 
        SET risk_level = ?, confidence = ? 
        WHERE id = ?
      `;
      
      db.run(updateQuery, [
        prediction.risk_level, 
        prediction.confidence, 
        audioFile.id
      ], function(err) {
        if (err) {
          processingStatus.set(path.basename(file), {
            status: 'error',
            progress: 0,
            message: '更新数据库失败'
          });
          console.error('更新数据库失败:', err);
          return reject(err);
        }
        
        // 更新处理状态为完成
        processingStatus.set(path.basename(file), {
          status: 'completed',
          progress: 100,
          message: '处理完成',
          result: prediction
        });
        
        console.log(`音频文件 ${audioFile.filename} 处理完成:`, prediction);
        resolve(prediction);
      });
    });
    
  });
}

// 上传音频文件接口 - 需要认证
app.post('/api/upload-audio', authenticateToken, upload.single('audio'), (req, res) => {
  // 检查是否有文件上传
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: '请选择要上传的音频文件'
    });
  }

  res.status(200).json({
    success: true,
    message: '音频文件上传成功',
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    }
  });
});

// 测试接口 - 需要认证
app.get('/api/test', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: '认证成功！',
    user: req.user
  });
});

// 错误处理中间件
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: '文件大小超出限制（最大50MB）'
      });
    }
  }

  if (error.message === '只允许上传音频文件！') {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }

  res.status(500).json({
    success: false,
    message: '服务器内部错误'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务器正在运行，端口: ${PORT}`);

  const watcher = chokidar.watch('./uploads', {
    ignored: /(^|[\/\\])\../, // 忽略隐藏文件
    persistent: true,
    ignoreInitial: true // 忽略初始文件
  });

  watcher
    .on('add', filePath => {
      console.log(`文件已添加: ${filePath}`);
          
      // 获取用户ID（实际项目中应从认证信息中获取）
      const userId = 1;

      // 保存文件信息到数据库
      const insertQuery = `INSERT INTO audio_files 
        (filename, original_name, mimetype, size, user_id, risk_level, confidence) 
        VALUES (?, ?, ?, ?, ?, ?, ?)`;

      // 默认风险等级为"未知"，置信度为0.0
      const params = [
        path.basename(filePath),
        '',
        'audio',
        0,
        userId,
        '未检测',
        0.0
      ];

      db.run(insertQuery, params, function (err) {
        if (err) {
          // 如果保存数据库失败，删除已上传的文件
          fs.unlinkSync(filePath);
          return res.status(500).json({
            success: false,
            message: '文件上传失败'
          });
        }
        processAudioFile(filePath,this.lastID);
      });
      
    })
    .on('error', error => {
      console.error(`监控错误: ${error}`);
    });

  console.log(`开始监控目录: ./uploads`);
});