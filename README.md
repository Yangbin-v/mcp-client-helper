# mcp-client-helper

MCP Server管理工具库 - 用于通过配置文件管理和控制多个MCP服务器实例

## 功能特性

- 通过配置管理多个MCP服务器
- 支持启动、停止和重启服务器
- 实时监控所有服务器状态
- 事件驱动的日志和错误处理
- 支持自定义环境变量配置

## 安装

```bash
npm install mcp-client-helper
```

## 配置格式

配置对象格式示例：
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your-token-here"
      }
    },
    "other-server": {
      "command": "your-command",
      "args": ["arg1", "arg2"],
      "env": {
        "KEY": "value"
      }
    }
  }
}
```

## 使用示例

```typescript
import { MCPServerManager } from 'mcp-client-helper';
import { readFileSync } from 'fs';

async function main() {
  // 从配置文件加载配置
  const config = JSON.parse(readFileSync('path/to/your/config.json', 'utf-8'));
  
  // 创建服务器管理器实例
  const manager = new MCPServerManager(config);

  try {
    // 获取所有配置的服务器名称
    const serverNames = manager.getServerNames();
    console.log('可用的服务器:', serverNames);

    // 监听特定服务器的事件
    manager.on('log', (serverName, log) => {
      console.log(`[${serverName}] 日志:`, log);
    });

    manager.on('error', (serverName, error) => {
      console.error(`[${serverName}] 错误:`, error);
    });

    manager.on('exit', (serverName, code) => {
      console.log(`[${serverName}] 服务器退出，退出码:`, code);
    });

    // 启动指定的服务器
    await manager.start('github');

    // 获取服务器状态
    const status = manager.getStatus('github');
    console.log('服务器状态:', status);

    // 重启服务器
    await manager.restart('github');

    // 停止服务器
    await manager.stop('github');

    // 动态更新配置
    manager.updateConfig(newConfig);
  } catch (error) {
    console.error('错误:', error);
  }
}

main().catch(console.error);
```

## API文档

### MCPServerManager

#### 构造函数

```typescript
constructor(config: MCPConfig)
```

配置参数：
- `config`: MCP服务器配置对象，包含所有要管理的服务器配置

#### 方法

- `start(serverName: string): Promise<void>`: 启动指定的服务器
- `stop(serverName: string): Promise<void>`: 停止指定的服务器
- `restart(serverName: string): Promise<void>`: 重启指定的服务器
- `getStatus(serverName: string): ServerStatus | undefined`: 获取指定服务器的状态
- `getAllStatuses(): Record<string, ServerStatus>`: 获取所有服务器的状态
- `getServerNames(): string[]`: 获取所有配置的服务器名称
- `updateConfig(config: MCPConfig): void`: 动态更新服务器配置

#### 事件

- `log`: `(serverName: string, log: string) => void` - 服务器日志输出
- `error`: `(serverName: string, error: string) => void` - 服务器错误输出
- `exit`: `(serverName: string, code: number | null) => void` - 服务器退出事件

### 配置类型定义

```typescript
interface MCPServerConfig {
  command: string;      // 服务器启动命令
  args: string[];       // 命令行参数
  env?: Record<string, string>;  // 环境变量
}

interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;  // 服务器配置映射
}

interface ServerStatus {
  isRunning: boolean;   // 是否正在运行
  pid?: number;         // 进程ID
  startTime?: Date;     // 启动时间
  name: string;         // 服务器名称
  command: string;      // 启动命令
}
```

## 开发要求

- Node.js >= 14.0.0
- TypeScript >= 4.0.0

## 许可证

ISC
