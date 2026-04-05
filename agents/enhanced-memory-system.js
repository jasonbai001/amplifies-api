/**
 * Amplifies AI - Enhanced Memory System
 * 增强记忆系统 - 学习Claude Code的记忆架构
 * 
 * 三层记忆架构：
 * 1. 工作记忆 (Working Memory) - 短期，当前会话
 * 2. 情节记忆 (Episodic Memory) - 中期，具体事件
 * 3. 语义记忆 (Semantic Memory) - 长期，抽象知识
 * 
 * 自动整理策略：
 * - 实时：重要信息立即存储
 * - 每小时：轻量整理（去重、关联）
 * - 每日03:00：深度整理（"做梦"模式）
 * - 发现矛盾：主动澄清和合并
 */

class EnhancedMemorySystem {
  constructor(config = {}) {
    this.config = {
      workingMemoryLimit: 10, // 保持最近10条
      consolidationThreshold: 0.7, // 重要度阈值
      ...config
    };
    
    // 三层记忆存储
    this.memory = {
      working: [], // 工作记忆
      episodic: [], // 情节记忆
      semantic: {} // 语义记忆（知识图谱）
    };
    
    this.metrics = {
      itemsStored: 0,
      consolidations: 0,
      contradictionsFound: 0,
      insightsGenerated: 0
    };
  }

  /**
   * 存储记忆（智能路由到合适的层级）
   */
  async store(item) {
    // 评估重要性和类型
    const assessment = this.assessItem(item);
    
    if (assessment.importance > 0.9) {
      // 高重要性 -> 立即存入情节记忆
      await this.storeEpisodic(item, assessment);
    } else if (assessment.importance > 0.7) {
      // 中等重要性 -> 工作记忆，稍后整理
      this.storeWorking(item);
    } else {
      // 低重要性 -> 工作记忆，可能丢弃
      this.storeWorking(item, { temporary: true });
    }
    
    // 实时提取知识
    if (assessment.hasKnowledge) {
      await this.extractKnowledge(item);
    }
    
    this.metrics.itemsStored++;
    return assessment;
  }

  /**
   * 评估记忆项
   */
  assessItem(item) {
    const factors = {
      // 重要性指标
      importance: 0.5,
      
      // 是否是决策/行动
      isAction: /decided|action|task|plan/i.test(item.content) ? 0.2 : 0,
      
      // 是否包含关键信息
      hasKeyInfo: /api key|password|config|setting/i.test(item.content) ? 0.15 : 0,
      
      // 是否是错误/教训
      isLesson: /error|failed|lesson|learned/i.test(item.content) ? 0.1 : 0,
      
      // 用户强调
      userEmphasis: item.userEmphasis ? 0.1 : 0,
      
      // 时间敏感性
      timeSensitive: item.timeSensitive ? 0.05 : 0
    };
    
    const importance = Object.values(factors).reduce((a, b) => a + b, 0);
    
    return {
      importance: Math.min(importance, 1),
      hasKnowledge: factors.isLesson > 0 || factors.isAction > 0,
      shouldConsolidate: importance > this.config.consolidationThreshold
    };
  }

  /**
   * 工作记忆存储
   */
  storeWorking(item, options = {}) {
    this.memory.working.push({
      ...item,
      storedAt: Date.now(),
      temporary: options.temporary || false
    });
    
    // 保持工作记忆容量限制
    if (this.memory.working.length > this.config.workingMemoryLimit) {
      const removed = this.memory.working.shift();
      // 如果不是临时的，考虑升级到情节记忆
      if (!removed.temporary && this.assessItem(removed).importance > 0.6) {
        this.storeEpisodic(removed);
      }
    }
  }

  /**
   * 情节记忆存储（具体事件）
   */
  async storeEpisodic(item, assessment) {
    // 查找相似事件（避免重复）
    const similar = this.findSimilarEpisodes(item);
    
    if (similar.length > 0) {
      // 合并相似事件
      await this.mergeEpisodes(similar[0], item);
    } else {
      this.memory.episodic.push({
        ...item,
        storedAt: Date.now(),
        type: 'episode',
        related: []
      });
    }
  }

  /**
   * 提取语义知识（抽象概念）
   */
  async extractKnowledge(item) {
    // 从具体事件中提取抽象知识
    const knowledge = this.parseKnowledge(item);
    
    if (knowledge) {
      const key = knowledge.concept;
      
      if (!this.memory.semantic[key]) {
        // 新知识
        this.memory.semantic[key] = {
          concept: key,
          definition: knowledge.definition,
          examples: [knowledge.example],
          related: knowledge.related || [],
          confidence: knowledge.confidence,
          updatedAt: Date.now()
        };
      } else {
        // 更新现有知识
        const existing = this.memory.semantic[key];
        existing.examples.push(knowledge.example);
        existing.confidence = Math.min(existing.confidence + 0.1, 1);
        existing.updatedAt = Date.now();
        
        // 检查矛盾
        const contradiction = this.checkContradiction(existing, knowledge);
        if (contradiction) {
          await this.resolveContradiction(existing, knowledge, contradiction);
        }
      }
    }
  }

  /**
   * 深度整理（"做梦"模式）
   */
  async deepConsolidation() {
    console.log('🧠 开始深度记忆整理（"做梦"模式）...');
    
    const startTime = Date.now();
    
    // 1. 整理工作记忆 -> 情节记忆
    await this.consolidateWorkingMemory();
    
    // 2. 整理情节记忆 -> 语义记忆
    await this.consolidateEpisodicMemory();
    
    // 3. 发现模式和洞察
    const insights = await this.discoverPatterns();
    
    // 4. 生成知识图谱连接
    await this.enrichKnowledgeGraph();
    
    // 5. 清理过期记忆
    await this.cleanupOldMemories();
    
    const duration = Date.now() - startTime;
    
    console.log(`✅ 深度整理完成 (${duration}ms)`);
    console.log(`  - 生成洞察: ${insights.length}`);
    console.log(`  - 知识节点: ${Object.keys(this.memory.semantic).length}`);
    
    this.metrics.consolidations++;
    this.metrics.insightsGenerated += insights.length;
    
    return {
      duration: duration,
      insights: insights,
      memoryStats: this.getMemoryStats()
    };
  }

  /**
   * 整理工作记忆
   */
  async consolidateWorkingMemory() {
    const important = this.memory.working.filter(
      item => this.assessItem(item).shouldConsolidate
    );
    
    for (const item of important) {
      await this.storeEpisodic(item);
    }
    
    // 清空已整理的工作记忆
    this.memory.working = this.memory.working.filter(
      item => !important.includes(item)
    );
  }

  /**
   * 整理情节记忆
   */
  async consolidateEpisodicMemory() {
    // 按主题分组
    const groups = this.groupByTheme(this.memory.episodic);
    
    for (const [theme, episodes] of Object.entries(groups)) {
      if (episodes.length >= 3) {
        // 足够多的事件 -> 提取模式
        const pattern = this.extractPattern(episodes);
        
        // 存储为语义知识
        await this.storeSemantic({
          concept: theme,
          pattern: pattern,
          examples: episodes.map(e => e.content)
        });
      }
    }
  }

  /**
   * 发现模式
   */
  async discoverPatterns() {
    const insights = [];
    
    // 1. 时间模式
    const timePatterns = this.analyzeTimePatterns();
    if (timePatterns.length > 0) {
      insights.push(...timePatterns);
    }
    
    // 2. 行为模式
    const behaviorPatterns = this.analyzeBehaviorPatterns();
    if (behaviorPatterns.length > 0) {
      insights.push(...behaviorPatterns);
    }
    
    // 3. 知识关联
    const knowledgeConnections = this.findKnowledgeConnections();
    if (knowledgeConnections.length > 0) {
      insights.push(...knowledgeConnections);
    }
    
    return insights;
  }

  /**
   * 检查矛盾
   */
  checkContradiction(existing, newKnowledge) {
    // 简单的矛盾检测
    if (existing.definition !== newKnowledge.definition) {
      return {
        type: 'definition_mismatch',
        existing: existing.definition,
        new: newKnowledge.definition
      };
    }
    return null;
  }

  /**
   * 解决矛盾
   */
  async resolveContradiction(existing, newKnowledge, contradiction) {
    console.log(`⚠️  发现矛盾: ${existing.concept}`);
    this.metrics.contradictionsFound++;
    
    // 策略：保留置信度更高的，或合并
    if (newKnowledge.confidence > existing.confidence) {
      existing.definition = newKnowledge.definition;
      existing.confidence = newKnowledge.confidence;
      existing.resolvedAt = Date.now();
    }
    
    // 记录矛盾历史
    existing.contradictions = existing.contradictions || [];
    existing.contradictions.push({
      timestamp: Date.now(),
      type: contradiction.type,
      resolved: true
    });
  }

  // 辅助方法
  findSimilarEpisodes(item) {
    return this.memory.episodic.filter(e => 
      e.content.includes(item.content.substring(0, 20))
    );
  }

  async mergeEpisodes(existing, newItem) {
    existing.related.push(newItem);
    existing.updatedAt = Date.now();
  }

  parseKnowledge(item) {
    // 简化实现
    return null;
  }

  groupByTheme(episodes) {
    return {};
  }

  extractPattern(episodes) {
    return 'pattern';
  }

  async storeSemantic(knowledge) {
    this.memory.semantic[knowledge.concept] = knowledge;
  }

  analyzeTimePatterns() {
    return [];
  }

  analyzeBehaviorPatterns() {
    return [];
  }

  findKnowledgeConnections() {
    return [];
  }

  async enrichKnowledgeGraph() {
    return;
  }

  async cleanupOldMemories() {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000; // 30天
    this.memory.episodic = this.memory.episodic.filter(
      e => e.storedAt > cutoff || e.importance > 0.8
    );
  }

  getMemoryStats() {
    return {
      working: this.memory.working.length,
      episodic: this.memory.episodic.length,
      semantic: Object.keys(this.memory.semantic).length
    };
  }

  getMetrics() {
    return this.metrics;
  }
}

module.exports = EnhancedMemorySystem;
