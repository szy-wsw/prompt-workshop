import { successResponse, handleOptions } from '@/lib/supabase-server'

export const runtime = 'nodejs'

export async function OPTIONS() {
  return handleOptions()
}

export async function GET() {
  const templates = [
    {
      id: '1',
      title: '写作助手',
      content: '你是一位专业的写作助手，请帮我完善以下内容。要求语言流畅、逻辑清晰、用词准确：\n\n{{内容}}',
      tags: ['写作', '创意', '文章'],
      category: '写作',
      description: '帮助你优化和完善写作内容',
    },
    {
      id: '2',
      title: '代码生成',
      content: '请帮我编写一个{{语言}}函数，功能是：{{功能描述}}。要求代码规范、有注释、包含错误处理。',
      tags: ['编程', '代码', '开发'],
      category: '编程',
      description: '快速生成各类编程语言代码',
    },
    {
      id: '3',
      title: '翻译助手',
      content: '请将以下内容翻译成{{目标语言}}，要求准确传达原意，保持语气自然：\n\n{{原文}}',
      tags: ['翻译', '语言', '学习'],
      category: '翻译',
      description: '多语言翻译助手',
    },
    {
      id: '4',
      title: '头脑风暴',
      content: '针对主题「{{主题}}」，请列出至少10个创意想法，每个想法用简短的一句话描述。',
      tags: ['创意', '灵感', '思考'],
      category: '创意',
      description: '激发创意灵感',
    },
    {
      id: '5',
      title: '问题分析',
      content: '请分析以下问题：\n\n{{问题描述}}\n\n要求：\n1. 列出问题的根本原因\n2. 提供至少3个解决方案\n3. 评估每个方案的优缺点',
      tags: ['分析', '问题', '决策'],
      category: '分析',
      description: '深入分析问题并提供解决方案',
    },
    {
      id: '6',
      title: '邮件模板',
      content: '请帮我写一封{{邮件类型}}邮件，收件人是{{收件人}}，主题是{{主题}}。要求语气专业、内容简洁。',
      tags: ['邮件', '商务', '沟通'],
      category: '商务',
      description: '快速生成专业邮件',
    },
    {
      id: '7',
      title: '面试准备',
      content: '请帮我准备{{职位}}的面试问题，包括：\n1. 常见技术问题\n2. 行为面试问题\n3. 如何回答的建议',
      tags: ['面试', '求职', '职业'],
      category: '职业',
      description: '面试准备助手',
    },
    {
      id: '8',
      title: '故事创作',
      content: '请帮我创作一个{{类型}}故事，包含以下元素：\n- 主角：{{主角}}\n- 场景：{{场景}}\n- 冲突：{{冲突}}\n\n要求：情节跌宕起伏，结局出人意料。',
      tags: ['故事', '创作', '文学'],
      category: '创作',
      description: '创作精彩故事',
    },
  ]

  return successResponse(templates)
}