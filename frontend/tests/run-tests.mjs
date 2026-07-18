#!/usr/bin/env node
/**
 * 自动化集成测试脚本
 * 用法：node tests/run-tests.mjs
 * 环境变量：BASE_URL (默认 http://localhost:3000)
 *
 * 测试内容：
 * 1. 用户注册
 * 2. 用户登录
 * 3. 获取用户信息
 * 4. 创建提示词
 * 5. 获取提示词列表
 * 6. 点赞/收藏
 * 7. 头像上传（可选，需要图片文件）
 * 8. 修改密码
 * 9. 聊天（需要 SILICONFLOW_API_KEY）
 */

import { randomBytes } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

let passed = 0
let failed = 0
const results = []

function test(name, fn) {
  results.push({ name, fn })
}

async function runAll() {
  console.log('\n' + '='.repeat(60))
  console.log('  Prompt Workshop - 自动化集成测试')
  console.log(`  测试目标: ${BASE_URL}`)
  console.log('='.repeat(60) + '\n')

  const testUser = {
    email: `test_${randomBytes(6).toString('hex')}@example.com`,
    password: 'test123456',
    nickname: '测试用户',
  }

  let token = ''
  let userId = ''
  let promptId = ''

  // ========== 测试用例 ==========

  test('健康检查 - 首页可访问', async () => {
    const res = await fetch(`${BASE_URL}/`)
    assert(res.ok, `首页返回 ${res.status}`)
  })

  test('注册 - 新用户注册成功', async () => {
    const res = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    })
    const data = await res.json()
    assert(res.ok && data.success, `注册失败: ${data.message || res.statusText}`)
  })

  test('注册 - 重复邮箱注册失败', async () => {
    const res = await fetch(`${BASE_URL}/api/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser),
    })
    const data = await res.json()
    assert(!data.success, '重复注册应该失败')
  })

  test('登录 - 密码错误登录失败', async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: 'wrongpass' }),
    })
    const data = await res.json()
    assert(!data.success, '密码错误应该登录失败')
  })

  test('登录 - 正确密码登录成功', async () => {
    const res = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    })
    const data = await res.json()
    assert(data.success && data.data, `登录失败: ${data.message || res.statusText}`)
    token = data.data.session.access_token
    userId = data.data.user.id
    assert(token, '应该返回 token')
    assert(userId, '应该返回 user id')
  })

  test('提示词 - 创建公开提示词', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: '测试提示词 - 写作助手',
        content: '你是一位专业的写作助手，请帮我写一篇关于AI的短文。',
        tags: ['测试', '写作', 'AI'],
        visibility: 'public',
      }),
    })
    const data = await res.json()
    assert(data.success, `创建失败: ${data.message || res.statusText}`)
    promptId = data.data.id
    assert(promptId, '应该返回 prompt id')
  })

  test('提示词 - 创建私密提示词', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: '我的私密笔记',
        content: '这是一条私密提示词内容。',
        tags: ['私密'],
        visibility: 'private',
      }),
    })
    const data = await res.json()
    assert(data.success, `创建私密提示词失败: ${data.message || res.statusText}`)
  })

  test('提示词 - 获取公开列表', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts?visibility=public&per_page=10`)
    const data = await res.json()
    assert(data.success && data.data, `获取列表失败: ${data.message || res.statusText}`)
    assert(data.data.data.length > 0, '公开列表应该有数据')
  })

  test('提示词 - 搜索功能', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts?visibility=public&search=写作`)
    const data = await res.json()
    assert(data.success, `搜索失败: ${data.message || res.statusText}`)
  })

  test('提示词 - 标签过滤', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts?visibility=public&tag=测试`)
    const data = await res.json()
    assert(data.success, `标签过滤失败: ${data.message || res.statusText}`)
  })

  test('提示词 - 我的提示词列表', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts?user_id=${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    assert(data.success && data.data, `获取我的列表失败: ${data.message || res.statusText}`)
  })

  test('提示词 - 未登录无法查看他人私密提示词', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts?user_id=${userId}&visibility=private`)
    const data = await res.json()
    assert(res.status === 401 || (data.data && data.data.total === 0), '未授权不应看到私密内容')
  })

  test('点赞 - 点赞提示词', async () => {
    const res = await fetch(`${BASE_URL}/api/likes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt_id: promptId }),
    })
    const data = await res.json()
    assert(data.success, `点赞失败: ${data.message || res.statusText}`)
  })

  test('点赞 - 检查点赞状态', async () => {
    const res = await fetch(`${BASE_URL}/api/likes/check?prompt_id=${promptId}&user_id=${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    assert(data.success && data.data.liked === true, '应该已点赞')
  })

  test('点赞 - 取消点赞', async () => {
    const res = await fetch(`${BASE_URL}/api/likes`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt_id: promptId }),
    })
    const data = await res.json()
    assert(data.success, `取消点赞失败: ${data.message || res.statusText}`)
  })

  test('收藏 - 收藏提示词', async () => {
    const res = await fetch(`${BASE_URL}/api/collections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt_id: promptId }),
    })
    const data = await res.json()
    assert(data.success, `收藏失败: ${data.message || res.statusText}`)
  })

  test('收藏 - 检查收藏状态', async () => {
    const res = await fetch(`${BASE_URL}/api/collections/check?prompt_id=${promptId}&user_id=${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    assert(data.success && data.data.collected === true, '应该已收藏')
  })

  test('收藏 - 获取收藏列表', async () => {
    const res = await fetch(`${BASE_URL}/api/collections`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    assert(data.success && data.data, `获取收藏列表失败: ${data.message || res.statusText}`)
  })

  test('收藏 - 取消收藏', async () => {
    const res = await fetch(`${BASE_URL}/api/collections`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt_id: promptId }),
    })
    const data = await res.json()
    assert(data.success, `取消收藏失败: ${data.message || res.statusText}`)
  })

  test('用户 - 统计数据', async () => {
    const res = await fetch(`${BASE_URL}/api/users/stats?user_id=${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    assert(data.success && data.data, `获取统计失败: ${data.message || res.statusText}`)
  })

  test('用户 - 更新昵称', async () => {
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ nickname: '测试用户新昵称' }),
    })
    const data = await res.json()
    assert(data.success, `更新昵称失败: ${data.message || res.statusText}`)
  })

  test('用户 - 修改密码（旧密码错误时失败）', async () => {
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ old_password: 'wrong', new_password: 'newpass123' }),
    })
    const data = await res.json()
    assert(!data.success, '旧密码错误时修改应该失败')
  })

  test('用户 - 修改密码成功', async () => {
    const newPass = 'newtest123456'
    const res = await fetch(`${BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ old_password: testUser.password, new_password: newPass }),
    })
    const data = await res.json()
    assert(data.success, `修改密码失败: ${data.message || res.statusText}`)
    // 验证新密码可以登录
    const loginRes = await fetch(`${BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testUser.email, password: newPass }),
    })
    const loginData = await loginRes.json()
    assert(loginData.success, '新密码应该可以登录')
    token = loginData.data.session.access_token
    testUser.password = newPass
  })

  test('模板 - 获取模板列表', async () => {
    const res = await fetch(`${BASE_URL}/api/templates`)
    const data = await res.json()
    assert(data.success, `获取模板失败: ${data.message || res.statusText}`)
  })

  test('提示词 - 编辑提示词', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts/${promptId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: '编辑后的标题',
        content: '编辑后的内容',
        tags: ['编辑', '测试'],
        visibility: 'public',
      }),
    })
    const data = await res.json()
    assert(data.success, `编辑失败: ${data.message || res.statusText}`)
  })

  test('提示词 - 版本历史', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts/${promptId}/history`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    const data = await res.json()
    assert(data.success, `获取历史失败: ${data.message || res.statusText}`)
  })

  test('提示词 - 删除提示词', async () => {
    const res = await fetch(`${BASE_URL}/api/prompts/${promptId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
    const data = await res.json()
    assert(data.success, `删除失败: ${data.message || res.statusText}`)
  })

  // ========== 运行测试 ==========

  for (const { name, fn } of results) {
    try {
      await fn()
      passed++
      console.log(`  ✓ ${name}`)
    } catch (err) {
      failed++
      console.log(`  ✗ ${name}`)
      console.log(`     错误: ${err.message}`)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`  测试完成: 通过 ${passed}/${passed + failed}`)
  if (failed > 0) {
    console.log(`  失败: ${failed}`)
  }
  console.log('='.repeat(60) + '\n')

  process.exit(failed > 0 ? 1 : 0)
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || '断言失败')
  }
}

runAll().catch(err => {
  console.error('\n测试运行出错:', err)
  process.exit(1)
})
