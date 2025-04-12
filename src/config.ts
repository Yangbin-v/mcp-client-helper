import {readFile} from 'fs/promises';
import {homedir} from 'os';
import {join} from 'path';
import {MCPConfig} from './types';

export class ConfigLoader {
    private static readonly DEFAULT_CONFIG_PATH = join(homedir(), '.cursor', 'mcp.json');

    public static async loadConfig(configPath?: string): Promise<MCPConfig> {
        const path = configPath || this.DEFAULT_CONFIG_PATH;
        try {
            const configContent = await readFile(path, 'utf-8');
            return JSON.parse(configContent) as MCPConfig;
        } catch (error) {
            throw new Error(`无法加载MCP配置文件: ${error instanceof Error ? error.message : String(error)}`);
        }
    }

    public static validateConfig(config: MCPConfig): void {
        if (!config.mcpServers || typeof config.mcpServers !== 'object') {
            throw new Error('无效的配置文件格式：缺少 mcpServers 对象');
        }

        for (const [name, server] of Object.entries(config.mcpServers)) {
            if (!server.command) {
                throw new Error(`服务器 "${name}" 配置无效：缺少 command 字段`);
            }
            if (!Array.isArray(server.args)) {
                throw new Error(`服务器 "${name}" 配置无效：args 必须是数组`);
            }
        }
    }
}
