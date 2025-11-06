const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');

// 创建 Express 应用
const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// 测试接口
app.get('/api/test', (req, res) => {
  res.json({ message: '后端服务正常运行' });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务器正在运行，端口: ${PORT}`);
});