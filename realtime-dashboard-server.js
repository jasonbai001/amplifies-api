/**
 * Amplifies AI - Real-time Dashboard API
 * 实时仪表板API - 提供系统实时数据
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3456;

// 模拟实时数据存储
const systemState = {
  startTime: Date.now(),
  agents: {},
  tasks: [],
  metrics: {
    totalRequests: 0,
    totalErrors: 0,
    avgResponseTime: 0
  }
};

// 初始化Agent状态
function initializeAgents() {
  const agentList = [
    { id: 'orchestrator', name: 'Orchestrator', team: 'business', icon: '🎭' },
    { id: 'researcher', name: 'Researcher', team: 'business', icon: '🔍' },
    { id: 'copywriter', name: 'Copywriter', team: 'content', icon: '✍️' },
    { id: 'designer', name: 'Designer', team: 'business', icon: '🎨' },
    { id: 'visual-designer', name: 'Visual Designer', team: 'content', icon: '🖼️' },
    { id: 'sales', name: 'Sales Dev', team: 'sales', icon: '💼' },
    { id: 'seo', name: 'SEO Specialist', team: 'content', icon: '🔍' },
    { id: 'data', name: 'Data Analyst', team: 'business', icon: '📊' },
    { id: 'customer-success', name: 'Customer Success', team: 'business', icon: '💬' },
    { id: 'creative', name: 'Creative Director', team: 'business', icon: '🎨' },
    { id: 'social-media', name: 'Social Media', team: 'content', icon: '📱' },
    { id: 'security', name: 'Security', team: 'business', icon: '🔒' },
    { id: 'proactive', name: 'Proactive Assistant', team: 'core', icon: '🎯' },
    { id: 'memory', name: 'Memory System', team: 'core', icon: '🧠' },
    { id: 'a2a', name: 'A2A Protocol', team: 'core', icon: '🤝' },
    { id: 'factory', name: 'Agent Factory', team: 'tools', icon: '🏭' },
    { id: 'composer', name: 'Feature Composer', team: 'tools', icon: '🧩' },
    { id: 'pipeline', name: 'Parallel Pipeline', team: 'tools', icon: '⚡' }
  ];
  
  agentList.forEach(agent => {
    systemState.agents[agent.id] = {
      ...agent,
      status: 'active',
      tasksCompleted: Math.floor(Math.random() * 500) + 50,
      lastActive: Date.now(),
      cpu: Math.random() * 30 + 10,
      memory: Math.random() * 100 + 50
    };
  });
}

// 生成实时数据
function generateRealtimeData() {
  const now = Date.now();
  const uptime = now - systemState.startTime;
  
  // 更新Agent状态（模拟实时变化）
  Object.values(systemState.agents).forEach(agent => {
    // 随机切换状态
    if (Math.random() > 0.95) {
      agent.status = agent.status === 'active' ? 'busy' : 'active';
    }
    // 增加完成任务数
    if (Math.random() > 0.7) {
      agent.tasksCompleted += Math.floor(Math.random() * 3);
    }
    // 更新资源使用
    agent.cpu = Math.min(100, Math.max(5, agent.cpu + (Math.random() - 0.5) * 10));
    agent.memory = Math.min(500, Math.max(50, agent.memory + (Math.random() - 0.5) * 20));
    agent.lastActive = now;
  });
  
  // 生成实时任务
  const tasks = [
    { id: 1, name: '生成小红书内容', agent: 'copywriter', status: 'running', progress: Math.floor(Math.random() * 100) },
    { id: 2, name: '市场趋势分析', agent: 'researcher', status: 'running', progress: Math.floor(Math.random() * 100) },
    { id: 3, name: 'SEO优化', agent: 'seo', status: 'completed', progress: 100 },
    { id: 4, name: 'AI图片生成', agent: 'visual-designer', status: 'running', progress: Math.floor(Math.random() * 100) },
    { id: 5, name: '客户健康检查', agent: 'customer-success', status: 'pending', progress: 0 }
  ];
  
  return {
    timestamp: new Date().toISOString(),
    uptime: Math.floor(uptime / 1000),
    system: {
      status: 'online',
      version: 'v2.3-hybrid',
      totalAgents: 26,
      activeAgents: Object.values(systemState.agents).filter(a => a.status === 'active').length,
      busyAgents: Object.values(systemState.agents).filter(a => a.status === 'busy').length
    },
    agents: systemState.agents,
    tasks: tasks,
    metrics: {
      totalTasksCompleted: Object.values(systemState.agents).reduce((sum, a) => sum + a.tasksCompleted, 0),
      imagesGenerated: 47 + Math.floor((now - systemState.startTime) / 3600000),
      totalCost: 1.88 + (now - systemState.startTime) / 3600000 * 0.04,
      avgResponseTime: Math.floor(Math.random() * 100 + 50),
      requestsPerMinute: Math.floor(Math.random() * 50 + 20)
    },
    performance: {
      cpu: Object.values(systemState.agents).reduce((sum, a) => sum + a.cpu, 0) / Object.keys(systemState.agents).length,
      memory: Object.values(systemState.agents).reduce((sum, a) => sum + a.memory, 0),
      throughput: Math.floor(Math.random() * 100 + 80)
    }
  };
}

// CORS设置
function setCORS(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// 静态文件服务
function serveStaticFile(res, filePath, contentType) {
  try {
    const content = fs.readFileSync(filePath);
    res.setHeader('Content-Type', contentType);
    res.writeHead(200);
    res.end(content);
  } catch (e) {
    res.writeHead(404);
    res.end('Not found');
  }
}

// 创建服务器
const server = http.createServer((req, res) => {
  setCORS(res);
  
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  const url = new URL(req.url, `http://localhost:${PORT}`);
  
  console.log(`${new Date().toISOString()} - ${req.method} ${url.pathname}`);
  
  // API端点
  if (url.pathname === '/api/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - systemState.startTime) / 1000)
    }));
    
  } else if (url.pathname === '/api/realtime') {
    // 实时数据端点
    const data = generateRealtimeData();
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(data));
    
  } else if (url.pathname === '/api/agents') {
    // Agent列表
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      agents: Object.values(systemState.agents),
      total: Object.keys(systemState.agents).length,
      active: Object.values(systemState.agents).filter(a => a.status === 'active').length
    }));
    
  } else if (url.pathname === '/api/metrics') {
    // 系统指标
    const data = generateRealtimeData();
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify(data.metrics));
    
  } else if (url.pathname === '/' || url.pathname === '/index.html') {
    // 主页面
    serveStaticFile(res, path.join(__dirname, 'dashboard', 'index.html'), 'text/html');
    
  } else if (url.pathname.startsWith('/assets/')) {
    // 静态资源
    const ext = path.extname(url.pathname);
    const contentType = {
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.png': 'image/png',
      '.jpg': 'image/jpeg'
    }[ext] || 'application/octet-stream';
    
    serveStaticFile(res, path.join(__dirname, 'dashboard', url.pathname), contentType);
    
  } else {
    res.writeHead(404);
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// 初始化
initializeAgents();

// 启动服务器
server.listen(PORT, () => {
  console.log(`🚀 Real-time Dashboard API running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Real-time data: http://localhost:${PORT}/api/realtime`);
  console.log(`🌐 Dashboard: http://localhost:${PORT}/`);
});

module.exports = server;
