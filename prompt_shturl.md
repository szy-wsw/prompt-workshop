# AI辅助编程对话日志

> 本文档记录项目开发过程中与AI的全部对话交互，包含需求提出、代码生成、问题修复等环节。

---

## 序号1：项目初始化 - Flask后端基础架构搭建

### 用户指令
```
开发提示词管理系统，技术栈Flask后端+Next.js前端，数据库使用Supabase，AI使用硅基流动免费模型。
后端Flask 5000端口，全局跨域放行3000前端，统一中转所有数据库操作，前端禁止直连数据库。
```

### AI输出
创建 `backend/app.py` Flask主程序，包含：
- Flask应用初始化与CORS跨域配置
- Supabase数据库连接封装
- 硅基流动AI调用函数
- 健康检测、注册、登录、AI对话接口

```python
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import os
import requests

load_dotenv()
app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"], supports_credentials=True)

# Supabase配置
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
```

### 对应文件
- `backend/app.py`

---

## 序号2：Supabase 3次自动重连机制实现

### 用户指令
```
解决国内网络连接不稳定问题，后端内置Supabase 3次自动重连机制，处理跨境网络抖动。
使用Supabase service_role服务密钥，权限更高、连接稳定性优于前端匿名密钥。
```

### AI输出
在 `backend/app.py` 中实现 `supabase_request()` 函数，封装带重连的HTTP请求：

```python
MAX_RETRIES = 3
RETRY_DELAY = 1.5

def supabase_request(method, path, json_body=None, params=None, timeout=15):
    """
    封装Supabase REST API请求，内置3次自动重连
    使用service_role密钥，绕过RLS，权限更高
    """
    url = f"{SUPABASE_URL}{path}"
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }

    session = get_session()
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            resp = session.request(method, url, headers=headers,
                                   json=json_body, params=params, timeout=timeout)
            return resp
        except requests.exceptions.ConnectionError as e:
            print(f"[Supabase重连] 第{attempt}/{MAX_RETRIES}次连接失败: {e}")
            if attempt < MAX_RETRIES:
                time.sleep(RETRY_DELAY * attempt)
            else:
                raise
```

### 对应文件
- `backend/app.py` (第71-119行)

---

## 序号3：前端移除Supabase直连代码

### 用户指令
```
前端Next.js，清空.env.local所有Supabase环境变量，全局删除所有createClient、supabase初始化代码。
注册页面移除页面加载自动查询数据库useEffect，彻底消除「无法连接数据库」弹窗。
```

### AI输出
重写 `frontend/lib/auth.tsx`，移除所有Supabase直连代码：

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

const API_BASE = 'http://127.0.0.1:5000'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await response.json()
    if (data.success && data.data) {
      const { user: userData, session } = data.data
      setUser(userData)
      setToken(session.access_token)
      localStorage.setItem('auth_token', session.access_token)
      localStorage.setItem('auth_user', JSON.stringify(userData))
    }
    return { success: data.success, message: data.message }
  }
}
```

### 对应文件
- `frontend/lib/auth.tsx`
- `frontend/.env.local` (已清空)

---

## 序号4：注册登录接口实现

### 用户指令
```
后端接口清单：
/api/auth/signup 注册接口，校验昵称/邮箱/密码长度，写入users表；
/api/auth/login 登录接口，校验账号密码返回用户id和昵称；
```

### AI输出
实现注册和登录接口，使用Supabase Admin REST API：

```python
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.get_json() or {}
    nickname = data.get('nickname', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    # 本地前置校验
    if not nickname:
        return error_response("请输入昵称")
    if len(nickname) < 2:
        return error_response("昵称至少2个字符")
    if not email:
        return error_response("请输入邮箱")
    if '@' not in email or '.' not in email:
        return error_response("邮箱格式不正确")
    if not password:
        return error_response("请输入密码")
    if len(password) < 6:
        return error_response("密码至少6位")

    # 通过Supabase Admin API创建用户
    resp = supabase_request("POST", "/auth/v1/admin/users",
                            json_body={
                                "email": email,
                                "password": password,
                                "user_metadata": {"nickname": nickname},
                                "email_confirm": True
                            }, timeout=30)
    # ...处理响应
```

### 对应文件
- `backend/app.py` (第227-301行)

---

## 序号5：AI对话接口实现（硅基流动）

### 用户指令
```
AI模块使用硅基流动国内免费Qwen模型，完全不受海外网络影响。
/api/ai/chat AI对话接口，调用硅基流动免费模型，单用户限流8次/分钟。
```

### AI输出
实现AI对话接口，支持流式响应：

```python
@app.route('/api/ai/chat', methods=['POST'])
@auth_required
@rate_limit
def ai_chat():
    data = request.get_json() or {}
    messages = data.get('messages', [])
    prompt = data.get('prompt', '')

    if prompt and not messages:
        messages = [{"role": "user", "content": prompt}]

    print(f"[AI调用] 模型: {FREE_MODEL_ID}, 用户ID: {g.user.get('id')}")

    def generate_stream():
        response = requests.post(
            f"{SILICONFLOW_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {SILICONFLOW_API_KEY}",
                "Content-Type": "application/json"
            },
            json={"model": FREE_MODEL_ID, "messages": messages, "stream": True},
            stream=True, timeout=120
        )
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    json_line = json.loads(line_str[6:])
                    delta = json_line.get('choices', [{}])[0].get('delta', {})
                    content = delta.get('content', '')
                    if content:
                        yield f"data: {json.dumps({'response': content, 'done': False})}\n\n"

    return Response(generate_stream(), mimetype='text/event-stream')
```

### 对应文件
- `backend/app.py` (第403-477行)

---

## 序号6：数据库切换SQLPub尝试

### 用户指令
```
完整开发Prompt提示词管理系统，数据库使用SQLPub国内免费MySQL，AI使用硅基流动免费模型。
数据库连接信息：DB_HOST=mysql6.sqlpub.com, DB_PORT=3311, DB_USER=prompt_user...
```

### AI输出
尝试使用PyMySQL连接SQLPub数据库：

```python
import pymysql

def get_db_connection():
    try:
        conn = pymysql.connect(
            host='mysql6.sqlpub.com',
            port=3311,
            user='prompt_user',
            password='IJWVf1ZCu45QdHjC',
            database='prompt_db',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor,
            connect_timeout=10
        )
        return conn
    except Exception as e:
        print(f"[数据库连接失败] {e}")
        return None
```

### 测试结果
返回1045错误：`Access denied for user 'prompt_user'`，数据库凭据验证失败。

### 对应文件
- 测试代码（未正式采用）

---

## 序号7：回退Supabase + 代理支持

### 用户指令
```
强制使用Supabase数据库，解决国内网络连接不稳定、页面加载弹窗报错问题：
1. 后端Flask，所有Supabase读写统一后端中转，前端禁止任何直连Supabase操作；
2. 后端内置Supabase 3次自动重连机制，处理跨境网络抖动；
3. 本地开发支持代理加速后端Supabase访问。
```

### AI输出
在 `.env` 中添加代理配置支持：

```env
# ===== 代理配置（加速海外Supabase访问） =====
HTTP_PROXY=http://127.0.0.1:7890
HTTPS_PROXY=http://127.0.0.1:7890
```

在 `app.py` 中实现代理session：

```python
_session = None
def get_session():
    global _session
    if _session is None:
        _session = requests.Session()
        if HTTP_PROXY or HTTPS_PROXY:
            proxies = {}
            if HTTP_PROXY:
                proxies["http"] = HTTP_PROXY
            if HTTPS_PROXY:
                proxies["https"] = HTTPS_PROXY
            _session.proxies.update(proxies)
            print(f"[代理] 已启用: {proxies}")
    return _session
```

### 对应文件
- `backend/.env` (第10-13行)
- `backend/app.py` (第43-59行)

---

## 序号8：前端auth.tsx适配后端返回格式

### 用户指令
```
前端注册/登录请求全部转发本地后端http://127.0.0.1:5000，不访问任何海外服务。
```

### AI输出
修改 `auth.tsx`，适配后端返回的 `session.access_token` 格式：

```typescript
const login = async (email: string, password: string) => {
  const response = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  })
  const data = await response.json()
  if (data.success && data.data) {
    const { user: userData, session } = data.data
    const accessToken = session?.access_token || ''
    setUser(userData)
    setToken(accessToken)
    localStorage.setItem('auth_token', accessToken)
    localStorage.setItem('auth_user', JSON.stringify(userData))
    return { success: true, message: '登录成功' }
  }
  return { success: false, message: data.message || '登录失败' }
}
```

### 对应文件
- `frontend/lib/auth.tsx` (第48-72行)

---

## 序号9：健康检测接口+数据库保活

### 用户指令
```
/api/health 健康检测接口，访问即连接数据库保活，防止SQLPub闲置清空数据。
```

### AI输出
实现健康检测接口：

```python
@app.route('/api/health', methods=['GET'])
def health():
    """健康检测 + Supabase保活，防止闲置"""
    try:
        resp = supabase_request(
            "GET",
            "/rest/v1/users?select=id&limit=1",
            timeout=10
        )
        if resp.status_code == 200:
            return success_response(message="服务正常，数据库连接成功")
        return error_response(f"数据库状态异常({resp.status_code})", 500)
    except Exception as e:
        print(f"[健康检测失败] {e}")
        return error_response(f"数据库连接失败: {str(e)}", 500)
```

### 对应文件
- `backend/app.py` (第208-224行)

---

## 序号10：文档材料整理

### 用户指令
```
严格按照《AI辅助编程与工程化实训考核方案》补齐所有交付物：
1. README.md - 项目简介、功能清单、启动步骤、常见报错解决方案
2. api_doc.md - 每个接口的请求参数、响应示例、状态码说明
3. prompt_shturl.md - AI对话日志模板
4. code_review.md - 代码审查报告
```

### AI输出
生成完整项目文档，符合考核标准格式要求。

### 对应文件
- `README.md`
- `api_doc.md`
- `prompt_shturl.md`
- `code_review.md`

---

## 总结

| 序号 | 需求 | 完成状态 | 核心文件 |
|------|------|----------|----------|
| 1 | Flask后端基础架构 | ✅ | backend/app.py |
| 2 | Supabase 3次重连机制 | ✅ | backend/app.py |
| 3 | 前端移除Supabase直连 | ✅ | frontend/lib/auth.tsx |
| 4 | 注册登录接口 | ✅ | backend/app.py |
| 5 | AI对话接口 | ✅ | backend/app.py |
| 6 | SQLPub数据库切换尝试 | ⚠️凭据失败 | 测试代码 |
| 7 | 代理支持 | ✅ | backend/.env |
| 8 | 前端适配后端格式 | ✅ | frontend/lib/auth.tsx |
| 9 | 健康检测+保活 | ✅ | backend/app.py |
| 10 | 文档材料 | ✅ | *.md |