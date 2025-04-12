export interface MCPServerConfig {
    command: string;      // 服务器启动命令
    args: string[];       // 命令行参数
    env?: Record<string, string>;  // 环境变量
}

export interface MCPConfig {
    mcpServers: Record<string, MCPServerConfig>;  // 服务器配置映射
}

export interface ServerStatus {
    isRunning: boolean;   // 是否正在运行
    pid?: number;         // 进程ID
    startTime?: Date;     // 启动时间
    name: string;         // 服务器名称
    command: string;      // 启动命令
}
