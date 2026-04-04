/**
 * Amplifies AI - Sales Development Representative Agent
 * 销售开发代表 - 自动化销售线索获取和初步接触
 */

class SalesDevelopmentAgent {
  constructor(config = {}) {
    this.config = {
      name: 'Sales Development Rep',
      email: config.email || 'sales@amplifies.ai',
      linkedinTemplate: config.linkedinTemplate || 'default',
      ...config
    };
    
    this.metrics = {
      emailsSent: 0,
      linkedinMessages: 0,
      responses: 0,
      meetingsBooked: 0
    };
  }

  /**
   * 生成个性化冷邮件
   */
  async generateColdEmail(lead) {
    const templates = {
      restaurant: `
        Subject: Help {{name}} attract more customers with AI
        
        Hi {{name}},
        
        I noticed {{restaurantName}} has great reviews on Yelp. 
        
        Quick question: Are you using AI to automate your social media marketing?
        
        We help restaurants like yours:
        • Generate professional food photos with AI ($0.04 vs $50/hour designer)
        • Auto-post to Instagram/TikTok 7x24
        • Monitor competitors' pricing and promotions
        
        Result: 340% Instagram growth in 3 months (Kimura Hot Pot case)
        
        Worth a 15-min chat this week?
        
        Best,
        {{senderName}}
        Amplifies AI
      `,
      nailSalon: `
        Subject: {{name}}, grow your nail salon with AI-generated content
        
        Hi {{name}},
        
        Love your nail art designs at {{salonName}}!
        
        Question: How do you create content for social media?
        
        Our AI can:
        • Generate stunning nail art showcase images
        • Post automatically to Instagram/TikTok
        • Track what competitors are doing
        
        One client got 200% more bookings in 2 months.
        
        Open to a quick call?
        
        {{senderName}}
      `
    };

    const template = templates[lead.industry] || templates.restaurant;
    
    return template
      .replace(/{{name}}/g, lead.name)
      .replace(/{{restaurantName}}/g, lead.businessName)
      .replace(/{{salonName}}/g, lead.businessName)
      .replace(/{{senderName}}/g, this.config.name);
  }

  /**
   * 批量生成销售线索列表
   */
  async generateLeadList(criteria) {
    const { industry, location, count = 10 } = criteria;
    
    // 模拟从数据源获取线索
    const leads = [];
    
    if (industry === 'restaurant') {
      for (let i = 0; i < count; i++) {
        leads.push({
          id: `lead-${Date.now()}-${i}`,
          name: `Owner ${i + 1}`,
          businessName: `${location} Restaurant ${i + 1}`,
          industry: 'restaurant',
          location: location,
          email: `owner${i + 1}@restaurant.com`,
          source: 'yelp-scraper',
          score: Math.floor(Math.random() * 100)
        });
      }
    }
    
    return leads;
  }

  /**
   * 自动化外联活动
   */
  async runOutreachCampaign(campaign) {
    console.log(`🚀 启动销售活动: ${campaign.name}`);
    
    const leads = await this.generateLeadList(campaign.criteria);
    const results = [];
    
    for (const lead of leads) {
      // 生成个性化邮件
      const email = await this.generateColdEmail(lead);
      
      // 模拟发送（实际集成邮件服务）
      console.log(`📧 发送邮件给: ${lead.email}`);
      this.metrics.emailsSent++;
      
      results.push({
        lead: lead,
        email: email,
        sent: true,
        timestamp: new Date().toISOString()
      });
      
      // 避免速率限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return {
      campaign: campaign.name,
      leadsContacted: results.length,
      metrics: this.metrics
    };
  }

  /**
   * 获取销售指标
   */
  getMetrics() {
    return {
      ...this.metrics,
      conversionRate: this.metrics.meetingsBooked / (this.metrics.emailsSent || 1)
    };
  }
}

module.exports = SalesDevelopmentAgent;
