const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    title: 'ClaudePilot - Claude Code 可视化工具'
  });

  mainWindow.loadFile('index.html');

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }
}

// 获取Claude配置文件路径
function getClaudeConfigPath() {
  const home = os.homedir();
  return path.join(home, '.claude.json');
}

// 获取Claude设置文件路径
function getClaudeSettingsPath() {
  const home = os.homedir();
  return path.join(home, '.claude', 'settings.json');
}

// Provider 模板 - 匹配 settings.json 格式
const PROVIDER_TEMPLATES = {
  claude: {
    name: 'Claude',
    icon: '🤖',
    fields: {
      "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
      "ANTHROPIC_MODEL": "claude-3-5-sonnet-20241022",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-3-5-haiku-20241022",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "claude-3-opus-20240229",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "claude-3-5-sonnet-20241022",
      "ANTHROPIC_SMALL_FAST_MODEL": "claude-3-haiku-20240307",
      "ANTHROPIC_API_KEY": "{{API_KEY}}",
      "ANTHROPIC_AUTH_TOKEN": "{{API_KEY}}"
    }
  },
  glm: {
    name: 'GLM',
    icon: '🧠',
    fields: {
      "ANTHROPIC_BASE_URL": "https://open.bigmodel.cn/",
      "ANTHROPIC_MODEL": "GLM-4.6",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "GLM-4.5-Air",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "GLM-4.6",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "GLM-4.6",
      "ANTHROPIC_SMALL_FAST_MODEL": "",
      "ANTHROPIC_API_KEY": "{{API_KEY}}",
      "ANTHROPIC_AUTH_TOKEN": "{{API_KEY}}"
    }
  },
  kimi: {
    name: 'Kimi',
    icon: '🌙',
    fields: {
      "ANTHROPIC_BASE_URL": "https://api.moonshot.cn/v1",
      "ANTHROPIC_MODEL": "moonshot-v1-32k",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "moonshot-v1-8k",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "moonshot-v1-128k",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "moonshot-v1-32k",
      "ANTHROPIC_SMALL_FAST_MODEL": "moonshot-v1-8k",
      "ANTHROPIC_API_KEY": "{{API_KEY}}",
      "ANTHROPIC_AUTH_TOKEN": "{{API_KEY}}"
    }
  },
  openai: {
    name: 'OpenAI',
    icon: '🔷',
    fields: {
      "ANTHROPIC_BASE_URL": "https://api.openai.com/v1",
      "ANTHROPIC_MODEL": "gpt-4-turbo",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "gpt-3.5-turbo",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "gpt-4-turbo",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "gpt-4",
      "ANTHROPIC_SMALL_FAST_MODEL": "gpt-3.5-turbo",
      "ANTHROPIC_API_KEY": "{{API_KEY}}",
      "ANTHROPIC_AUTH_TOKEN": "{{API_KEY}}"
    }
  },
  deepseek: {
    name: 'DeepSeek',
    icon: '🔬',
    fields: {
      "ANTHROPIC_BASE_URL": "https://api.deepseek.com/v1",
      "ANTHROPIC_MODEL": "deepseek-chat",
      "ANTHROPIC_DEFAULT_HAIKU_MODEL": "deepseek-chat",
      "ANTHROPIC_DEFAULT_OPUS_MODEL": "deepseek-chat",
      "ANTHROPIC_DEFAULT_SONNET_MODEL": "deepseek-chat",
      "ANTHROPIC_SMALL_FAST_MODEL": "",
      "ANTHROPIC_API_KEY": "{{API_KEY}}",
      "ANTHROPIC_AUTH_TOKEN": "{{API_KEY}}"
    }
  }
};

// IPC 处理器
ipcMain.handle('load-settings', async () => {
  try {
    const settingsPath = getClaudeSettingsPath();
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      let settings = JSON.parse(data);

      // 确保必要字段存在
      if (!settings.configHistory) {
        settings.configHistory = [];
      }

      // 如果有env配置但没有活动的历史配置，自动迁移
      if (settings.env && Object.keys(settings.env).length > 0) {
        const hasActiveConfig = settings.configHistory.some(config => config.isActive);

        if (!hasActiveConfig) {
          // 从env中识别Provider
          const baseUrl = settings.env.ANTHROPIC_BASE_URL || '';
          let providerName = '自定义配置';
          let providerKey = 'custom';
          let providerIcon = '🔧';

          if (baseUrl.includes('open.bigmodel.cn')) {
            providerName = 'GLM';
            providerKey = 'glm';
            providerIcon = '🧠';
          } else if (baseUrl.includes('api.moonshot.cn')) {
            providerName = 'Kimi';
            providerKey = 'kimi';
            providerIcon = '🌙';
          } else if (baseUrl.includes('api.openai.com') || baseUrl.includes('openai.com')) {
            providerName = 'OpenAI';
            providerKey = 'openai';
            providerIcon = '🔷';
          } else if (baseUrl.includes('api.deepseek.com')) {
            providerName = 'DeepSeek';
            providerKey = 'deepseek';
            providerIcon = '🔬';
          } else if (baseUrl.includes('api.anthropic.com')) {
            providerName = 'Claude';
            providerKey = 'claude';
            providerIcon = '🤖';
          }

          // 创建历史配置项
          const migratedConfig = {
            id: Date.now().toString(),
            name: providerName,
            providerKey: providerKey,
            fields: { ...settings.env },
            icon: providerIcon,
            createdAt: new Date().toISOString(),
            isActive: true
          };

          // 添加到历史记录
          settings.configHistory.push(migratedConfig);

          // 保存更新后的设置
          fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
        }
      }

      return settings;
    } else {
      return {
        profiles: [],
        configHistory: []
      };
    }
  } catch (error) {
    console.error('加载设置失败:', error);
    throw error;
  }
});

ipcMain.handle('load-mcp-config', async () => {
  try {
    const mcpPath = getClaudeConfigPath();
    if (fs.existsSync(mcpPath)) {
      const data = fs.readFileSync(mcpPath, 'utf8');
      return JSON.parse(data);
    } else {
      return {
        mcpServers: {}
      };
    }
  } catch (error) {
    console.error('加载MCP配置失败:', error);
    throw error;
  }
});

ipcMain.handle('save-settings', async (event, settings) => {
  try {
    const settingsPath = getClaudeSettingsPath();
    const settingsDir = path.dirname(settingsPath);

    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }

    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch (error) {
    console.error('保存设置失败:', error);
    throw error;
  }
});

ipcMain.handle('save-mcp-config', async (event, mcpConfig) => {
  try {
    const mcpPath = getClaudeConfigPath();
    fs.writeFileSync(mcpPath, JSON.stringify(mcpConfig, null, 2));
    return true;
  } catch (error) {
    console.error('保存MCP配置失败:', error);
    throw error;
  }
});

ipcMain.handle('get-provider-templates', async () => {
  return Object.entries(PROVIDER_TEMPLATES).map(([key, template]) => ({
    key,
    ...template
  }));
});

ipcMain.handle('apply-provider-template', async (event, providerKey, apiKey) => {
  try {
    const template = PROVIDER_TEMPLATES[providerKey];
    if (!template) {
      throw new Error('未找到Provider模板');
    }

    // 读取现有设置
    let settings;
    const currentSettingsPath = getClaudeSettingsPath();
    if (fs.existsSync(currentSettingsPath)) {
      const data = fs.readFileSync(currentSettingsPath, 'utf8');
      settings = JSON.parse(data);
    } else {
      // 如果文件不存在，创建基本的设置结构
      settings = {
        alwaysThinkingEnabled: true,
        env: {},
        profiles: []
      };
    }

    // 确保env对象存在
    if (!settings.env) {
      settings.env = {};
    }

    // 将模板字段直接写入env，替换API_KEY占位符
    Object.keys(template.fields).forEach(key => {
      let value = template.fields[key];
      if (value === '{{API_KEY}}') {
        value = apiKey;
      }
      // 只有非空值才设置到env中
      if (value && value.trim() !== '') {
        settings.env[key] = value;
      }
    });

    // 保存设置
    const settingsDir = path.dirname(currentSettingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }

    fs.writeFileSync(currentSettingsPath, JSON.stringify(settings, null, 2));

    return true;
  } catch (error) {
    console.error('应用Provider模板失败:', error);
    throw error;
  }
});

// 新的IPC处理器：直接修改env字段配置并保存到历史
ipcMain.handle('apply-provider-config', async (event, providerKey, fields) => {
  try {
    const template = PROVIDER_TEMPLATES[providerKey];
    if (!template) {
      throw new Error('未找到Provider模板');
    }

    // 读取现有设置
    let settings;
    const currentSettingsPath = getClaudeSettingsPath();
    if (fs.existsSync(currentSettingsPath)) {
      const data = fs.readFileSync(currentSettingsPath, 'utf8');
      settings = JSON.parse(data);
    } else {
      // 如果文件不存在，创建基本的设置结构
      settings = {
        alwaysThinkingEnabled: true,
        env: {},
        profiles: [],
        configHistory: []
      };
    }

    // 确保必要字段存在
    if (!settings.env) {
      settings.env = {};
    }
    if (!settings.configHistory) {
      settings.configHistory = [];
    }

    // 直接将所有字段写入env
    Object.keys(fields).forEach(key => {
      const value = fields[key];
      if (value && value.trim() !== '') {
        // 只有非空值才设置到env中
        settings.env[key] = value;
      } else if (settings.env[key]) {
        // 如果值为空且env中存在该字段，则删除
        delete settings.env[key];
      }
    });

    // 添加配置到历史记录
    const configEntry = {
      id: Date.now().toString(),
      name: template.name,
      providerKey: providerKey,
      fields: { ...fields },
      icon: template.icon,
      createdAt: new Date().toISOString(),
      isActive: true
    };

    // 检查是否已存在相同的配置
    const existingIndex = settings.configHistory.findIndex(config =>
      config.providerKey === providerKey &&
      JSON.stringify(config.fields) === JSON.stringify(fields)
    );

    if (existingIndex >= 0) {
      // 更新现有配置
      settings.configHistory[existingIndex] = configEntry;
    } else {
      // 添加新配置
      settings.configHistory.push(configEntry);
    }

    // 将其他配置标记为非活动
    settings.configHistory.forEach(config => {
      if (config.id !== configEntry.id) {
        config.isActive = false;
      }
    });

    // 保存设置
    const settingsDir = path.dirname(currentSettingsPath);
    if (!fs.existsSync(settingsDir)) {
      fs.mkdirSync(settingsDir, { recursive: true });
    }

    fs.writeFileSync(currentSettingsPath, JSON.stringify(settings, null, 2));

    return true;
  } catch (error) {
    console.error('应用Provider配置失败:', error);
    throw error;
  }
});

ipcMain.handle('get-settings-path', async () => {
  return getClaudeSettingsPath();
});

// 切换到历史配置
ipcMain.handle('switch-to-config', async (event, configId) => {
  try {
    const currentSettingsPath = getClaudeSettingsPath();
    if (!fs.existsSync(currentSettingsPath)) {
      throw new Error('配置文件不存在');
    }

    const data = fs.readFileSync(currentSettingsPath, 'utf8');
    const settings = JSON.parse(data);

    if (!settings.configHistory) {
      throw new Error('没有配置历史');
    }

    // 找到目标配置
    const targetConfig = settings.configHistory.find(config => config.id === configId);
    if (!targetConfig) {
      throw new Error('未找到配置');
    }

    // 将目标配置应用到env
    if (!settings.env) {
      settings.env = {};
    }

    // 清空现有env，然后应用目标配置
    settings.env = {};
    Object.keys(targetConfig.fields).forEach(key => {
      const value = targetConfig.fields[key];
      if (value && value.trim() !== '') {
        settings.env[key] = value;
      }
    });

    // 更新活动状态
    settings.configHistory.forEach(config => {
      config.isActive = config.id === configId;
    });

    // 保存设置
    fs.writeFileSync(currentSettingsPath, JSON.stringify(settings, null, 2));

    return true;
  } catch (error) {
    console.error('切换配置失败:', error);
    throw error;
  }
});

// 删除历史配置
ipcMain.handle('delete-config', async (event, configId) => {
  try {
    const currentSettingsPath = getClaudeSettingsPath();
    if (!fs.existsSync(currentSettingsPath)) {
      throw new Error('配置文件不存在');
    }

    const data = fs.readFileSync(currentSettingsPath, 'utf8');
    const settings = JSON.parse(data);

    if (!settings.configHistory) {
      throw new Error('没有配置历史');
    }

    // 找到要删除的配置
    const configIndex = settings.configHistory.findIndex(config => config.id === configId);
    if (configIndex === -1) {
      throw new Error('未找到配置');
    }

    const configToDelete = settings.configHistory[configIndex];

    // 如果是当前活动的配置，清空env
    if (configToDelete.isActive) {
      settings.env = {};
    }

    // 删除配置
    settings.configHistory.splice(configIndex, 1);

    // 保存设置
    fs.writeFileSync(currentSettingsPath, JSON.stringify(settings, null, 2));

    return true;
  } catch (error) {
    console.error('删除配置失败:', error);
    throw error;
  }
});

ipcMain.handle('get-mcp-path', async () => {
  return getClaudeConfigPath();
});

ipcMain.handle('backup-config', async () => {
  try {
    const currentSettingsPath = getClaudeSettingsPath();
    if (fs.existsSync(currentSettingsPath)) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const backupPath = currentSettingsPath.replace('.json', `.backup.${timestamp}.json`);
      fs.copyFileSync(currentSettingsPath, backupPath);
      return backupPath;
    }
    return null;
  } catch (error) {
    console.error('备份配置失败:', error);
    throw error;
  }
});

// 选择配置文件
ipcMain.handle('select-config-file', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择Claude配置文件',
      filters: [
        { name: 'JSON文件', extensions: ['json'] },
        { name: '所有文件', extensions: ['*'] }
      ],
      properties: ['openFile']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  } catch (error) {
    console.error('选择文件失败:', error);
    throw error;
  }
});

// 选择配置文件目录
ipcMain.handle('select-config-directory', async () => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: '选择Claude配置目录',
      properties: ['openDirectory']
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  } catch (error) {
    console.error('选择目录失败:', error);
    throw error;
  }
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});