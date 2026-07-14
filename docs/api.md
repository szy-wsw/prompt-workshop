# API 接口文档

## 基础信息

- **基础URL**: `http://localhost:5000/api/prompts`
- **Content-Type**: `application/json`
- **返回格式**: 统一JSON格式

## 统一返回格式

### 成功响应

```json
{
  "code": 200,
  "message": "success",
  "data": [...]
}
```

### 错误响应

```json
{
  "code": 500,
  "message": "操作失败",
  "error": "具体错误信息"
}
```

## 接口列表

### 1. 获取提示词列表

**请求方式**: GET

**请求URL**: `/api/prompts`

**请求参数**:

| 参数名 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| starred | boolean | 否 | false | 是否只查询收藏的提示词 |

**请求示例**:

```bash
# 获取全部提示词
GET /api/prompts

# 获取收藏的提示词
GET /api/prompts?starred=true
```

**成功响应**:

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": 1,
      "title": "电商文案生成",
      "content": "请帮我写一段关于新品上市的电商文案...",
      "category": "文案",
      "is_starred": true,
      "tags": ["电商", "文案", "营销"],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 2. 新增提示词

**请求方式**: POST

**请求URL**: `/api/prompts`

**请求体**:

| 字段名 | 类型 | 必填 | 默认值 | 说明 |
| :--- | :--- | :--- | :--- | :--- |
| title | string | 是 | - | 提示词标题 |
| content | string | 是 | - | 提示词内容 |
| category | string | 否 | "通用" | 分类 |
| is_starred | boolean | 否 | false | 是否收藏 |
| tags | string[] | 否 | [] | 标签数组 |

**请求示例**:

```bash
POST /api/prompts
Content-Type: application/json

{
  "title": "代码优化建议",
  "content": "请帮我优化这段代码，提高性能...",
  "category": "编程",
  "tags": ["编程", "优化", "性能"]
}
```

**成功响应**:

```json
{
  "code": 200,
  "message": "创建成功",
  "data": [
    {
      "id": 2,
      "title": "代码优化建议",
      "content": "请帮我优化这段代码，提高性能...",
      "category": "编程",
      "is_starred": false,
      "tags": ["编程", "优化", "性能"],
      "created_at": "2024-01-15T11:00:00Z"
    }
  ]
}
```

**失败响应**:

```json
{
  "code": 400,
  "message": "标题、内容不能为空",
  "error": null
}
```

### 3. 更新提示词

**请求方式**: PUT

**请求URL**: `/api/prompts/{pid}`

**路径参数**:

| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| pid | integer | 提示词ID |

**请求体**:

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| title | string | 是 | 提示词标题 |
| content | string | 是 | 提示词内容 |
| category | string | 否 | 分类 |
| is_starred | boolean | 否 | 是否收藏 |
| tags | string[] | 否 | 标签数组 |

**请求示例**:

```bash
PUT /api/prompts/1
Content-Type: application/json

{
  "title": "电商文案生成（优化版）",
  "content": "请帮我写一段吸引人的电商新品上市文案...",
  "category": "文案",
  "tags": ["电商", "文案", "营销", "新品"]
}
```

**成功响应**:

```json
{
  "code": 200,
  "message": "更新成功",
  "data": [
    {
      "id": 1,
      "title": "电商文案生成（优化版）",
      "content": "请帮我写一段吸引人的电商新品上市文案...",
      "category": "文案",
      "is_starred": true,
      "tags": ["电商", "文案", "营销", "新品"],
      "created_at": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### 4. 切换收藏状态

**请求方式**: PUT

**请求URL**: `/api/prompts/{pid}/star`

**路径参数**:

| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| pid | integer | 提示词ID |

**请求体**:

| 字段名 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| is_starred | boolean | 是 | 是否收藏 |

**请求示例**:

```bash
PUT /api/prompts/1/star
Content-Type: application/json

{
  "is_starred": true
}
```

**成功响应**:

```json
{
  "code": 200,
  "message": "操作成功",
  "data": [
    {
      "id": 1,
      "title": "电商文案生成",
      "content": "...",
      "is_starred": true,
      ...
    }
  ]
}
```

### 5. 删除提示词

**请求方式**: DELETE

**请求URL**: `/api/prompts/{pid}`

**路径参数**:

| 参数名 | 类型 | 说明 |
| :--- | :--- | :--- |
| pid | integer | 提示词ID |

**请求示例**:

```bash
DELETE /api/prompts/1
```

**成功响应**:

```json
{
  "code": 200,
  "message": "删除成功",
  "data": [
    {
      "id": 1,
      "title": "电商文案生成",
      ...
    }
  ]
}
```

## 错误码说明

| 错误码 | 说明 |
| :--- | :--- |
| 200 | 操作成功 |
| 400 | 请求参数错误 |
| 404 | 接口不存在 |
| 500 | 服务器内部错误 |

## 状态码汇总

| HTTP状态码 | 业务状态码 | 说明 |
| :--- | :--- | :--- |
| 200 | 200 | 成功 |
| 400 | 400 | 参数校验失败 |
| 404 | 404 | 资源不存在 |
| 500 | 500 | 服务器异常 |