const http = require('http');
const PORT = process.env.PORT || 3456;

const setCORS = (res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');
};

const generateDashboardData = () => ({
  timestamp: new Date().toISOString(),
  system: {
    status: 'online',
    version: 'v2.2-hybrid',
    uptime: '99.9%',
    model: 'kimi-k2.5',
    kairos: 'running',
    features: ['ai-image-generation', 'multi-agent', 'dag-workflow']
  },
  kpi: {
    totalAgents: 13,
    totalTeams: 6,
    memoryTopics: 12,
    memoryLogs: 30,
    todayTasks: 24,
    completedTasks: 18,
    uptime: '99.9%',
    performance: '98%',
    buddyLevel: 5,
    buddyXp: 1250,
    imagesGenerated: 47,
    imagesCost: 1.88
  },
  agents: [
    { id: 'orchestrator', name: 'Orchestrator', displayName: '🎭 Orchestrator', role: '协调员', status: 'active', isBuddy: false, team: 'business', tasksCompleted: 156 },
    { id: 'researcher', name: 'Researcher', displayName: '🔍 Researcher', role: '市场分析师', status: 'active', isBuddy: false, team: 'business', tasksCompleted: 89 },
    { id: 'copywriter', name: 'Copywriter', displayName: '✍️ Copywriter', role: '文案策划', status: 'idle', isBuddy: false, team: 'content', tasksCompleted: 234 },
    { id: 'designer', name: 'Designer', displayName: '🎨 Designer', role: '品牌设计师', status: 'active', isBuddy: false, team: 'business', tasksCompleted: 67 },
    { id: 'visual-designer', name: 'Visual Designer', displayName: '🖼️ Visual Designer', role: 'AI视觉设计师', status: 'active', isBuddy: false, team: 'content', tasksCompleted: 47, specialty: 'ai-image-generation' },
    { id: 'buddy', name: 'Buddy', displayName: '🐙 Buddy', role: 'AI伙伴', status: 'active', isBuddy: true, team: 'special', level: 5, xp: 1250, nextLevelXp: 2000, tasksCompleted: 999 }
  ],
  tasks: [
    { id: 1, name: '生成小红书内容', team: 'content-factory', assignee: 'Copywriter', status: 'completed', progress: 100, priority: 'normal' },
    { id: 2, name: '市场趋势分析', team: 'trend-analysis', assignee: 'Researcher', status: 'running', progress: 65, priority: 'high' },
    { id: 3, name: '邮件发送任务', team: 'email-system', assignee: 'Orchestrator', status: 'pending', progress: 0, priority: 'normal' },
    { id: 4, name: 'AI生成火锅图片', team: 'image-generation', assignee: 'Visual Designer', status: 'completed', progress: 100, priority: 'normal', type: 'image-generation', cost: 0.04 }
  ],
  features: {
    imageGeneration: {
      enabled: true,
      provider: 'openai-dalle3',
      totalGenerated: 47,
      totalCost: 1.88,
      avgCost: 0.04,
      todayGenerated: 4,
      todayCost: 0.16,
      templates: ['restaurant-food', 'nail-art', 'beauty-service', 'product-showcase']
    }
  },
  memory: {
    indexCount: 1,
    topicCount: 12,
    logCount: 30,
    latestInsights: [
      { theme: 'AI趋势', insight: '智能点餐系统ROI提升23%', confidence: 0.92 },
      { theme: '文生图', insight: 'AI图片生成成本降低60%', confidence: 0.88 }
    ]
  },
  logs: [
    { time: '10:30:45', level: 'info', message: 'KAIROS tick completed' },
    { time: '10:25:12', level: 'success', message: 'Task completed' },
    { time: '10:15:33', level: 'success', message: 'AI image generated: hotpot.jpg ($0.04)' }
  ]
});

const server = http.createServer((req, res) => {
  setCORS(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);
  console.log(`${new Date().toISOString()} - ${req.method} ${url.pathname}`);

  if (url.pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
  } else if (url.pathname === '/api/dashboard') {
    res.writeHead(200);
    res.end(JSON.stringify(generateDashboardData()));
  } else if (url.pathname === '/api/image-generation' && req.method === 'POST') {
    // AI Image Generation Endpoint
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const { prompt, platform, style } = JSON.parse(body);
        // Simulate image generation
        const imageUrl = `https://oaidalleapiprodscus.blob.core.windows.net/private/org-${Date.now()}/img-${Date.now()}.png`;
        res.writeHead(200);
        res.end(JSON.stringify({
          success: true,
          url: imageUrl,
          prompt: prompt,
          platform: platform || 'instagram',
          style: style || 'modern',
          cost: 0.04,
          timestamp: new Date().toISOString()
        }));
      } catch (error) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid request', message: error.message }));
      }
    });
  } else if (url.pathname === '/api/image-generation/stats') {
    res.writeHead(200);
    res.end(JSON.stringify({
      totalGenerated: 47,
      totalCost: 1.88,
      avgCost: 0.04,
      todayGenerated: 4,
      todayCost: 0.16,
      templates: ['restaurant-food', 'nail-art', 'beauty-service', 'product-showcase'],
      provider: 'openai-dalle3'
    }));
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

server.listen(PORT, () => {
  console.log(`🚀 API Server running on port ${PORT}`);
});
