# API接口文档

## 基础信息

- **后端地址**: `http://localhost:5000`
- **数据格式**: JSON
- **字符编码**: UTF-8

---

## 1. 健康检测接口

### 接口信息
- **地址**: `/api/health`
- **方法**: `GET`
- **说明**: 检测服务状态，同时保活Supabase数据库连接

### 请求参数
无

### 响应成功示例
```json
{
  "success": true,
  "message": "服务正常，数据库连接成功",
  "data": null
}
```

### 错误返回示例
```json
{
  "success": false,
  "message": "数据库连接失败: HTTPSConnectionPool...",
  "data": null
}
```

### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 服务正常 |
| 500 | 数据库连接失败 |

---

## 2. 用户注册接口

### 接口信息
- **地址**: `/api/auth/signup`
- **方法**: `POST`
- **说明**: 创建新用户，写入Supabase auth.users表

### 请求参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 是 | 用户昵称，至少2个字符 |
| email | string | 是 | 用户邮箱，需符合邮箱格式 |
| password | string | 是 | 用户密码，至少6位 |

### 请求示例
```json
{
  "nickname": "测试用户",
  "email": "test@example.com",
  "password": "123456"
}
```

### 响应成功示例
```json
{
  "success": true,
  "message": "注册成功，请登录",
  "data": null
}
```

### 错误返回示例
```json
{
  "success": false,
  "message": "该邮箱已注册，请直接登录",
  "data": null
}
```

### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 注册成功 |
| 400 | 参数校验失败/邮箱已注册 |

---

## 3. 用户登录接口

### 接口信息
- **地址**: `/api/auth/login`
- **方法**: `POST`
- **说明**: 用户登录，返回JWT token和用户信息

### 请求参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 用户邮箱 |
| password | string | 是 | 用户密码 |

### 请求示例
```json
{
  "email": "test@example.com",
  "password": "123456"
}
```

### 响应成功示例
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "user": {
      "id": "uuid-xxx",
      "email": "test@example.com",
      "nickname": "测试用户"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIs...",
      "refresh_token": "xxx",
      "expires_at": 1700000000
    }
  }
}
```

### 错误返回示例
```json
{
  "success": false,
  "message": "邮箱或密码错误",
  "data": null
}
```

### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 登录成功 |
| 400 | 邮箱或密码错误 |

---

## 4. 获取当前用户

### 接口信息
- **地址**: `/api/auth/me`
- **方法**: `GET`
- **说明**: 获取当前登录用户信息，需要Authorization头

### 请求头
| 参数 | 说明 |
|------|------|
| Authorization | Bearer {access_token} |

### 响应成功示例
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "user": {
      "id": "uuid-xxx",
      "email": "test@example.com",
      "nickname": "测试用户"
    }
  }
}
```

### 错误返回示例
```json
{
  "success": false,
  "message": "登录已过期，请重新登录",
  "data": null
}
```

### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 成功 |
| 401 | 未登录/token过期 |

---

## 5. 退出登录

### 接口信息
- **地址**: `/api/auth/logout`
- **方法**: `POST`
- **说明**: 用户退出登录

### 请求头
| 参数 | 说明 |
|------|------|
| Authorization | Bearer {access_token} |

### 响应成功示例
```json
{
  "success": true,
  "message": "退出成功",
  "data": null
}
```

---

## 6. AI对话接口

### 接口信息
- **地址**: `/api/ai/chat`
- **方法**: `POST`
- **说明**: 调用硅基流动免费大模型进行对话，支持流式输出
- **限流**: 单用户每分钟8次

### 请求头
| 参数 | 说明 |
|------|------|
| Authorization | Bearer {access_token} |
| Content-Type | application/json |

### 请求参数
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| messages | array | 否 | 对话历史数组 |
| prompt | string | 否 | 单次对话内容 |

### 请求示例1（单次对话）
```json
{
  "prompt": "你好，请介绍一下自己"
}
```

### 请求示例2（多轮对话）
```json
{
  "messages": [
    {"role": "user", "content": "你好"},
    {"role": "assistant", "content": "你好！有什么可以帮助您的吗？"},
    {"role": "user", "content": "请写一首关于春天的诗"}
  ]
}
```

### 响应格式
流式响应（Server-Sent Events）：
```
data: {"response": "你", "done": false}
data: {"response": "好", "done": false}
data: {"response": "！", "done": false}
data: {"response": "", "done": true}
```

### 错误返回示例
```json
{
  "error": "AI访问繁忙，请稍后重试",
  "done": true
}
```

### 状态码说明
| 状态码 | 说明 |
|--------|------|
| 200 | 成功（流式响应） |
| 400 | 未输入内容 |
| 401 | 未登录 |
| 429 | 请求过于频繁 |

---

## 7. AI状态检测

### 接口信息
- **地址**: `/api/ai/status`
- **方法**: `GET`
- **说明**: 检测AI服务是否在线

### 请求头
| 参数 | 说明 |
|------|------|
| Authorization | Bearer {access_token} |

### 响应成功示例
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "online": true,
    "message": "AI服务在线"
  }
}
```

---

## Postman测试截图说明

测试步骤：
1. 导入环境变量：`BASE_URL = http://localhost:5000`
2. 按顺序测试：
   - GET `/api/health` → 确认服务正常
   - POST `/api/auth/signup` → 注册新用户
   - POST `/api/auth/login` → 登录获取token
   - GET `/api/auth/me` → 带token获取用户信息
   - POST `/api/ai/chat` → 带token进行AI对话

截图存放目录：`screenshot/postman/`