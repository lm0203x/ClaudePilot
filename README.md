# ClaudePilot - Claude Code 配置工具

ClaudePilot 是一个简单易用的 Claude Code 配置管理工具，提供可视化的界面来管理配置文件、MCP服务和用量统计。

## 🎯 核心功能

### 1. 配置文件管理
- **浏览选择配置文件**：通过文件浏览器选择现有的 Claude 配置文件
- **新建配置文件**：在任意目录创建新的配置文件
- **环境变量编辑**：可视化编辑环境变量（如 API 密钥、Base URL 等）
- **配置备份**：一键备份当前配置文件
- **实时保存**：修改后即时保存到配置文件

### 2. MCP 服务配置
- **服务管理**：添加、编辑、删除 MCP 服务
- **多种类型支持**：支持 STDIO、HTTP、SSE 三种服务类型
- **配置验证**：验证 JSON 格式的 Headers 配置
- **服务列表**：清晰展示所有已配置的 MCP 服务

### 3. 用量统计
- **多时间维度**：支持当前会话、今天、本周、本月的用量查看
- **详细统计**：输入 Tokens、输出 Tokens、缓存命中数
- **费用估算**：基于使用量的预估费用计算
- **实时刷新**：手动刷新获取最新用量数据

## 🚀 快速开始

### 启动应用
```bash
npm start
```

### 基本使用流程

1. **配置文件设置**
   - 点击"浏览选择"选择现有的 `claude_desktop_config.json` 文件
   - 或点击"新建配置"在指定目录创建新的配置文件
   - 在环境变量文本框中编辑配置，格式为：
     ```
     ANTHROPIC_BASE_URL=https://api.anthropic.com
     ANTHROPIC_AUTH_TOKEN=your_token_here
     ```

2. **MCP 服务配置**
   - 切换到"MCP配置"标签页
   - 点击"添加服务"创建新的 MCP 服务配置
   - 选择服务类型（STDIO/HTTP/SSE）并填写相应配置
   - 点击"保存"完成服务添加

3. **用量查看**
   - 切换到"用量显示"标签页
   - 选择时间维度查看用量统计
   - 点击"刷新"获取最新数据

## 🎨 界面特性

- **VS Code 风格深色主题**：专业的开发工具外观
- **响应式设计**：适配不同屏幕尺寸
- **键盘快捷键**：
  - `Ctrl+S`：保存当前配置
  - `Esc`：关闭模态框

## 📁 配置文件格式

应用管理标准的 Claude 配置文件格式：

```json
{
  "environmentVariables": {
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_AUTH_TOKEN": "your_token_here"
  },
  "mcpServers": {
    "filesystem": {
      "type": "stdio",
      "command": ["npx", "@modelcontextprotocol/server-filesystem", "/path/to/allowed/files"]
    }
  }
}
```

## 🔧 技术栈

- **前端**：HTML + CSS + JavaScript (原生)
- **后端**：Electron + Node.js
- **UI框架**：自定义 CSS (VS Code 风格)

## ⚡ 快捷操作

- 配置文件自动保存
- MCP 服务即时生效
- 用量数据实时刷新
- 配置文件自动备份

## 📂 配置文件位置

ClaudePilot 会自动识别并修改以下配置文件：

- **Windows**: `%USERPROFILE%\AppData\Roaming\Claude\claude_desktop_config.json`
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

## 🔧 开发

### 环境要求

- Node.js 16+
- npm 7+

### 开发模式

```bash
# 启动开发模式（包含开发者工具）
npm run dev
```

### 构建配置

构建配置在 `package.json` 的 `build` 字段中：

- **Windows**: 生成 NSIS 安装包
- **自动创建桌面快捷方式**
- **支持自定义安装路径**

## 🐛 故障排除

### 常见问题

1. **无法保存配置**
   - 检查 Claude Code 是否已安装
   - 确保有写入用户配置目录的权限

2. **MCP 服务不生效**
   - 确认服务命令路径正确
   - 检查服务是否正在运行
   - 重启 Claude Code

3. **应用无法启动**
   - 检查 Node.js 版本是否符合要求
   - 重新安装依赖：`npm install`

### 日志查看

打开开发者工具查看详细日志：

- 开发模式：`npm run dev`
- 生产模式：`Ctrl+Shift+I` 打开开发者工具

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License

## 🙏 致谢

- [Electron](https://electronjs.org/) - 跨平台桌面应用框架
- [Claude Code](https://docs.anthropic.com/claude/docs/claude-code) - AI 编程助手