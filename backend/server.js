const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
      db.run(insertQuery, [username, hashedPassword], function(err) {
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

      // 登录成功
      res.json({
        success: true,
        message: '登录成功',
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
    db.run(insertQuery, [username, hashedPassword], function(err) {
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

// 上传音频文件接口
app.post('/api/upload-audio', upload.single('audio'), (req, res) => {
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
    (filename, original_name, mimetype, size, user_id) 
    VALUES (?, ?, ?, ?, ?)`;
  
  const params = [
    req.file.filename,
    req.file.originalname,
    req.file.mimetype,
    req.file.size,
    userId
  ];

  db.run(insertQuery, params, function(err) {
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
        url: `/uploads/${req.file.filename}`
      }
    });
  });
});

// 获取音频文件列表
app.get('/api/audio-files', (req, res) => {
  const query = `
    SELECT af.*, u.username 
    FROM audio_files af 
    LEFT JOIN users u ON af.user_id = u.id 
    ORDER BY af.upload_time DESC
  `;

  db.all(query, (err, files) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: '获取音频文件列表失败' 
      });
    }

    // 为每个文件添加访问URL
    const filesWithUrl = files.map(file => ({
      ...file,
      url: `/uploads/${file.filename}`
    }));

    res.json({
      success: true,
      files: filesWithUrl
    });
  });
});

// 删除音频文件
app.delete('/api/audio-files/:id', (req, res) => {
  const fileId = req.params.id;

  // 先查询文件信息
  const selectQuery = `SELECT filename FROM audio_files WHERE id = ?`;
  db.get(selectQuery, [fileId], (err, file) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: '删除文件失败' 
      });
    }

    if (!file) {
      return res.status(404).json({ 
        success: false, 
        message: '文件不存在' 
      });
    }

    // 从数据库中删除记录
    const deleteQuery = `DELETE FROM audio_files WHERE id = ?`;
    db.run(deleteQuery, [fileId], function(err) {
      if (err) {
        return res.status(500).json({ 
          success: false, 
          message: '删除文件失败' 
        });
      }

      if (this.changes === 0) {
        return res.status(404).json({ 
          success: false, 
          message: '文件不存在' 
        });
      }

      // 从文件系统中删除文件
      const filePath = path.join(uploadDir, file.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      res.json({
        success: true,
        message: '文件删除成功'
      });
    });
  });
});

// 测试接口
app.get('/api/test', (req, res) => {
  res.json({ message: '后端服务正常运行' });
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
});