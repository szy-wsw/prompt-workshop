# AI提示词管理平台

## 项目简介

AI提示词管理平台是一个基于 Flask + Next.js + Supabase 的全栈Web应用，提供提示词的创建、编辑、收藏、点赞等管理功能，并集成硅基流动免费大模型实现AI对话能力。

**核心设计理念**：前端完全移除Supabase直连代码，所有数据库请求通过Flask后端中转，内置3次自动重连机制解决国内访问海外数据库超时问题。

## 功能清单

| 模块 | 功能 | 说明 |
|------|------|------|
| 用户认证 | 注册/登录/退出 | 后端中转Supabase Auth，前端无直连 |
| AI对话 | 流式对话/限流保护 | 硅基流动Qwen2.5-7B-Instruct，单用户8次/分钟 |
| 健康检测 | 数据库保活 | 防止Supabase闲置清空数据 |
| 提示词管理 | CRUD操作 | 创建、编辑、删除、查询（已预留接口） |
| 互动功能 | 点赞/收藏 | 已预留数据库表结构 |

## 目录结构

```
prompt-workshop/
├── backend/
│   ├── app.py              # Flask主程序（注册/登录/AI/健康接口）
│   ├── .env                # 环境配置模板
│   └── venv/               # Python虚拟环境
├── frontend/
│   ├── app/                # Next.js页面路由
│   │   ├── register/page.tsx    # 注册页面
│   │   ├── login/page.tsx       # 登录页面
│   │   └── ai-workspace/        # AI工作台
│   ├── lib/
│   │   ├── auth.tsx        # 认证上下文（直连后端5000）
│   │   └── supabase.ts     # 代理层（已移除createClient）
│   ├── components/         # React组件
│   ├── next.config.ts      # Next配置
│   └── .env.local          # 空文件（无Supabase配置）
├── screenshot/             # 截图存放目录
│   ├── postman/            # Postman接口测试截图
│   ├── codereview/         # Code Review截图
│   └── database/           # 数据库连接截图
├── README.md
├── api_doc.md
├── prompt_shturl.md
└── code_review.md
```

## 环境依赖

### 后端依赖
```powershell
cd D:\prompt-workshop\backend
venv\Scripts\activate
pip install flask flask-cors python-dotenv requests
```

### 前端依赖
```powershell
cd D:\prompt-workshop\frontend
npm install
```

## 本地启动步骤

### 1. 启动后端
```powershell
cd D:\prompt-workshop\backend
venv\Scripts\activate
python app.py
```
启动成功输出：
```
🚀 后端服务启动在 http://localhost:5000
📡 CORS已放行: http://localhost:3000
📦 数据库: Supabase (service_role密钥 + 3次自动重连)
🤖 AI模型: Qwen/Qwen2.5-7B-Instruct (硅基流动国内直连)
```

### 2. 启动前端（新终端）
```powershell
cd D:\prompt-workshop\frontend
npm run dev
```
访问地址：`http://localhost:3000`

## 环境配置说明

### backend/.env
```env
# Supabase数据库配置
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 硅基流动AI配置（国内直连）
SILICONFLOW_API_KEY=your-api-key
SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
FREE_MODEL_ID=Qwen/Qwen2.5-7B-Instruct

# 代理配置（可选，加速海外Supabase访问）
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

### frontend/.env.local
```
# 空文件 - 前端不持有任何Supabase配置
# 所有数据库请求通过后端中转
```

## 接口总览

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/health` | GET | 健康检测+数据库保活 |
| `/api/auth/signup` | POST | 用户注册 |
| `/api/auth/login` | POST | 用户登录 |
| `/api/auth/me` | GET | 获取当前用户 |
| `/api/auth/logout` | POST | 退出登录 |
| `/api/ai/chat` | POST | AI对话（流式） |
| `/api/ai/status` | GET | AI服务状态 |

详细接口文档见 [api_doc.md](./api_doc.md)

## 线上部署说明

### Render平台部署（推荐）

1. **创建Web Service**
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`

2. **环境变量配置**
   ```
   SUPABASE_URL=你的Supabase地址
   SUPABASE_SERVICE_ROLE_KEY=你的服务密钥
   SILICONFLOW_API_KEY=你的硅基密钥
   SILICONFLOW_BASE_URL=https://api.siliconflow.cn/v1
   FREE_MODEL_ID=Qwen/Qwen2.5-7B-Instruct
   ```

3. **优势**
   - 海外服务器，直连Supabase无需代理
   - 免费额度充足，适合个人项目

### 前端部署（Vercel）

修改 `frontend/lib/auth.tsx` 中的 `API_BASE`：
```typescript
const API_BASE = 'https://your-backend.onrender.com'
```

## 常见报错解决方案

### 1. Supabase连接超时

**现象**：
```
数据库连接失败: HTTPSConnectionPool... Failed to resolve 'xxx.supabase.co'
```

**原因**：国内网络无法解析海外域名

**解决方案**：
- 方案A：在 `backend/.env` 配置代理
  ```env
  HTTP_PROXY=http://127.0.0.1:7890
  HTTPS_PROXY=http://127.0.0.1:7890
  ```
- 方案B：部署到Render海外平台

### 2. 数据库1045报错

**现象**：
```
(1045, "Access denied for user 'xxx'@'xxx' (using password: YES)")
```

**原因**：数据库凭据错误或用户权限不足

**解决方案**：
- 检查 `.env` 中的数据库地址、用户名、密码
- 确认数据库服务已启动
- 确认用户有远程访问权限

### 3. 注册400错误

**现象**：前端显示"网络连接失败"

**解决方案**：
- 确认后端已启动 `http://localhost:5000`
- 检查CORS配置是否正确
- 查看后端日志输出的具体错误信息

## 演示录屏说明

录屏文件存放位置：`screenshot/demo.mp4`

录制内容：
1. 启动后端服务，展示路由清单
2. 启动前端服务，打开注册页面
3. 完成用户注册流程
4. 完成用户登录流程
5. 进入AI工作台进行对话
6. 展示健康检测接口返回

## 项目截图说明

- `screenshot/postman/` - Postman接口测试截图
- `screenshot/codereview/` - Code Review报告截图
- `screenshot/database/` - 数据库连接/表结构截图

## 技术栈

- **后端**: Flask 2.x + Python 3.10
- **前端**: Next.js 16 + React 18 + TypeScript
- **数据库**: Supabase (PostgreSQL)
- **AI模型**: 硅基流动 Qwen/Qwen2.5-7B-Instruct（永久免费）

## 许可证

MIT License