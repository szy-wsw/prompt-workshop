# API 接口文档

> **项目名称**: Prompt Workshop  
> **技术栈**: Next.js 16 App Router + Supabase  
> **基础URL**: `https://szy050604.top/api`  
> **设计日期**: 2026-07-20  

---

## 一、认证模块

### 1.1 用户注册

**POST** `/api/signup`

请求体:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "nickname": "用户名"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 8位以上，含大小写字母和数字 |
| nickname | string | 是 | 用户昵称 |

成功响应:
```json
{
  "code": 200,
  "message": "注册成功",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "用户名"
  }
}
```

失败响应:
```json
{
  "code": 400,
  "message": "邮箱已被注册"
}
```

---

### 1.2 用户登录

**POST** `/api/login`

请求体:
```json
{
  "email": "user@example.com",
  "password": "Password123"
}
```

成功响应:
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "jwt-token",
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "nickname": "用户名",
      "avatar": "avatar-url"
    }
  }
}
```

失败响应:
```json
{
  "code": 401,
  "message": "邮箱或密码错误"
}
```

---

### 1.3 用户信息

**GET** `/api/profile`

请求头:
```
Authorization: Bearer <token>
```

成功响应:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "nickname": "用户名",
    "avatar": "avatar-url",
    "created_at": "2026-07-18T00:00:00Z"
  }
}
```

---

### 1.4 更新用户信息

**PUT** `/api/profile`

请求头:
```
Authorization: Bearer <token>
```

请求体:
```json
{
  "nickname": "新昵称",
  "password": "NewPassword123"
}
```

成功响应:
```json
{
  "code": 200,
  "message": "更新成功"
}
```

---

### 1.5 上传头像

**POST** `/api/profile/avatar`

请求头:
```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

请求体:
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| file | File | 是 | 头像文件（jpg/png/webp，最大2MB） |

成功响应:
```json
{
  "code": 200,
  "message": "上传成功",
  "data": {
    "avatar_url": "https://cdn.supabase.co/avatars/xxx.jpg"
  }
}
```

---

## 二、提示词模块

### 2.1 创建提示词

**POST** `/api/prompts`

请求头:
```
Authorization: Bearer <token>
```

请求体:
```json
{
  "title": "提示词标题",
  "content": "提示词内容",
  "tags": ["标签1", "标签2"],
  "visibility": "public"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| title | string | 是 | 标题 |
| content | string | 是 | 内容 |
| tags | string[] | 否 | 标签数组 |
| visibility | string | 否 | private/public，默认private |

成功响应:
```json
{
  "code": 200,
  "message": "创建成功",
  "data": {
    "id": "uuid",
    "title": "提示词标题",
    "content": "提示词内容",
    "tags": ["标签1", "标签2"],
    "visibility": "public",
    "likes_count": 0
  }
}
```

---

### 2.2 获取提示词列表

**GET** `/api/prompts`

请求参数:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |
| visibility | string | 否 | public/private/all |
| tag | string | 否 | 标签筛选 |
| author_id | string | 否 | 作者ID筛选 |

成功响应:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 2.3 获取单个提示词

**GET** `/api/prompts/[id]`

成功响应:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "uuid",
    "title": "提示词标题",
    "content": "提示词内容",
    "tags": ["标签1"],
    "visibility": "public",
    "likes_count": 5,
    "author": {
      "id": "uuid",
      "nickname": "作者",
      "avatar": "avatar-url"
    }
  }
}
```

---

### 2.4 更新提示词

**PUT** `/api/prompts/[id]`

请求头:
```
Authorization: Bearer <token>
```

请求体:
```json
{
  "title": "新标题",
  "content": "新内容",
  "tags": ["新标签"],
  "visibility": "private"
}
```

成功响应:
```json
{
  "code": 200,
  "message": "更新成功"
}
```

---

### 2.5 删除提示词

**DELETE** `/api/prompts/[id]`

请求头:
```
Authorization: Bearer <token>
```

成功响应:
```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

## 三、互动模块

### 3.1 点赞/取消点赞

**POST** `/api/likes`

请求头:
```
Authorization: Bearer <token>
```

请求体:
```json
{
  "prompt_id": "uuid"
}
```

成功响应:
```json
{
  "code": 200,
  "message": "点赞成功",
  "data": {
    "liked": true,
    "likes_count": 6
  }
}
```

---

### 3.2 检查点赞状态

**GET** `/api/likes/check?prompt_id=uuid`

请求头:
```
Authorization: Bearer <token>
```

成功响应:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "liked": true
  }
}
```

---

### 3.3 收藏/取消收藏

**POST** `/api/collections`

请求头:
```
Authorization: Bearer <token>
```

请求体:
```json
{
  "prompt_id": "uuid"
}
```

成功响应:
```json
{
  "code": 200,
  "message": "收藏成功",
  "data": {
    "collected": true
  }
}
```

---

### 3.4 检查收藏状态

**GET** `/api/collections/check?prompt_id=uuid`

请求头:
```
Authorization: Bearer <token>
```

成功响应:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "collected": false
  }
}
```

---

## 四、AI对话模块

### 4.1 AI对话（非流式）

**POST** `/api/chat`

请求头:
```
Authorization: Bearer <token>
Content-Type: application/json; charset=utf-8
```

请求体:
```json
{
  "messages": [
    { "role": "user", "content": "请给我三条短视频爆款文案" }
  ],
  "model": "deepseek-ai/DeepSeek-V4-Flash"
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| messages | array | 否 | 消息数组（包含role和content） |
| prompt | string | 否 | 快捷单条消息（与messages二选一） |
| model | string | 否 | 模型ID，默认FREE_MODEL_ID |
| conversation_id | string | 否 | 会话ID，用于历史关联 |
| save_history | boolean | 否 | 是否保存历史，默认true |

**可用模型**:
- `deepseek-ai/DeepSeek-V4-Flash` — 响应快，逻辑清晰（推荐）
- `THUDM/GLM-4-9B-0414` — 中文理解能力强
- `Qwen/Qwen2.5-7B-Instruct` — 轻量快速

成功响应:
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "response": "好的，这里有三条不同风格的短视频爆款文案...",
    "done": true
  }
}
```

---

### 4.2 AI服务状态

**GET** `/api/ai/status`

成功响应:
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    "online": true,
    "message": "AI服务在线",
    "models": ["deepseek-ai/DeepSeek-V4-Flash", "..."],
    "defaultModel": "deepseek-ai/DeepSeek-V4-Flash"
  }
}
```

---

### 4.3 获取聊天历史

**GET** `/api/chat-history`

请求头:
```
Authorization: Bearer <token>
```

请求参数:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

成功响应:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "uuid",
        "user_message": "你好",
        "ai_response": "您好",
        "created_at": "2026-07-18T00:00:00Z"
      }
    ],
    "total": 10
  }
}
```

---

## 五、模板模块

### 5.1 获取模板列表

**GET** `/api/templates`

成功响应:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "uuid",
      "title": "文案润色大师",
      "content": "模板内容",
      "tags": ["写作", "文案"],
      "category": "写作助手",
      "description": "专业文案润色"
    }
  ]
}
```

---

## 六、用户统计模块

### 6.1 用户排行榜

**GET** `/api/users/ranking`

请求参数:
| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| limit | number | 否 | 返回数量，默认10 |

成功响应:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "uuid",
      "nickname": "用户1",
      "avatar": "avatar-url",
      "prompt_count": 10,
      "like_count": 50
    }
  ]
}
```

---

### 6.2 用户统计

**GET** `/api/users/stats`

请求头:
```
Authorization: Bearer <token>
```

成功响应:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "user_count": 100,
    "prompt_count": 500,
    "like_count": 2000,
    "collection_count": 500
  }
}
```

---

## 七、统一响应格式

### 7.1 成功响应

```json
{
  "success": true,
  "message": "操作成功",
  "data": {}
}
```

### 7.2 失败响应

```json
{
  "success": false,
  "message": "错误信息"
}
```

### 7.3 错误码说明

| HTTP状态码 | 说明 |
|--------|------|
| 200 | 请求成功 |
| 400 | 请求参数错误 |
| 401 | 未登录或token无效 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 429 | 请求过于频繁 |
| 500 | 服务器内部错误 |
| 502 | AI服务异常 |
| 503 | AI服务不可用 |

---

> **文档版本**: v2.0  
> **生成时间**: 2026-07-20  
> **更新说明**: 更新AI对话接口为非流式响应，新增AI服务状态接口，更新域名
