#!/usr/bin/env python3
"""
Amplifies Federation Bridge
Jarvis ↔ Amplifies 双向命令桥

用法:
  # 创建任务
  python3 amplifies-bridge.py task "生成川山甲本周小红书内容" --brand "川山甲" --type content-writing

  # 查询状态
  python3 amplifies-bridge.py status

  # 触发日报
  python3 amplifies-bridge.py daily

  # 同步到工作台
  python3 amplifies-bridge.py sync
"""

import json, sys, os, urllib.request, urllib.error

AMPLIFIES_URL = os.environ.get("AMPLIFIES_URL", "https://amplifies-api.onrender.com")
AMPLIFIES_KEY = os.environ.get("AMPLIFIES_KEY", "")

def api(path, method="GET", data=None):
    url = f"{AMPLIFIES_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if AMPLIFIES_KEY:
        headers["Authorization"] = f"Bearer {AMPLIFIES_KEY}"
    
    body = json.dumps(data).encode() if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"error": f"HTTP {e.code}", "body": e.read().decode()[:200]}
    except Exception as e:
        return {"error": str(e)}

def cmd_create_task(args):
    if len(args) < 1:
        print("用法: task <name> [--brand BRAND] [--type TYPE] [--execute]")
        return
    
    name = args[0]
    brand = None
    task_type = "general"
    execute = False
    
    i = 1
    while i < len(args):
        if args[i] == "--brand" and i+1 < len(args):
            brand = args[i+1]; i += 2
        elif args[i] == "--type" and i+1 < len(args):
            task_type = args[i+1]; i += 2
        elif args[i] == "--execute":
            execute = True; i += 1
        else:
            i += 1
    
    result = api("/api/tasks", "POST", {
        "name": name, "type": task_type, "brand": brand, "execute": execute
    })
    print(json.dumps(result, indent=2, ensure_ascii=False))

def cmd_status():
    result = api("/api/dashboard")
    if "kpi" in result:
        k = result["kpi"]
        print(f"📊 Amplifies Status")
        print(f"  Agents: {k.get('totalAgents', '?')} | Today: {k.get('todayTasks', 0)} tasks")
        print(f"  Done: {k.get('completedTasks', 0)} | Images: {k.get('imagesGenerated', 0)} (${k.get('imagesCost', 0)})")
        print(f"  Performance: {k.get('performance', '?')}")
        if "agents" in result:
            print(f"\n  Agents:")
            for a in result["agents"]:
                print(f"    {a['displayName']}: {a['status']} ({a.get('tasksCompleted', 0)} done)")
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))

def cmd_daily():
    result = api("/api/federation", "POST", {
        "command": "run_daily"
    })
    print(json.dumps(result, indent=2, ensure_ascii=False))

def cmd_sync():
    result = api("/api/workbench/sync", "POST", {})
    print(json.dumps(result, indent=2, ensure_ascii=False))

def cmd_list_agents():
    result = api("/api/agents")
    if "agents" in result:
        print(f"{result['count']} agents:")
        for a in result["agents"]:
            print(f"  {a['displayName']} ({a['id']}) — {a['role']} [{a['status']}]")
            print(f"    Caps: {', '.join(a.get('capabilities', []))}")
            if a.get('metrics'):
                m = a['metrics']
                for mk, mv in m.items():
                    if mv and isinstance(mv, (int, float)):
                        print(f"    {mk}: {mv}")
    else:
        print(json.dumps(result, indent=2, ensure_ascii=False))

def main():
    if len(sys.argv) < 2:
        print("Amplifies Federation Bridge")
        print("Commands: task, status, daily, sync, agents, help")
        return
    
    cmd = sys.argv[1]
    args = sys.argv[2:]
    
    commands = {
        "task": cmd_create_task,
        "status": cmd_status,
        "daily": cmd_daily,
        "sync": cmd_sync,
        "agents": cmd_list_agents,
    }
    
    if cmd in commands:
        commands[cmd](args)
    else:
        print(f"Unknown command: {cmd}")
        print(f"Available: {', '.join(commands.keys())}")

if __name__ == "__main__":
    main()
