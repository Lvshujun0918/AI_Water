const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PythonShell } = require('python-shell');
const chokidar = require('chokidar');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'riscv-admin-secret-key';

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

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: '令牌无效或已过期'
      });
    }
    req.user = user;
    next();
  });
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
      const token = jwt.sign(
        {
          id: user.id,
          username: user.username
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      // 登录成功
      res.json({
        success: true,
        message: '登录成功',
        token: token,
        user: {
          id: user.id,
          username: user.username
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

// 使用Python模型处理单个音频文件
function processAudioFile(pathB) {
  return new Promise((resolve, reject) => {
    const filePath = pathB;
    const dirpath = path.join(__dirname, 'py');

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      console.error('音频文件不存在:', filePath);
      return reject(new Error('音频文件不存在'));
    }

    // 配置PythonShell选项
    const options = {
      scriptPath: path.join(__dirname, 'py'),
      args: [filePath, dirpath]
    };
    PythonShell.run('predict.py', options).then(messages => {
      console.log(messages);
      const prediction = JSON.parse(messages[0]);
      console.log('音频文件预测结果:', prediction);
      if (prediction.error) {
        console.error('预测出错:', prediction.error);
        return reject(new Error(prediction.error));
      }

      // 更新数据库中的预测结果
      const updateQuery = `
        UPDATE audio_files 
        SET risk_level = ?, confidence = ? 
        WHERE filename = ?
      `;
      
      db.run(updateQuery, [
        prediction.risk_level, 
        prediction.confidence, 
        path.basename(pathB)
      ], function(err) {
        if (err) {
          console.error('更新数据库失败:', err);
          return reject(err);
        }
        
        console.log(`音频文件 ${path.basename(pathB)} 处理完成:`, prediction);
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

  // 获取用户ID（实际项目中应从认证信息中获取）
  const userId = req.body.userId || null;

  // 保存文件信息到数据库
  const insertQuery = `INSERT INTO audio_files 
    (filename, original_name, mimetype, size, user_id, risk_level, confidence) 
    VALUES (?, ?, ?, ?, ?, ?, ?)`;

  // 默认风险等级为"未知"，置信度为0.0
  const params = [
    req.file.filename,
    req.file.originalname,
    req.file.mimetype,
    req.file.size,
    userId,
    '未检测',
    0.0
  ];

  db.run(insertQuery, params, function (err) {
    if (err) {
      // 如果保存数据库失败，删除已上传的文件
      fs.unlinkSync(req.file.path);
      return res.status(500).json({
        success: false,
        message: '文件上传失败'
      });
    }

    res.status(200).json({
      success: true,
      message: '音频文件上传成功',
      file: {
        id: this.lastID,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        risk_level: '未知',
        confidence: 0.0,
        url: `/uploads/${req.file.filename}`
      }
    });
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
      processAudioFile(filePath);
    })
    .on('error', error => {
      console.error(`监控错误: ${error}`);
    });

  console.log(`开始监控目录: ./uploads`);
});