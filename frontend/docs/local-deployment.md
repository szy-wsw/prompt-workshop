# Prompt Workshop 本地部署操作手册

> **项目状态说明**
> - 项目代码已推送 GitHub 公开仓库，本地 `localhost:3000` 所有功能已完整实现并自测通过。
> - 唯一缺失项为线上 Demo 访问链接（自定义域名 `szy050604.top` 未完成实名认证 + DNS 解析，暂无法线上部署）。
> - 本手册面向需要在本地从零搭建开发环境的开发者，覆盖从环境准备到功能自测的完整流程。

---

## 1. 前置环境要求

在开始部署前，请确保本地已安装以下软件环境：

| 软件       | 最低版本   | 验证命令          | 说明                                  |
| ---------- | ---------- | ----------------- | ------------------------------------- |
| Node.js    | 18.0+      | `node -v`         | 推荐 LTS 版本（本项目基于 Next.js 16）|
| npm        | 9.0+       | `npm -v`          | 随 Node.js 一起安装                   |
| Git        | 2.20+      | `git --version`   | 用于克隆代码仓库                      |
| 现代浏览器 | 最新版     | -                 | Chrome / Edge / Firefox，用于自测     |

### 1.1 验证环境

```bash
node -v
# 预期输出：v18.x.x 或更高

npm -v
# 预期输出：9.x.x 或更高

git --version
# 预期输出：git version 2.x.x
```

### 1.2 克隆代码仓库

```bash
git clone <项目 GitHub 仓库地址>
cd prompt-workshop/frontend
```

---

## 2. Supabase 项目创建步骤

### 2.1 注册 Supabase 账号

1. 访问 [https://supabase.com](https://supabase.com)
2. 点击右上角 **Sign in**，使用 GitHub 账号或邮箱注册登录
3. 登录后进入 Dashboard 控制台

### 2.2 创建新项目

1. 点击 **New project**
2. 填写项目信息：
   - **Name**：`prompt-workshop`（可自定义）
   - **Database Password**：设置强密码并妥善保存
   - **Region**：选择离你最近的区域（如 `Southeast Asia (Singapore)`）
   - **Pricing Plan**：选择 **Free**（免费版足够本地开发）
3. 点击 **Create new project**，等待 1-2 分钟项目初始化完成

### 2.3 获取 Project URL 和 API Keys

1. 进入项目 Dashboard
2. 左侧菜单点击 **Project Settings**（齿轮图标）
3. 点击 **API** 子菜单
4. 记录以下信息（后续配置 `.env.local` 需要）：

| 配置项                  | 位置                  | 说明                                  |
| ----------------------- | --------------------- | ------------------------------------- |
| `Project URL`           | Project URL 区域      | 形如 `https://xxxxx.supabase.co`      |
| `anon` public key       | Project API keys 区域 | 以 `sb_publishable_` 开头             |
| `service_role` secret key| Project API keys 区域 | 以 `sb_secret_` 开头，**点击 reveal 显示** |

> **⚠️ 安全提示**：`service_role` key 拥有绕过 RLS 的完全权限，**严禁提交到 Git 仓库或暴露在前端代码中**。

---

## 3. 执行建表 SQL 步骤

### 3.1 进入 SQL Editor

1. 在 Supabase Dashboard 左侧菜单点击 **SQL Editor**
2. 点击 **New query** 新建查询

### 3.2 粘贴并执行 schema.sql

1. 打开本地项目文件 `supabase/schema.sql`
2. 全选并复制文件内容
3. 粘贴到 SQL Editor 的查询框中
4. 点击 **Run**（或按 `Ctrl + Enter`）执行

### 3.3 验证表创建成功

执行以下查询验证 7 张表均已创建：

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

预期输出 7 行记录：

```
chat_history
collections
likes
prompt_history
prompts
templates
users
```

也可通过左侧 **Table Editor** 菜单直观查看所有表。

### 3.4 验证模板数据

```sql
select title, category from public.templates;
```

预期输出 3 条记录：`文案润色大师`、`代码审查专家`、`翻译官`。

---

## 4. 创建 avatars 存储桶步骤

### 4.1 进入 Storage

1. 在 Supabase Dashboard 左侧菜单点击 **Storage**
2. 点击 **New bucket**

### 4.2 配置存储桶

| 配置项           | 值         | 说明                       |
| ---------------- | ---------- | -------------------------- |
| Name             | `avatars`  | 存储桶名称（必须为 avatars）|
| Public bucket    | ✅ 勾选    | 公开存储桶，允许公开读取   |

### 4.3 完成创建

点击 **Create bucket**，确认 `avatars` 存储桶出现在列表中，且标记为 `Public`。

> **说明**：`schema.sql` 中已包含自动创建存储桶的 SQL 逻辑，但因依赖 `storage` schema 的初始化时机，**推荐使用 Dashboard 手动创建**以确保成功。

---

## 5. 配置本地 CORS 策略

### 5.1 CORS 策略文件说明

项目已提供 `supabase/cors-policy.json`，内容如下：

```json
{
  "$schema": "https://supabase.com/schema/storage-cors.json",
  "description": "Prompt Workshop - avatars 存储桶 CORS 策略（仅适配 localhost 本地开发）",
  "buckets": [
    {
      "bucket_id": "avatars",
      "cors": [
        {
          "allowed_origins": [
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ],
          "allowed_methods": ["GET", "POST", "PUT", "DELETE", "HEAD"],
          "allowed_headers": ["Content-Type", "Authorization", "x-upsert"],
          "exposed_headers": ["Content-Length", "ETag"],
          "max_age_seconds": 3600
        }
      ]
    }
  ],
  "note": "线上域名 CORS 配置待自定义域名完成实名认证与 DNS 解析后补充"
}
```

**配置说明**：

| 配置项             | 值                                              | 说明                                  |
| ------------------ | ----------------------------------------------- | ------------------------------------- |
| allowed_origins    | `http://localhost:3000`、`http://127.0.0.1:3000`| 仅允许本地开发域名跨域访问            |
| allowed_methods    | GET/POST/PUT/DELETE/HEAD                        | 覆盖头像上传、读取、更新、删除操作    |
| allowed_headers    | Content-Type、Authorization、x-upsert           | 支持认证头与 upsert 模式上传          |
| max_age_seconds    | 3600                                            | 预检请求缓存 1 小时，减少 OPTIONS 请求|

### 5.2 在 Dashboard 中配置 CORS

1. 进入 Supabase Dashboard → **Storage**
2. 点击 `avatars` 存储桶右侧的 **三点菜单** → **Edit bucket** 或进入 **Configuration** → **CORS Policy**
3. 添加 CORS 规则，按 `supabase/cors-policy.json` 中的内容填写：
   - **Allowed Origins**：`http://localhost:3000`、`http://127.0.0.1:3000`
   - **Allowed Methods**：勾选 GET、POST、PUT、DELETE、HEAD
   - **Allowed Headers**：`Content-Type`、`Authorization`、`x-upsert`
   - **Exposed Headers**：`Content-Length`、`ETag`
   - **Max Age (seconds)**：`3600`
4. 点击 **Save** 保存

> **注意**：未配置 CORS 会导致前端上传头像时浏览器报跨域错误（`CORS policy: No 'Access-Control-Allow-Origin'`）。

---

## 6. 配置 .env.local 环境变量

### 6.1 创建环境变量文件

在项目根目录 `frontend/` 下创建 `.env.local` 文件（**该文件已被 `.gitignore` 忽略，不会提交到仓库**）。

### 6.2 环境变量清单

```bash
# ============================================
# Supabase 配置
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=sb_secret_your_service_role_key_here

# ============================================
# Auth JWT 配置
# ============================================
JWT_SECRET=your-custom-jwt-secret-string

# ============================================
# SiliconFlow AI 配置
# ============================================
SILICONFLOW_API_KEY=sk-your-siliconflow-api-key-here
FREE_MODEL_ID=Qwen/Qwen2.5-7B-Instruct

# ============================================
# 应用 URL（自动适配本地/开发/生产环境）
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 6.3 变量说明

| 变量名                          | 说明                                                      | 获取方式                                |
| ------------------------------- | --------------------------------------------------------- | --------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Supabase 项目 URL                                         | Dashboard → Settings → API              |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 公开密钥（前端可见，受 RLS 保护）                | Dashboard → Settings → API              |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase 服务端密钥（**仅服务端使用**，绕过 RLS）         | Dashboard → Settings → API → reveal     |
| `JWT_SECRET`                    | 自定义 JWT 签名密钥（用于用户登录 Token 签发与校验）      | 自行生成强随机字符串                    |
| `SILICONFLOW_API_KEY`           | 硅基流动 SiliconFlow API 密钥                             | [硅基流动控制台](https://cloud.siliconflow.cn) → API 密钥 |
| `FREE_MODEL_ID`                 | AI 模型 ID                                                | 默认 `Qwen/Qwen2.5-7B-Instruct`         |
| `NEXT_PUBLIC_APP_URL`           | 应用访问 URL（本地开发为 `http://localhost:3000`）        | 本地固定为 `http://localhost:3000`      |

### 6.4 生成 JWT_SECRET 建议

可使用以下命令生成强随机字符串作为 `JWT_SECRET`：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 6.5 获取 SiliconFlow API Key

1. 访问 [https://cloud.siliconflow.cn](https://cloud.siliconflow.cn) 注册登录
2. 进入 **API 密钥** 页面
3. 点击 **新建 API 密钥**
4. 复制生成的密钥（以 `sk-` 开头）填入 `SILICONFLOW_API_KEY`

---

## 7. 安装依赖并启动

### 7.1 安装项目依赖

在项目根目录 `frontend/` 下执行：

```bash
npm install
```

等待依赖安装完成（首次安装约 1-3 分钟）。

### 7.2 启动开发服务器

```bash
npm run dev
```

启动成功后，终端会输出：

```
▲ Next.js 16.2.10
- Local:        http://localhost:3000
- Network:      http://x.x.x.x:3000

✓ Starting...
✓ Ready in xxxxms
```

### 7.3 访问应用

打开浏览器访问 [http://localhost:3000](http://localhost:3000)，即可看到 Prompt Workshop 首页。

### 7.4 可用 npm 脚本

| 命令               | 说明                                  |
| ------------------ | ------------------------------------- |
| `npm run dev`      | 启动开发服务器（热更新）              |
| `npm run build`    | 生产环境构建                          |
| `npm run start`    | 启动生产服务器（需先 build）          |
| `npm run lint`     | 运行 ESLint 代码检查                  |
| `npm run typecheck`| 运行 TypeScript 类型检查              |
| `npm run test`     | 运行测试套件                          |
| `npm run test:local`| 启动开发服务器并运行本地测试         |

---

## 8. localhost 全功能自测步骤

完成以上配置并启动开发服务器后，请按以下步骤逐一验证功能。

### 8.1 访问首页

- 操作：浏览器访问 [http://localhost:3000](http://localhost:3000)
- 预期：看到 Prompt Workshop 首页，可浏览公开提示词广场与模板列表

### 8.2 注册账号

- 操作：点击 **注册**，填写邮箱、密码、昵称，提交注册
- 预期：注册成功，自动登录或跳转登录页；数据库 `users` 表新增一条记录

### 8.3 登录

- 操作：使用注册的邮箱密码登录
- 预期：登录成功，页面显示用户昵称与头像占位符；本地存储中存在 JWT Token

### 8.4 创建提示词

- 操作：进入「我的提示词」→ **新建提示词**，填写标题、内容、标签，选择可见性（公开/私有），保存
- 预期：数据库 `prompts` 表新增记录；若设为公开，则提示词广场可见

### 8.5 上传头像

- 操作：进入「个人中心」→ 点击头像上传区域 → 选择本地图片 → 上传
- 预期：
  - 图片上传至 Supabase Storage `avatars` 存储桶
  - `users` 表的 `avatar_url`、`avatar_path` 字段更新
  - 页面显示新头像

### 8.6 AI 对话

- 操作：进入「AI 对话」页面 → 输入消息 → 发送
- 预期：
  - 调用 SiliconFlow `Qwen/Qwen2.5-7B-Instruct` 模型
  - 页面显示 AI 响应内容
  - 数据库 `chat_history` 表新增对话记录

### 8.7 点赞与收藏

- 操作：
  - 在提示词广场或详情页，点击某条公开提示词的 **点赞** 按钮
  - 点击 **收藏** 按钮
- 预期：
  - `likes` 表、`collections` 表新增记录
  - `prompts.likes_count` 字段 +1
  - 再次点击可取消点赞/收藏（记录删除）

### 8.8 提示词历史

- 操作：编辑已有提示词的内容并保存
- 预期：`prompt_history` 表新增一条编辑前的快照记录

### 8.9 模板使用

- 操作：进入「模板」页面 → 选择一个模板（如「文案润色大师」）→ 使用模板
- 预期：模板内容填入提示词创建表单，可基于模板创建新提示词

---

## 9. 线上部署

> **域名完成实名认证 + DNS 解析后补充 Vercel 部署步骤**
>
> 本章节预留，待自定义域名 `szy050604.top` 完成以下事项后补充：
> 1. 阿里云域名实名认证
> 2. DNS 解析配置
> 3. Vercel 项目导入与部署
> 4. Vercel 环境变量配置
> 5. 自定义域名绑定
> 6. 线上 CORS 与 Storage 权限调整
> 7. 线上功能验证
>
> **当前状态**：项目代码已推送 GitHub，本地功能全部实现，唯一缺失为线上 Demo 访问链接。
>
> 项目已预置 `vercel.json` 部署配置文件（框架为 nextjs，构建命令 `npm run build`，输出目录 `.next`，并为 `/api/(.*)` 路径配置了 CORS 响应头）。

---

## 10. 常见问题排查

### 10.1 端口 3000 被占用

**现象**：启动 `npm run dev` 时报错 `Port 3000 is in use`。

**解决方案**：

1. 查找占用端口的进程：
   ```bash
   # Windows
   netstat -ano | findstr :3000
   tasklist | findstr <PID>
   ```
2. 终止占用进程：
   ```bash
   # Windows
   taskkill /PID <PID> /F
   ```
3. 或指定其他端口启动：
   ```bash
   npx next dev -p 3001
   ```
   > 注意：更换端口后需同步更新 `.env.local` 中的 `NEXT_PUBLIC_APP_URL` 与 Supabase Storage CORS 配置。

### 10.2 Supabase 连接失败

**现象**：页面报错 `Supabase connection error` 或 API 返回 500。

**排查步骤**：

1. 检查 `.env.local` 中 `NEXT_PUBLIC_SUPABASE_URL` 是否正确（无多余空格、协议为 `https://`）
2. 检查 `NEXT_PUBLIC_SUPABASE_ANON_KEY` 是否完整
3. 在 Supabase Dashboard 检查项目状态是否为 **Active**
4. 检查网络是否能访问 Supabase 域名（浏览器直接访问 `Project URL` 应返回 JSON）
5. 重启开发服务器：`Ctrl + C` 后重新 `npm run dev`

### 10.3 AI 接口返回 401 未授权

**现象**：AI 对话功能报错 `401 Unauthorized` 或 `Invalid API key`。

**排查步骤**：

1. 检查 `.env.local` 中 `SILICONFLOW_API_KEY` 是否以 `sk-` 开头且完整
2. 登录 [硅基流动控制台](https://cloud.siliconflow.cn) 确认 API 密钥有效且未禁用
3. 确认账户余额充足或免费额度未耗尽
4. 检查 `FREE_MODEL_ID` 是否为 `Qwen/Qwen2.5-7B-Instruct`（精确匹配大小写）
5. 重启开发服务器使环境变量生效

### 10.4 头像上传失败

**现象**：上传头像报错 `CORS policy` 或 `Upload failed`。

**排查步骤**：

1. **检查存储桶是否存在**：Dashboard → Storage，确认 `avatars` 存储桶已创建且为 Public
2. **检查 CORS 配置**：确认 `avatars` 存储桶的 CORS 策略中已添加 `http://localhost:3000`
3. **检查 service_role key**：上传逻辑在服务端使用 `SUPABASE_SERVICE_ROLE_KEY`，确认配置正确
4. **检查文件大小与格式**：建议单张头像不超过 2MB，格式为 jpg/png/webp
5. **查看浏览器控制台**：F12 → Console 查看详细错误信息
6. **查看服务端日志**：终端中查看 Next.js API 路由的报错输出

### 10.5 注册/登录失败

**现象**：注册或登录接口返回错误。

**排查步骤**：

1. 检查 `JWT_SECRET` 是否已配置（不能为空）
2. 检查 `SUPABASE_SERVICE_ROLE_KEY` 是否正确（注册需要写入 `users` 表）
3. 在 Supabase Dashboard → Table Editor → `users` 表确认表已创建
4. 检查邮箱是否已被注册（`email` 字段为 UNIQUE）
5. 查看终端 API 路由日志

### 10.6 数据库表未创建成功

**现象**：API 报错 `relation "public.xxx" does not exist`。

**排查步骤**：

1. 在 SQL Editor 中执行第 3.3 节的验证查询
2. 确认 `schema.sql` 完整执行（无报错中断）
3. 若部分表缺失，可单独执行对应表的 CREATE 语句
4. 确认 `pgcrypto` 扩展已启用：`select * from pg_extension where extname = 'pgcrypto';`

### 10.7 npm install 失败

**现象**：依赖安装报错或卡住。

**解决方案**：

1. 清理缓存：`npm cache clean --force`
2. 删除 `node_modules` 与 `package-lock.json` 后重装：
   ```bash
   rmdir /s /q node_modules
   del package-lock.json
   npm install
   ```
3. 切换 npm 镜像源：
   ```bash
   npm config set registry https://registry.npmmirror.com
   npm install
   ```
4. 确认 Node.js 版本 ≥ 18

### 10.8 页面样式丢失

**现象**：页面无样式或布局错乱。

**排查步骤**：

1. 确认 `npm install` 已完整执行（含 `tailwindcss`、`antd` 依赖）
2. 清除浏览器缓存后硬刷新（`Ctrl + F5`）
3. 删除 `.next` 构建缓存后重启：
   ```bash
   rmdir /s /q .next
   npm run dev
   ```

---

## 附录：项目技术栈

| 类别       | 技术/工具                          | 版本       |
| ---------- | ---------------------------------- | ---------- |
| 前端框架   | Next.js (App Router)               | 16.2.10    |
| 编程语言   | TypeScript                         | ^5         |
| UI 框架    | React                              | 19.2.4     |
| 组件库     | Ant Design                         | ^6.5.1     |
| CSS 框架   | Tailwind CSS                       | ^4         |
| 后端服务   | Supabase (PostgreSQL + Storage)    | -          |
| Supabase SDK| @supabase/supabase-js / @supabase/ssr | ^2.110.7 / ^0.12.3 |
| AI 模型    | SiliconFlow Qwen/Qwen2.5-7B-Instruct | -       |
| 部署平台   | Vercel                             | -          |
| 开发工具   | Cursor AI                          | -          |
| 版本控制   | Git + GitHub                       | -          |

> **备注**：项目代码已推送 GitHub 公开仓库，本地 `localhost:3000` 所有功能正常，唯一缺失为线上 Demo 访问链接（待域名实名认证 + DNS 解析完成后补充）。
