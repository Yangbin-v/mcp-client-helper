import {MCPServerManager} from './MCPServerManager';
import {readFileSync} from 'fs';
import {MCPConfig} from './types';

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

        // 动态更新配置示例
        const newConfig: MCPConfig = {
            mcpServers: {
                github: {
                    command: "npx",
                    args: ["-y", "@modelcontextprotocol/server-github"],
                    env: {
                        GITHUB_PERSONAL_ACCESS_TOKEN: "your-new-token-here"
                    }
                }
            }
        };
        manager.updateConfig(newConfig);
    } catch (error) {
        console.error('错误:', error);
    }
}

main().catch(console.error);
