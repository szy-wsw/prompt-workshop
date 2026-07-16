'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth'
import { useThemeContext } from '../ThemeProvider'
import LoginPopup from '@/components/LoginPopup'
import { showToast } from '@/components/Toast'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

interface Model {
  name: string
  size?: number
  modified_at?: string
}

const TEMPLATES = [
  { name: '角色设定', content: '你是一位专业的{角色名称}，精通{领域技能}。请以{风格}的方式回答问题。' },
  { name: '写作助手', content: '请帮我写一篇关于{主题}的{文章类型}，要求{字数}字，风格{风格}。' },
  { name: '代码生成', content: '请使用{编程语言}实现{功能描述}，要求{技术要求}。' },
  { name: '数据分析', content: '分析以下数据：{数据内容}。请给出{分析要求}。' },
  { name: '翻译', content: '请将以下{源语言}文本翻译成{目标语言}：{文本内容}' },
  { name: '创意写作', content: '请创作一个关于{主题}的{体裁}，包含{元素}。' }
]

const API_BASE = 'http://127.0.0.1:5000'

export default function AIWorkspacePage() {
  const { user, loading: authLoading, token } = useAuth()
  const [showLoginPopup, setShowLoginPopup] = useState(false)
  const [aiOnline, setAiOnline] = useState(false)
  const [models, setModels] = useState<Model[]>([])
  const [selectedModel, setSelectedModel] = useState('')
  const [activeTab, setActiveTab] = useState<'test' | 'chat' | 'improve' | 'templates'>('test')
  const [testPrompt, setTestPrompt] = useState('')
  const [testResult, setTestResult] = useState('')
  const [testLoading, setTestLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [improvePrompt, setImprovePrompt] = useState('')
  const [improveResult, setImproveResult] = useState('')
  const [improveLoading, setImproveLoading] = useState(false)
  const { palette } = useThemeContext()
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      setShowLoginPopup(true)
    }
  }, [authLoading, user])

  useEffect(() => {
    if (user) {
      checkAiStatus()
      fetchModels()
      loadChatHistory()
    }
  }, [user])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const checkAiStatus = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_BASE}/api/ai/status`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await response.json()
      if (result.success && result.data) {
        setAiOnline((result.data as any).online)
      }
    } catch {
      setAiOnline(false)
    }
  }

  const fetchModels = async () => {
    if (!token) return
    try {
      const response = await fetch(`${API_BASE}/api/ai/models`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const result = await response.json()
      if (result.success && result.data) {
        setModels(result.data)
        if (result.data.length > 0 && !selectedModel) {
          setSelectedModel(result.data[0].name)
        }
      }
    } catch {
      // ignore
    }
  }

  const loadChatHistory = () => {
    const saved = localStorage.getItem('ai_chat_history')
    if (saved) {
      try {
        setMessages(JSON.parse(saved))
      } catch {
        localStorage.removeItem('ai_chat_history')
      }
    }
  }

  const saveChatHistory = (newMessages: Message[]) => {
    localStorage.setItem('ai_chat_history', JSON.stringify(newMessages))
  }

  const handleTestPrompt = async () => {
    if (!testPrompt.trim() || !selectedModel || !aiOnline) {
      if (!aiOnline) showToast('AI服务离线，请检查配置后重试', 'error')
      else showToast('请输入提示词并选择模型', 'error')
      return
    }

    setTestLoading(true)
    setTestResult('')
    if (!token) {
      setTestLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/ai/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ model: selectedModel, prompt: testPrompt })
      })

      if (!response.ok) {
        const error = await response.json()
        showToast(error.message || '请求失败', 'error')
        setTestLoading(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        setTestLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let resultText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6))
              if (json.response) {
                resultText += json.response
                setTestResult(resultText)
              }
              if (json.done) {
                break
              }
            } catch {
              continue
            }
          }
        }
      }
    } catch (e: any) {
      showToast(e.message || '网络错误', 'error')
    } finally {
      setTestLoading(false)
    }
  }

  const handleChat = async () => {
    if (!chatInput.trim() || !selectedModel || !aiOnline) {
      if (!aiOnline) showToast('AI服务离线，请检查配置后重试', 'error')
      else showToast('请输入内容并选择模型', 'error')
      return
    }

    const userMsg: Message = { role: 'user', content: chatInput, timestamp: Date.now() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    saveChatHistory(newMessages)
    setChatInput('')
    setChatLoading(true)

    if (!token) {
      setChatLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/ai/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: newMessages.map(m => ({ role: m.role, content: m.content }))
        })
      })

      if (!response.ok) {
        const error = await response.json()
        showToast(error.message || '请求失败', 'error')
        setChatLoading(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        setChatLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let aiContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6))
              if (json.response) {
                aiContent += json.response
                const updatedMessages = [...newMessages, { role: 'assistant' as const, content: aiContent, timestamp: Date.now() }]
                setMessages(updatedMessages)
              }
              if (json.done) {
                const finalMessages = [...newMessages, { role: 'assistant' as const, content: aiContent, timestamp: Date.now() }]
                saveChatHistory(finalMessages)
                break
              }
            } catch {
              continue
            }
          }
        }
      }
    } catch (e: any) {
      showToast(e.message || '网络错误', 'error')
    } finally {
      setChatLoading(false)
    }
  }

  const handleImprovePrompt = async () => {
    if (!improvePrompt.trim() || !selectedModel || !aiOnline) {
      if (!aiOnline) showToast('AI服务离线，请检查配置后重试', 'error')
      else showToast('请输入提示词并选择模型', 'error')
      return
    }

    setImproveLoading(true)
    setImproveResult('')
    if (!token) {
      setImproveLoading(false)
      return
    }

    try {
      const response = await fetch(`${API_BASE}/api/ai/improve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ prompt: improvePrompt, model: selectedModel })
      })

      if (!response.ok) {
        const error = await response.json()
        showToast(error.message || '请求失败', 'error')
        setImproveLoading(false)
        return
      }

      const reader = response.body?.getReader()
      if (!reader) {
        setImproveLoading(false)
        return
      }

      const decoder = new TextDecoder()
      let resultText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n\n')
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const json = JSON.parse(line.slice(6))
              if (json.response) {
                resultText += json.response
                setImproveResult(resultText)
              }
              if (json.done) {
                break
              }
            } catch {
              continue
            }
          }
        }
      }
    } catch (e: any) {
      showToast(e.message || '网络错误', 'error')
    } finally {
      setImproveLoading(false)
    }
  }

  const clearChat = () => {
    setMessages([])
    localStorage.removeItem('ai_chat_history')
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      showToast('复制成功', 'success')
    }).catch(() => {
      showToast('复制失败', 'error')
    })
  }

  const useTemplate = (content: string) => {
    if (activeTab === 'test') setTestPrompt(content)
    else if (activeTab === 'chat') setChatInput(content)
    else if (activeTab === 'improve') setImprovePrompt(content)
    showToast('模板已填充', 'success')
  }

  if (authLoading) {
    return (
      <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="card" style={{ padding: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🐾</div>
          <div style={{ color: palette.textSecondary }}>加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: palette.text }}>
          🤖 AI工作台
        </h1>
        <p style={{ color: palette.textSecondary }}>与AI交互的专属空间</p>
      </div>

      <div
        style={{
          background: `${palette.primary}10`,
          borderRadius: 16,
          padding: '16px 24px',
          marginBottom: 24,
          border: `1px solid ${palette.primary}20`
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span>📡</span>
          <span style={{ fontSize: 14, color: palette.textSecondary, flex: 1 }}>
            AI服务使用云端豆包API，无需本地部署，登录即可使用。单账号每分钟最多8次请求。
          </span>
          <span
            className="tag"
            style={{
              background: aiOnline ? `${palette.success}20` : `${palette.error}20`,
              color: aiOnline ? palette.success : palette.error
            }}
          >
            {aiOnline ? '🟢 在线' : '🔴 离线'}
          </span>
        </div>
      </div>

      {!aiOnline && (
        <div className="card" style={{ textAlign: 'center', padding: '40px', marginBottom: 24 }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>💤</div>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: palette.text }}>
            AI服务暂不可用
          </h3>
          <p style={{ color: palette.textSecondary }}>
            请检查后端配置文件中VOLC_ARK_API_KEY和VOLC_ARK_MODEL_EP是否正确设置
          </p>
          <button className="btn-secondary" onClick={checkAiStatus} style={{ marginTop: 16 }}>
            🔄 重新检测
          </button>
        </div>
      )}

      <div className="card">
        <div style={{ display: 'flex', borderBottom: `1px solid ${palette.border}`, marginBottom: 20 }}>
          {[
            { key: 'test' as const, label: '📝 单条测试' },
            { key: 'chat' as const, label: '💬 多轮对话' },
            { key: 'improve' as const, label: '✨ 润色优化' },
            { key: 'templates' as const, label: '📚 模板库' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '12px 24px',
                background: activeTab === tab.key ? `${palette.primary}15` : 'transparent',
                border: 'none',
                color: activeTab === tab.key ? palette.primary : palette.textSecondary,
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                borderBottom: activeTab === tab.key ? `3px solid ${palette.primary}` : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 500, color: palette.text, fontSize: 13 }}>
            选择模型
          </label>
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            disabled={models.length === 0}
            style={{
              width: '100%',
              padding: '10px 16px',
              borderRadius: 10,
              border: `2px solid ${palette.border}`,
              fontSize: 14,
              background: palette.bg,
              color: palette.text,
              cursor: 'pointer'
            }}
          >
            {models.length === 0 ? (
              <option value="">正在加载模型列表...</option>
            ) : (
              models.map(m => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))
            )}
          </select>
        </div>

        {activeTab === 'test' && (
          <div>
            <textarea
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="输入您的提示词，点击测试按钮查看AI响应..."
              rows={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${palette.border}`,
                fontSize: 14,
                background: palette.bg,
                color: palette.text,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setTestPrompt('')}>
                清空
              </button>
              <button className="btn-primary" onClick={handleTestPrompt} disabled={testLoading}>
                {testLoading ? '测试中...' : '🚀 开始测试'}
              </button>
            </div>
            {testResult && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500, color: palette.text }}>AI 响应</span>
                  <button
                    onClick={() => copyToClipboard(testResult)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: palette.primary,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    📋 复制
                  </button>
                </div>
                <div
                  style={{
                    background: palette.bg,
                    padding: '16px',
                    borderRadius: 12,
                    border: `1px solid ${palette.border}`,
                    fontSize: 14,
                    color: palette.text,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {testResult}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'chat' && (
          <div>
            <div
              style={{
                background: palette.bg,
                padding: 16,
                borderRadius: 12,
                border: `1px solid ${palette.border}`,
                maxHeight: 400,
                overflowY: 'auto',
                marginBottom: 16
              }}
            >
              {messages.length === 0 ? (
                <div style={{ textAlign: 'center', color: palette.textSecondary, padding: 32 }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>💬</div>
                  <div>开始与AI对话吧！</div>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div key={index} style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: msg.role === 'user' ? palette.primary : `${palette.success}60`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        flexShrink: 0
                      }}
                    >
                      {msg.role === 'user' ? '👤' : '🤖'}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          background: msg.role === 'user' ? `${palette.primary}15` : palette.bgCard,
                          padding: 12,
                          borderRadius: msg.role === 'user' ? '12px 12px 0 12px' : '12px 12px 12px 0',
                          fontSize: 14,
                          color: palette.text,
                          lineHeight: 1.6,
                          border: msg.role === 'assistant' ? `1px solid ${palette.border}` : 'none'
                        }}
                      >
                        {msg.content}
                      </div>
                      <div style={{ fontSize: 11, color: palette.textSecondary, marginTop: 4 }}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && !chatLoading && handleChat()}
                placeholder="输入消息..."
                disabled={chatLoading}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: `2px solid ${palette.border}`,
                  fontSize: 14,
                  background: palette.bg,
                  color: palette.text
                }}
              />
              <button className="btn-primary" onClick={handleChat} disabled={chatLoading}>
                {chatLoading ? '发送中...' : '发送'}
              </button>
              <button className="btn-secondary" onClick={clearChat}>
                清空
              </button>
            </div>
          </div>
        )}

        {activeTab === 'improve' && (
          <div>
            <textarea
              value={improvePrompt}
              onChange={(e) => setImprovePrompt(e.target.value)}
              placeholder="输入您想要优化的提示词，AI会自动完善结构..."
              rows={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: `2px solid ${palette.border}`,
                fontSize: 14,
                background: palette.bg,
                color: palette.text,
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 16 }}>
              <button className="btn-secondary" onClick={() => setImprovePrompt('')}>
                清空
              </button>
              <button className="btn-primary" onClick={handleImprovePrompt} disabled={improveLoading}>
                {improveLoading ? '优化中...' : '✨ 优化提示词'}
              </button>
            </div>
            {improveResult && (
              <div style={{ marginTop: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontWeight: 500, color: palette.text }}>优化结果</span>
                  <button
                    onClick={() => copyToClipboard(improveResult)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: palette.primary,
                      fontSize: 14,
                      cursor: 'pointer'
                    }}
                  >
                    📋 复制
                  </button>
                </div>
                <div
                  style={{
                    background: `${palette.success}10`,
                    padding: '16px',
                    borderRadius: 12,
                    border: `1px solid ${palette.success}30`,
                    fontSize: 14,
                    color: palette.text,
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  {improveResult}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {TEMPLATES.map((template, index) => (
                <div
                  key={index}
                  className="card"
                  style={{
                    padding: 20,
                    borderLeft: `4px solid ${palette.primary}`,
                    transition: 'transform 0.2s',
                    cursor: 'pointer'
                  }}
                  onClick={() => useTemplate(template.content)}
                  onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: palette.text, marginBottom: 8 }}>
                    {template.name}
                  </div>
                  <div style={{ fontSize: 13, color: palette.textSecondary, lineHeight: 1.5 }}>
                    {template.content.slice(0, 100)}...
                  </div>
                  <div style={{ marginTop: 12, fontSize: 13, color: palette.primary, fontWeight: 500 }}>
                    点击使用 →
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <LoginPopup isOpen={showLoginPopup} onClose={() => setShowLoginPopup(false)} />
    </div>
  )
}