const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: '音频风险检测系统 API',
    version: '1.0.0',
    description: '基于 Express + SQLite 的后端接口文档'
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: '本地开发环境'
    }
  ],
  tags: [
    { name: '系统' },
    { name: '认证' },
    { name: '用户' },
    { name: '音频文件' }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' }
        }
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'admin' },
          created_at: { type: 'string', example: '2026-03-03 10:20:30' }
        }
      },
      AudioFile: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          filename: { type: 'string', example: 'audio-1740999999999-123456789.wav' },
          original_name: { type: 'string', example: 'test.wav' },
          mimetype: { type: 'string', example: 'audio/wav' },
          size: { type: 'integer', example: 245760 },
          upload_time: { type: 'string', example: '2026-03-03 10:20:30' },
          user_id: { type: 'integer', nullable: true, example: 1 },
          risk_level: { type: 'string', example: '低风险' },
          confidence: { type: 'number', format: 'float', example: 0.9132 }
        }
      }
    }
  },
  paths: {
    '/api/init-status': {
      get: {
        tags: ['系统'],
        summary: '获取系统初始化状态',
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    initialized: { type: 'boolean', example: true }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/init-admin': {
      post: {
        tags: ['系统'],
        summary: '初始化管理员账户',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: '123456' }
                }
              }
            }
          }
        },
        responses: {
          '201': {
            description: '初始化成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '系统初始化成功' },
                    userId: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          },
          '400': {
            description: '参数错误或已初始化',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/login': {
      post: {
        tags: ['认证'],
        summary: '用户登录',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: '123456' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '登录成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '登录成功' },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          },
          '401': {
            description: '用户名或密码错误',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['认证'],
        summary: '刷新访问令牌',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['refreshToken'],
                properties: {
                  refreshToken: { type: 'string' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '刷新成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '令牌刷新成功' },
                    data: {
                      type: 'object',
                      properties: {
                        accessToken: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users': {
      get: {
        tags: ['用户'],
        summary: '获取用户列表',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/User' }
                    },
                    total: { type: 'integer', example: 1 }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/profile': {
      get: {
        tags: ['用户'],
        summary: '获取当前用户信息',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/users/change-password': {
      put: {
        tags: ['用户'],
        summary: '修改当前用户密码',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['oldPassword', 'newPassword'],
                properties: {
                  oldPassword: { type: 'string', example: 'old123456' },
                  newPassword: { type: 'string', example: 'new123456' }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '修改成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          }
        }
      }
    },
    '/api/audio-files': {
      get: {
        tags: ['音频文件'],
        summary: '分页获取音频文件列表',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            schema: { type: 'integer', example: 1 }
          },
          {
            name: 'size',
            in: 'query',
            schema: { type: 'integer', example: 10 }
          }
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/AudioFile' }
                    },
                    total: { type: 'integer', example: 10 }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/audio-files/{id}': {
      delete: {
        tags: ['音频文件'],
        summary: '删除音频文件记录',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'integer', example: 1 }
          }
        ],
        responses: {
          '200': {
            description: '删除成功',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/SuccessResponse' }
              }
            }
          },
          '404': {
            description: '文件不存在',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/audio-processing-status/{name}': {
      get: {
        tags: ['音频文件'],
        summary: '获取音频处理状态',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'name',
            in: 'path',
            required: true,
            schema: { type: 'string', example: 'audio-1740999999999-123456789.wav' }
          }
        ],
        responses: {
          '200': {
            description: '成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'processing' },
                        progress: { type: 'integer', example: 80 },
                        message: { type: 'string', example: '正在保存结果到数据库' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/upload-audio': {
      post: {
        tags: ['音频文件'],
        summary: '上传音频并异步触发模型检测',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['audio'],
                properties: {
                  audio: {
                    type: 'string',
                    format: 'binary'
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: '上传成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '音频文件上传成功' },
                    file: {
                      type: 'object',
                      properties: {
                        filename: { type: 'string' },
                        originalName: { type: 'string' },
                        mimetype: { type: 'string' },
                        size: { type: 'integer' }
                      }
                    }
                  }
                }
              }
            }
          },
          '400': {
            description: '文件错误',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' }
              }
            }
          }
        }
      }
    },
    '/api/test': {
      get: {
        tags: ['认证'],
        summary: '认证测试接口',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: '认证成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    message: { type: 'string', example: '认证成功！' },
                    user: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer', example: 1 },
                        username: { type: 'string', example: 'admin' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = openapiSpec;