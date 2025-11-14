# ClaudePilot 快速开始

## 🎯 这是什么？

ClaudePilot 是一个简单的桌面工具，让你用图形界面来配置 Claude Code，不用手动编辑 JSON 文件。

## ⚡ 5分钟快速上手

### 1. 安装依赖（只需要一次）

```bash
npm install
```

### 2. 运行程序

```bash
npm start
```

### 3. 开始使用

程序打开后，你会看到：

1. **配置管理** - 设置你的 API Token
2. **MCP 服务** - 添加 Claude 插件服务
3. **用量统计** - 查看 Token 使用情况

## 🔧 常用操作

### 设置 API Token
1. 点击"配置管理"
2. 在"Auth Token"输入框中填入你的 Claude API Token
3. 点击"保存配置"

### 添加 MCP 服务
1. 点击"MCP 服务"
2. 点击"添加服务"
3. 填写服务信息：
   - 服务名称：例如 `filesystem`
   - 服务类型：选择 `STDIO (命令行)`
   - 命令路径：例如 `uvx mcp-server-filesystem`
   - 命令参数：例如 `/path/to/your/folder`

### 让配置生效
1. 保存配置后
2. 重启 Claude Code
3. 新配置就会生效

## 🆘 遇到问题？

### 程序打不开
```bash
# 重新安装依赖
npm install
# 再试试
npm start
```

### 配置保存失败
- 检查 Claude Code 是否已安装
- 确保有写入用户目录的权限

### MCP 服务不工作
- 检查命令路径是否正确
- 确认服务是否已安装
- 重启 Claude Code

## 📦 分享给他人

打包成 exe 文件：
```bash
npm run build
```

在 `dist/` 目录找到安装包，可以直接分享给别人使用。

---

**就这么简单！** 🎉