/**
 * Amplifies AI - Advanced Agent Collaboration Protocol
 * 高级Agent协作协议 - A2A (Agent-to-Agent)
 * 
 * 核心能力：
 * 1. Agent自动发现和能力注册
 * 2. 智能任务路由（能力匹配）
 * 3. 并行执行和结果合并
 * 4. 失败自愈（重试+降级）
 * 5. 流式响应和实时协作
 */

class A2ACollaborationProtocol {
  constructor() {
    this.agents = new Map(); // 注册的Agent
    this.capabilities = new Map(); // 能力索引
    this.taskQueue = []; // 任务队列
    this.activeTasks = new Map(); // 正在执行的任务
    
    this.metrics = {
      tasksRouted: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      avgRoutingTime: 0,
      collaborationCount: 0
    };
  }

  /**
   * Agent注册（自描述能力）
   */
  registerAgent(agent) {
    console.log(`📝 Agent注册: ${agent.name}`);
    
    // Agent自描述
    const agentProfile = {
      id: agent.id,
      name: agent.name,
      capabilities: agent.capabilities || [],
      specialties: agent.specialties || [],
      status: 'idle', // idle, busy, offline
      performance: {
        successRate: 1.0,
        avgResponseTime: 0,
        tasksCompleted: 0
      },
      instance: agent
    };
    
    this.agents.set(agent.id, agentProfile);
    
    // 索引能力
    for (const capability of agentProfile.capabilities) {
      if (!this.capabilities.has(capability)) {
        this.capabilities.set(capability, []);
      }
      this.capabilities.get(capability).push(agent.id);
    }
    
    console.log(`  ✅ 已注册: ${agentProfile.capabilities.length} 个能力`);
    
    return agentProfile;
  }

  /**
   * 智能任务路由（核心）
   */
  async routeTask(task) {
    console.log(`🎯 路由任务: ${task.name}`);
    const startTime = Date.now();
    
    // 1. 分析任务需求
    const requirements = this.analyzeTaskRequirements(task);
    console.log(`  需求: ${requirements.capabilities.join(', ')}`);
    
    // 2. 匹配Agent
    const candidates = this.findCapableAgents(requirements);
    console.log(`  候选Agent: ${candidates.length} 个`);
    
    if (candidates.length === 0) {
      throw new Error(`No agent available for task: ${task.name}`);
    }
    
    // 3. 选择最佳Agent（负载均衡 + 性能评分）
    const selectedAgent = this.selectBestAgent(candidates, requirements);
    console.log(`  选择: ${selectedAgent.name}`);
    
    // 4. 路由任务
    const routedTask = {
      ...task,
      assignedTo: selectedAgent.id,
      routedAt: Date.now(),
      requirements: requirements
    };
    
    this.activeTasks.set(task.id, routedTask);
    
    // 更新指标
    const routingTime = Date.now() - startTime;
    this.metrics.tasksRouted++;
    this.updateAvgRoutingTime(routingTime);
    
    // 5. 执行（带监控）
    return await this.executeWithMonitoring(routedTask, selectedAgent);
  }

  /**
   * 多Agent协作（复杂任务）
   */
  async collaborate(task, collaborationPlan) {
    console.log(`🤝 多Agent协作: ${task.name}`);
    console.log(`  计划: ${collaborationPlan.agents.length} 个Agent`);
    
    const subtasks = collaborationPlan.subtasks;
    const results = new Map();
    const dependencies = new Map();
    
    // 构建依赖图
    for (const subtask of subtasks) {
      dependencies.set(subtask.id, subtask.dependsOn || []);
    }
    
    // 并行执行（拓扑排序）
    const executed = new Set();
    
    while (executed.size < subtasks.length) {
      // 找出可以执行的子任务（依赖已完成）
      const ready = subtasks.filter(st => 
        !executed.has(st.id) &&
        dependencies.get(st.id).every(dep => executed.has(dep))
      );
      
      if (ready.length === 0) {
        throw new Error('Circular dependency detected');
      }
      
      // 并行执行就绪的子任务
      const batchResults = await Promise.all(
        ready.map(async subtask => {
          const agent = this.agents.get(subtask.agentId);
          const result = await this.executeSubtask(subtask, agent);
          executed.add(subtask.id);
          return { id: subtask.id, result };
        })
      );
      
      // 存储结果
      for (const { id, result } of batchResults) {
        results.set(id, result);
      }
    }
    
    this.metrics.collaborationCount++;
    
    // 合并结果
    return await this.mergeResults(results, collaborationPlan.mergeStrategy);
  }

  /**
   * 失败自愈（重试+降级）
   */
  async executeWithResilience(task, agent, maxRetries = 3) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`  尝试 ${attempt}/${maxRetries}`);
        
        // 设置Agent状态
        agent.status = 'busy';
        
        // 执行任务
        const result = await this.executeTask(task, agent);
        
        // 更新性能指标
        agent.performance.tasksCompleted++;
        agent.performance.successRate = 
          (agent.performance.successRate * (agent.performance.tasksCompleted - 1) + 1) / 
          agent.performance.tasksCompleted;
        
        agent.status = 'idle';
        this.metrics.tasksCompleted++;
        
        return {
          success: true,
          result: result,
          agent: agent.name,
          attempts: attempt
        };
        
      } catch (error) {
        lastError = error;
        console.log(`  ❌ 失败: ${error.message}`);
        
        // 更新失败指标
        agent.performance.successRate = 
          (agent.performance.successRate * agent.performance.tasksCompleted) / 
          (agent.performance.tasksCompleted + 1);
        
        if (attempt < maxRetries) {
          // 指数退避
          const delay = Math.pow(2, attempt) * 1000;
          console.log(`  ⏳ 等待 ${delay}ms 后重试...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // 所有重试失败，尝试降级
    console.log(`  🔄 尝试降级策略...`);
    const fallbackResult = await this.executeFallback(task, agent);
    
    if (fallbackResult) {
      return {
        success: true,
        result: fallbackResult,
        agent: agent.name,
        fallback: true,
        attempts: maxRetries
      };
    }
    
    // 彻底失败
    agent.status = 'offline';
    this.metrics.tasksFailed++;
    
    throw new Error(`Task failed after ${maxRetries} attempts: ${lastError.message}`);
  }

  /**
   * 流式协作（实时响应）
   */
  async *streamCollaborate(task, agents) {
    console.log(`📡 流式协作: ${task.name}`);
    
    const streams = agents.map(agent => ({
      agent: agent,
      stream: this.createTaskStream(task, agent)
    }));
    
    // 合并多个流
    const mergedStream = this.mergeStreams(streams);
    
    for await (const chunk of mergedStream) {
      yield {
        agent: chunk.agentName,
        content: chunk.content,
        timestamp: Date.now(),
        progress: chunk.progress
      };
    }
  }

  /**
   * 动态Agent发现
   */
  async discoverAgents(capability) {
    console.log(`🔍 发现Agent: ${capability}`);
    
    const capableAgents = this.capabilities.get(capability) || [];
    
    const availableAgents = capableAgents
      .map(id => this.agents.get(id))
      .filter(agent => agent && agent.status === 'idle')
      .sort((a, b) => b.performance.successRate - a.performance.successRate);
    
    console.log(`  找到 ${availableAgents.length} 个可用Agent`);
    
    return availableAgents;
  }

  // 辅助方法
  analyzeTaskRequirements(task) {
    // 从任务描述中提取能力需求
    const capabilityMap = {
      'write': ['content-creation', 'copywriting'],
      'design': ['visual-design', 'creative'],
      'analyze': ['data-analysis', 'research'],
      'sell': ['sales', 'communication'],
      'code': ['programming', 'technical']
    };
    
    const capabilities = [];
    for (const [keyword, caps] of Object.entries(capabilityMap)) {
      if (task.name.toLowerCase().includes(keyword) || 
          task.description?.toLowerCase().includes(keyword)) {
        capabilities.push(...caps);
      }
    }
    
    return {
      capabilities: capabilities.length > 0 ? capabilities : ['general'],
      priority: task.priority || 'normal',
      deadline: task.deadline
    };
  }

  findCapableAgents(requirements) {
    const candidates = new Set();
    
    for (const capability of requirements.capabilities) {
      const agents = this.capabilities.get(capability) || [];
      for (const agentId of agents) {
        const agent = this.agents.get(agentId);
        if (agent && agent.status !== 'offline') {
          candidates.add(agent);
        }
      }
    }
    
    return Array.from(candidates);
  }

  selectBestAgent(candidates, requirements) {
    // 评分算法：成功率 * 负载因子
    return candidates
      .map(agent => ({
        agent: agent,
        score: agent.performance.successRate * 
               (1 - Math.min(agent.performance.tasksCompleted / 100, 0.5))
      }))
      .sort((a, b) => b.score - a.score)[0].agent;
  }

  async executeWithMonitoring(task, agent) {
    const startTime = Date.now();
    
    try {
      const result = await this.executeWithResilience(task, agent);
      
      // 更新响应时间
      const responseTime = Date.now() - startTime;
      agent.performance.avgResponseTime = 
        (agent.performance.avgResponseTime * (agent.performance.tasksCompleted - 1) + responseTime) /
        agent.performance.tasksCompleted;
      
      return result;
    } catch (error) {
      // 从活跃任务中移除
      this.activeTasks.delete(task.id);
      throw error;
    }
  }

  async executeTask(task, agent) {
    // 实际调用Agent实例
    if (agent.instance && agent.instance.execute) {
      return await agent.instance.execute(task);
    }
    return { status: 'completed', agent: agent.name };
  }

  async executeSubtask(subtask, agent) {
    return await this.executeTask(subtask, agent);
  }

  async mergeResults(results, strategy) {
    if (strategy === 'concatenate') {
      return Array.from(results.values()).join('\n');
    }
    return Object.fromEntries(results);
  }

  async executeFallback(task, failedAgent) {
    // 查找替代Agent
    const alternatives = Array.from(this.agents.values())
      .filter(a => a.id !== failedAgent.id && a.status === 'idle');
    
    if (alternatives.length > 0) {
      console.log(`  🔄 切换到替代Agent: ${alternatives[0].name}`);
      return await this.executeTask(task, alternatives[0]);
    }
    
    // 简化任务
    console.log(`  📝 简化任务后重试`);
    const simplifiedTask = { ...task, simplified: true };
    return await this.executeTask(simplifiedTask, failedAgent);
  }

  createTaskStream(task, agent) {
    // 模拟流式响应
    return {
      async *[Symbol.asyncIterator]() {
        for (let i = 0; i < 5; i++) {
          yield {
            agentName: agent.name,
            content: `Progress ${i * 20}%`,
            progress: i * 20
          };
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    };
  }

  async *mergeStreams(streams) {
    // 简化实现
    for (const { agent, stream } of streams) {
      for await (const chunk of stream) {
        yield chunk;
      }
    }
  }

  updateAvgRoutingTime(time) {
    this.metrics.avgRoutingTime = 
      (this.metrics.avgRoutingTime * (this.metrics.tasksRouted - 1) + time) /
      this.metrics.tasksRouted;
  }

  getMetrics() {
    return this.metrics;
  }

  getSystemStatus() {
    return {
      registeredAgents: this.agents.size,
      availableCapabilities: this.capabilities.size,
      activeTasks: this.activeTasks.size,
      queueLength: this.taskQueue.length,
      agentStatus: Array.from(this.agents.values()).map(a => ({
        name: a.name,
        status: a.status,
        successRate: a.performance.successRate
      }))
    };
  }
}

module.exports = A2ACollaborationProtocol;
