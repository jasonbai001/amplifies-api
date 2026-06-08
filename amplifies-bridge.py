#!/usr/bin/env python3
"""
Jarvis ↔ Amplifies Federation Bridge
双向命令桥——Jarvis 作为联邦指挥官，Amplifies 作为执行层

用法:
  # 查询状态
  python3 amplifies-bridge.py status
  
  # 创建内容任务
  python3 amplifies-bridge.py task "川山甲本周小红书" --brand 川山甲 --type social-media --execute
  
  # 触发市场分析
  python3 amplifies-bridge.py task "竞争对手分析" --brand 重庆老灶 --type market-research --execute
  
  # 生成图片
  python3 amplifies-bridge.py image "火锅沸腾特写" --brand 重庆老灶
  
  # 列出所有 Agent
  python3 amplifies-bridge.py agents
  
  # 运行日报
  python3 amplifies-bridge.py daily
"""

import json, sys, os, urllib.request, urllib.error, time

# Config
AMPLIFIES_URL = os.environ.get("AMPLIFIES_URL", "https://amplifies-api.onrender.com")

def api(path, method="GET", data=None):
    """Call Amplifies API"""
    url = f"{AMPLIFIES_URL}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode() if data else None
    
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()[:300]
        return {"error": f"HTTP {e.code}", "detail": body}
    except Exception as e:
        return {"error": str(e)}

def cmd_status():
    """Get Amplifies live status"""
    result = api("/api/dashboard")
    if "error" in result:
        print(f"❌ {result['error']} (V2 may still be deploying)")
        return
    
    k = result.get("kpi", {})
    print(f"📊 Amplifies 联邦节点")
    print(f"  Agents: {k.get('totalAgents', '?')} | 今日任务: {k.get('todayTasks', 0)}")
    print(f"  已完成: {k.get('completedTasks', 0)} | 图片: {k.get('imagesGenerated', 0)} (${k.get('imagesCost', 0)})")
    print(f"  效能: {k.get('performance', 'N/A')}")
    
    if "agents" in result:
        print(f"\n  Agent 方阵:")
        for a in result["agents"]:
            icon = "🟢" if a["status"] == "active" else "💤" if a["status"] == "idle" else "🔴"
            print(f"    {icon} {a['displayName']}: {a['status']} ({a.get('tasksCompleted', 0)})")
    
    if "tasks" in result and result["tasks"]:
        print(f"\n  最近任务:")
        for t in result["tasks"][-5:]:
            icon = "✅" if t["status"] == "completed" else "⏳" if t["status"] == "running" else "⬜"
            print(f"    {icon} {t['name']} → {t['assignee']}")


def cmd_create_task(args):
    """Create and optionally execute a task"""
    if len(args) < 1:
        print("用法: task <任务名> [--brand 品牌] [--type 类型] [--execute]")
        print("类型: market-research, content-writing, social-media, brand-design, image-generation, seo")
        return
    
    name = args[0]
    brand = None
    task_type = "general"
    execute = False
    platform = None
    
    i = 1
    while i < len(args):
        if args[i] == "--brand" and i+1 < len(args):
            brand = args[i+1]; i += 2
        elif args[i] == "--type" and i+1 < len(args):
            task_type = args[i+1]; i += 2
        elif args[i] == "--platform" and i+1 < len(args):
            platform = args[i+1]; i += 2
        elif args[i] == "--execute":
            execute = True; i += 1
        else:
            i += 1
    
    payload = {
        "name": name,
        "type": task_type,
        "brand": brand,
        "execute": execute
    }
    if platform:
        payload["platform"] = platform
    
    result = api("/api/tasks", "POST", payload)
    
    if "error" in result:
        print(f"❌ {result['error']} — V2 可能还在部署中")
        return
    
    t = result.get("task", {})
    print(f"📋 任务 #{t.get('id', '?')}: {name}")
    print(f"   分配给: {t.get('assignee', '?')} | 状态: {t.get('status', '?')}")
    if t.get("result"):
        print(f"   结果: {json.dumps(t['result'], ensure_ascii=False)[:200]}")

def cmd_image(args):
    """Generate an AI image"""
    if len(args) < 1:
        print("用法: image <描述> [--brand 品牌]")
        return
    
    prompt = " ".join(args[:3]) if len(args) > 1 else args[0]
    # Strip flags
    for flag in ["--brand"]:
        if flag in args:
            idx = args.index(flag)
            args.pop(idx)
            if idx < len(args):
                args.pop(idx)
    
    result = api("/api/image-generation/stats")
    stats = result if "error" not in result else {}
    
    print(f"🖼️  图片生成: {prompt}")
    print(f"   渠道: Amplifies (DALL-E 3)")
    print(f"   已生成: {stats.get('totalGenerated', '?')} 张 | 累计: ${stats.get('totalCost', '?')}")

def cmd_daily():
    """Run daily automation"""
    result = api("/api/federation", "POST", {"command": "run_daily"})
    if "error" in result:
        print(f"❌ {result.get('error')} ({result.get('detail', '')})")
    else:
        print(f"📅 日报已触发: {json.dumps(result, ensure_ascii=False)}")

def cmd_agents():
    """List all available agents"""
    result = api("/api/agents")
    if "error" in result:
        print(f"❌ {result['error']}")
        return
    
    agents = result.get("agents", [])
    print(f"🤖 {result.get('count', len(agents))} 个 Agent:")
    for a in agents:
        print(f"  {a['displayName']} ({a['id']})")
        print(f"    角色: {a['role']} | 状态: {a['status']}")
        if a.get("capabilities"):
            print(f"    能力: {', '.join(a['capabilities'][:5])}")

def main():
    if len(sys.argv) < 2:
        print("🔮 Jarvis → Amplifies 联邦桥")
        print("命令: status, task, image, daily, agents")
        return
    
    cmd = sys.argv[1]
    args = sys.argv[2:]
    
    commands = {
        "status": lambda: cmd_status(),
        "task": lambda: cmd_create_task(args),
        "image": lambda: cmd_image(args),
        "daily": lambda: cmd_daily(),
        "agents": lambda: cmd_agents(),
    }
    
    if cmd in commands:
        commands[cmd]()
    else:
        print(f"未知命令: {cmd}")
        print(f"可用: {', '.join(commands.keys())}")

if __name__ == "__main__":
    main()
