import {spawn, ChildProcess} from 'child_process';
import {EventEmitter} from 'events';
import {MCPServerConfig, ServerStatus, MCPConfig} from './types';

export class MCPServerManager extends EventEmitter {
    private processes: Map<string, ChildProcess> = new Map();
    private statuses: Map<string, ServerStatus> = new Map();
    private configs: Map<string, MCPServerConfig> = new Map();

    constructor(config: MCPConfig) {
        super();
        this.initializeConfig(config);
    }

    private initializeConfig(config: MCPConfig): void {
        if (!config.mcpServers || typeof config.mcpServers !== 'object') {
            throw new Error('无效的配置：缺少 mcpServers 对象');
        }

        // 清理现有的服务器
        for (const [name] of this.processes) {
            this.stop(name).catch(console.error);
        }

        this.processes.clear();
        this.statuses.clear();
        this.configs.clear();

        // 加载新配置
        for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
            if (!serverConfig.command) {
                throw new Error(`服务器 "${name}" 配置无效：缺少 command 字段`);
            }
            if (!Array.isArray(serverConfig.args)) {
                throw new Error(`服务器 "${name}" 配置无效：args 必须是数组`);
            }

            this.configs.set(name, serverConfig);
            this.statuses.set(name, {
                isRunning: false,
                name,
                command: serverConfig.command
            });
        }
    }

    public async start(serverName: string): Promise<void> {
        const config = this.configs.get(serverName);
        if (!config) {
            throw new Error(`未找到服务器 "${serverName}" 的配置`);
        }

        const status = this.statuses.get(serverName);
        if (status?.isRunning) {
            throw new Error(`服务器 "${serverName}" 已经在运行中`);
        }

        try {
            const childProcess = spawn(config.command, config.args, {
                env: { ...process.env, ...config.env },
                stdio: ['ignore', 'pipe', 'pipe']
            });

            this.processes.set(serverName, childProcess);
            this.statuses.set(serverName, {
                isRunning: true,
                pid: childProcess.pid,
                startTime: new Date(),
                name: serverName,
                command: config.command
            });

            childProcess.stdout?.on('data', (data: Buffer) => {
                this.emit('log', serverName, data.toString());
            });

            childProcess.stderr?.on('data', (data: Buffer) => {
                this.emit('error', serverName, data.toString());
            });

            childProcess.on('exit', (code: number | null) => {
                this.processes.delete(serverName);
                this.statuses.set(serverName, {
                    isRunning: false,
                    name: serverName,
                    command: config.command
                });
                this.emit('exit', serverName, code);
            });

            // 等待服务器启动
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error(`服务器 "${serverName}" 启动超时`));
                }, 10000);

                childProcess.once('error', (err: Error) => {
                    clearTimeout(timeout);
                    reject(err);
                });

                this.once('log', () => {
                    clearTimeout(timeout);
                    resolve();
                });
            });
        } catch (error) {
            this.statuses.set(serverName, {
                isRunning: false,
                name: serverName,
                command: config.command
            });
            throw error;
        }
    }

    public async stop(serverName: string): Promise<void> {
        const process = this.processes.get(serverName);
        if (!process) {
            throw new Error(`服务器 "${serverName}" 未在运行`);
        }

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                process.kill('SIGKILL');
            }, 5000);

            process.once('exit', () => {
                clearTimeout(timeout);
                this.processes.delete(serverName);
                this.statuses.set(serverName, {
                    isRunning: false,
                    name: serverName,
                    command: this.configs.get(serverName)?.command || ''
                });
                resolve();
            });

            process.once('error', (err: Error) => {
                clearTimeout(timeout);
                reject(err);
            });

            process.kill('SIGTERM');
        });
    }

    public async restart(serverName: string): Promise<void> {
        const status = this.statuses.get(serverName);
        if (status?.isRunning) {
            await this.stop(serverName);
        }
        await this.start(serverName);
    }

    public getStatus(serverName: string): ServerStatus | undefined {
        return this.statuses.get(serverName);
    }

    public getAllStatuses(): Record<string, ServerStatus> {
        const statuses: Record<string, ServerStatus> = {};
        for (const [name, status] of this.statuses) {
            statuses[name] = { ...status };
        }
        return statuses;
    }

    public getServerNames(): string[] {
        return Array.from(this.configs.keys());
    }

    public updateConfig(config: MCPConfig): void {
        this.initializeConfig(config);
    }
}
