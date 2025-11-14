const { ipcRenderer } = require('electron');

// 全局状态
let appState = {
    currentSettings: {
        profiles: []
    },
    currentMcpConfig: {
        mcpServers: {}
    },
    settingsFilePath: '',
    mcpFilePath: '',
    selectedProvider: null
};

// 初始化应用
document.addEventListener('DOMContentLoaded', async () => {
    initializeEventListeners();
    await loadInitialData();
    updateStatus('应用已启动', 'success');
});

// 初始化事件监听器
function initializeEventListeners() {
    // 导航切换
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            switchTab(item.dataset.tab);
        });
    });

    // 设置文件相关
    document.getElementById('browse-settings').addEventListener('click', browseSettingsFile);
    document.getElementById('browse-settings-file').addEventListener('click', browseSettingsFile);
    document.getElementById('new-settings').addEventListener('click', showNewSettingsModal);
    document.getElementById('refresh-settings').addEventListener('click', loadSettings);
    document.getElementById('backup-config').addEventListener('click', backupSettings);

    // Provider快速配置
    document.querySelectorAll('.quick-config-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const provider = btn.dataset.provider;
            showProviderModal();
        });
    });

    // API密钥模态框
    document.getElementById('close-api-key-modal').addEventListener('click', hideApiKeyModal);
    document.getElementById('cancel-api-key').addEventListener('click', hideApiKeyModal);
    document.getElementById('save-api-key').addEventListener('click', saveProviderConfig);

    // 新建设置模态框
    document.getElementById('close-new-settings-modal').addEventListener('click', hideNewSettingsModal);
    document.getElementById('cancel-new-settings').addEventListener('click', hideNewSettingsModal);
    document.getElementById('browse-settings-dir').addEventListener('click', browseSettingsDirectory);
    document.getElementById('create-new-settings').addEventListener('click', createNewSettingsFile);

    // MCP 服务相关
    document.getElementById('add-mcp').addEventListener('click', showNewMcpModal);
    document.getElementById('refresh-mcp').addEventListener('click', loadMcpConfig);
    document.getElementById('save-mcp').addEventListener('click', saveMcpService);
    document.getElementById('cancel-mcp').addEventListener('click', hideMcpModal);
    document.getElementById('close-mcp-modal').addEventListener('click', hideMcpModal);

    // MCP 类型切换
    document.getElementById('mcp-type').addEventListener('change', (e) => {
        const type = e.target.value;
        const stdioConfig = document.getElementById('stdio-config');
        const httpConfig = document.getElementById('http-config');

        if (type === 'http' || type === 'sse') {
            stdioConfig.style.display = 'none';
            httpConfig.style.display = 'block';
        } else {
            stdioConfig.style.display = 'block';
            httpConfig.style.display = 'none';
        }
    });

    // 用量监控相关
    document.getElementById('usage-period').addEventListener('change', loadUsageData);
    document.getElementById('refresh-usage').addEventListener('click', loadUsageData);

    // 模态框外部点击关闭
    document.getElementById('mcp-modal').addEventListener('click', (e) => {
        if (e.target.id === 'mcp-modal') hideMcpModal();
    });
    document.getElementById('api-key-modal').addEventListener('click', (e) => {
        if (e.target.id === 'api-key-modal') hideApiKeyModal();
    });
    document.getElementById('new-settings-modal').addEventListener('click', (e) => {
        if (e.target.id === 'new-settings-modal') hideNewSettingsModal();
    });
    document.getElementById('provider-modal').addEventListener('click', (e) => {
        if (e.target.id === 'provider-modal') hideProviderModal();
    });

    // 键盘快捷键
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// 加载初始数据
async function loadInitialData() {
    try {
        await Promise.all([
            loadSettings(),
            loadMcpConfig()
        ]);
        updateSettingsUI();
    } catch (error) {
        console.error('加载初始数据失败:', error);
        updateStatus('加载数据失败: ' + error.message, 'error');
    }
}

// 标签页切换
function switchTab(tabName) {
    // 更新导航状态
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // 特殊处理
    switch (tabName) {
        case 'config-files':
            loadSettings();
            break;
        case 'mcp':
            loadMcpConfig();
            break;
        case 'usage':
            loadUsageData();
            break;
    }
}

// ============ 设置文件管理 ============

// 加载设置
async function loadSettings() {
    try {
        if (!appState.settingsFilePath) {
            appState.settingsFilePath = await ipcRenderer.invoke('get-settings-path');
        }

        if (appState.settingsFilePath && await fileExists(appState.settingsFilePath)) {
            updateStatus('加载设置中...', 'loading');
            appState.currentSettings = await ipcRenderer.invoke('load-settings');
            updateSettingsUI();
            updateStatus('设置已加载', 'success');
        } else {
            updateStatus('未找到设置文件', 'warning');
        }
    } catch (error) {
        console.error('加载设置失败:', error);
        updateStatus('加载设置失败: ' + error.message, 'error');
    }
}

// 检查文件是否存在
async function fileExists(filePath) {
    try {
        const fs = require('fs');
        return fs.existsSync(filePath);
    } catch {
        return false;
    }
}

// 更新设置UI
function updateSettingsUI() {
    // 更新设置文件路径
    document.getElementById('settings-path').value = appState.settingsFilePath || '';

    // 更新配置档案列表
    renderProfilesList();

    updateConfigStatus(appState.settingsFilePath ? '已加载设置' : '未加载设置');
}

// 渲染配置档案列表
function renderProfilesList() {
    const profilesList = document.getElementById('profiles-list');
    const profiles = appState.currentSettings.profiles || [];

    if (profiles.length === 0) {
        profilesList.innerHTML = `
            <div class="empty-state">
                <p>暂无配置档案，点击上方Provider快速创建</p>
            </div>
        `;
    } else {
        profilesList.innerHTML = profiles.map((profile, index) => `
            <div class="profile-item" style="animation-delay: ${index * 0.1}s">
                <div class="profile-info">
                    <h4>${profile.name}</h4>
                    <div class="profile-fields">
                        ${Object.entries(profile.fields || {}).map(([key, value]) => `
                            <div class="field-item">
                                <span class="field-key">${key}:</span>
                                <span class="field-value">${maskApiKey(value)}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="profile-actions">
                    <button class="btn btn-danger btn-sm" onclick="deleteProfile('${profile.name}')">删除</button>
                </div>
            </div>
        `).join('');
    }
}

// 遮蔽API密钥
function maskApiKey(value) {
    if (!value || typeof value !== 'string') return value;
    if (value.includes('{{API_KEY}}')) return '[需要配置]';
    if (value.length > 8 && !value.includes('{{')) {
        return value.substring(0, 8) + '****';
    }
    return value;
}

// 浏览设置文件
async function browseSettingsFile() {
    try {
        const filePath = await ipcRenderer.invoke('select-config-file');
        if (filePath) {
            appState.settingsFilePath = filePath;
            updateSettingsUI();
            await loadSettings();
        }
    } catch (error) {
        showNotification('选择设置文件失败: ' + error.message, 'error');
    }
}

// 显示Provider配置模态框
async function showProviderModal() {
    const modal = document.getElementById('providerModal');
    modal.style.display = 'block';

    // 加载Provider模板
    await loadProviderTemplates();
}

function hideProviderModal() {
    document.getElementById('providerModal').style.display = 'none';
}

// 加载Provider模板
async function loadProviderTemplates() {
    try {
        const templates = await ipcRenderer.invoke('get-provider-templates');
        const container = document.getElementById('providerTemplatesContainer');

        if (!templates || templates.length === 0) {
            container.innerHTML = '<p class="empty-state">暂无可用模板</p>';
            return;
        }

        let html = '';
        templates.forEach(template => {
            html += `
                <div class="provider-card">
                    <div class="provider-display">
                        <div class="provider-info">
                            <span class="provider-icon">${template.icon}</span>
                            <div class="provider-name">${template.name}</div>
                        </div>
                    </div>
                    <div class="provider-fields">
                        <h4>配置参数</h4>
                        <div class="provider-fields-grid">
                    `;

            // 为每个字段创建输入框
            Object.entries(template.fields).forEach(([key, value]) => {
                const isApiKey = key.includes('API_KEY') || key.includes('AUTH_TOKEN');
                const displayKey = key.replace('ANTHROPIC_', '').replace(/_/g, ' ');

                html += `
                    <div class="provider-field">
                        <label>${displayKey}:</label>
                        <input type="${isApiKey ? 'password' : 'text'}"
                               id="provider_${template.key}_${key}"
                               value="${value}"
                               placeholder="请输入${displayKey}"
                               data-provider="${template.key}"
                               data-field="${key}">
                    </div>
                `;
            });

            html += `
                        </div>
                        <div class="provider-actions">
                            <button class="btn btn-primary" onclick="applyProviderConfig('${template.key}')">
                                应用配置
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html;
    } catch (error) {
        console.error('加载Provider模板失败:', error);
        showNotification('加载模板失败: ' + error.message, 'error');
    }
}

// 应用Provider配置
async function applyProviderConfig(providerKey) {
    try {
        // 收集所有字段值
        const inputs = document.querySelectorAll(`input[data-provider="${providerKey}"]`);
        const fields = {};

        inputs.forEach(input => {
            const fieldKey = input.dataset.field;
            const value = input.value.trim();

            if (!value && fieldKey.includes('API_KEY')) {
                showNotification('请输入API密钥', 'error');
                input.focus();
                return;
            }

            fields[fieldKey] = value;
        });

        if (Object.keys(fields).length === 0) {
            showNotification('请填写配置信息', 'error');
            return;
        }

        // 调用主进程保存配置
        const result = await ipcRenderer.invoke('apply-provider-config', providerKey, fields);
        if (result) {
            showNotification('配置应用成功', 'success');
            hideProviderModal();
            loadSettings();
        } else {
            showNotification('配置应用失败', 'error');
        }
    } catch (error) {
        console.error('应用配置失败:', error);
        showNotification('配置应用失败: ' + error.message, 'error');
    }
}

// 保留旧的API密钥模态框函数（用于向后兼容）
function showApiKeyModal(provider) {
    appState.selectedProvider = provider;
    document.getElementById('api-key-modal-title').textContent = `配置 ${provider.toUpperCase()} Provider`;
    document.getElementById('api-key-input').value = '';
    document.getElementById('api-key-modal').style.display = 'block';
}

function hideApiKeyModal() {
    document.getElementById('api-key-modal').style.display = 'none';
    appState.selectedProvider = null;
}

async function saveProviderConfig() {
    try {
        const apiKey = document.getElementById('api-key-input').value.trim();
        if (!apiKey) {
            showNotification('请输入API密钥', 'warning');
            return;
        }

        await ipcRenderer.invoke('apply-provider-template', appState.selectedProvider, apiKey);

        hideApiKeyModal();
        await loadSettings();
        showNotification(`${appState.selectedProvider.toUpperCase()} 配置保存成功`, 'success');
    } catch (error) {
        showNotification('保存配置失败: ' + error.message, 'error');
    }
}

// 删除配置档案
async function deleteProfile(name) {
    if (!confirm(`确定要删除配置档案 "${name}" 吗？`)) {
        return;
    }

    try {
        appState.currentSettings.profiles = appState.currentSettings.profiles.filter(p => p.name !== name);
        await ipcRenderer.invoke('save-settings', appState.currentSettings);
        renderProfilesList();
        showNotification('配置档案删除成功', 'success');
    } catch (error) {
        showNotification('删除失败: ' + error.message, 'error');
    }
}

// 显示新建设置模态框
function showNewSettingsModal() {
    document.getElementById('new-settings-modal').style.display = 'block';
}

// 隐藏新建设置模态框
function hideNewSettingsModal() {
    document.getElementById('new-settings-modal').style.display = 'none';
}

// 浏览设置目录
async function browseSettingsDirectory() {
    try {
        const dirPath = await ipcRenderer.invoke('select-config-directory');
        if (dirPath) {
            document.getElementById('new-settings-dir').value = dirPath;
        }
    } catch (error) {
        showNotification('选择目录失败: ' + error.message, 'error');
    }
}

// 创建新设置文件
async function createNewSettingsFile() {
    try {
        const dir = document.getElementById('new-settings-dir').value.trim();
        const fileName = document.getElementById('new-settings-name').value.trim();

        if (!dir) {
            showNotification('请选择配置目录', 'warning');
            return;
        }

        if (!fileName) {
            showNotification('请输入配置文件名', 'warning');
            return;
        }

        const filePath = require('path').join(dir, fileName);

        // 创建新设置文件
        await ipcRenderer.invoke('create-new-settings', filePath);

        // 设置为当前设置文件
        appState.settingsFilePath = filePath;
        await loadSettings();

        hideNewSettingsModal();
        showNotification('设置文件创建成功', 'success');
    } catch (error) {
        showNotification('创建设置文件失败: ' + error.message, 'error');
    }
}

// 备份设置
async function backupSettings() {
    try {
        if (!appState.settingsFilePath) {
            showNotification('请先选择设置文件', 'warning');
            return;
        }

        const backupPath = await ipcRenderer.invoke('backup-config');
        if (backupPath) {
            showNotification(`设置已备份到: ${backupPath}`, 'success');
        } else {
            showNotification('备份失败', 'error');
        }
    } catch (error) {
        showNotification('备份设置失败: ' + error.message, 'error');
    }
}

// ============ MCP 服务管理 ============

// 加载MCP配置
async function loadMcpConfig() {
    try {
        if (!appState.mcpFilePath) {
            appState.mcpFilePath = await ipcRenderer.invoke('get-mcp-path');
        }

        appState.currentMcpConfig = await ipcRenderer.invoke('load-mcp-config');
        renderMcpServices();
    } catch (error) {
        console.error('加载MCP配置失败:', error);
    }
}

// 渲染MCP服务列表
function renderMcpServices() {
    const mcpList = document.getElementById('mcp-list');
    const mcpCount = document.getElementById('mcp-count');
    const mcpServers = appState.currentMcpConfig.mcpServers || {};
    const services = Object.entries(mcpServers);

    if (services.length === 0) {
        mcpList.innerHTML = `
            <div class="empty-state">
                <h3>暂无 MCP 服务</h3>
                <p>点击"添加服务"来添加您的第一个 MCP 服务</p>
            </div>
        `;
    } else {
        mcpList.innerHTML = services.map(([name, config]) => {
            let configText = '';
            if (config.type === 'stdio' && config.command) {
                configText = `命令: ${config.command.join(' ')}`;
            } else if (config.url) {
                configText = `URL: ${config.url}`;
            }

            return `
                <div class="mcp-item">
                    <div class="mcp-info">
                        <h4>${name}</h4>
                        <p><strong>类型:</strong> ${config.type}</p>
                        <p><strong>配置:</strong> ${configText}</p>
                    </div>
                    <div class="mcp-actions">
                        <button class="btn btn-secondary btn-sm" onclick="editMcpService('${name}')">编辑</button>
                        <button class="btn btn-danger btn-sm" onclick="confirmDeleteMcp('${name}')">删除</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    mcpCount.textContent = services.length;
}

// 显示新建MCP服务模态框
function showNewMcpModal() {
    appState.editingMcp = null;

    // 清空表单
    document.getElementById('mcp-name').value = '';
    document.getElementById('mcp-type').value = 'stdio';
    document.getElementById('mcp-command').value = '';
    document.getElementById('mcp-args').value = '';
    document.getElementById('mcp-url').value = '';
    document.getElementById('mcp-headers').value = '';

    // 显示STDIO配置
    document.getElementById('stdio-config').style.display = 'block';
    document.getElementById('http-config').style.display = 'none';

    // 显示模态框
    document.getElementById('mcp-modal-title').textContent = '添加 MCP 服务';
    document.getElementById('delete-mcp').style.display = 'none';
    document.getElementById('mcp-modal').style.display = 'block';
}

// 编辑MCP服务
function editMcpService(name) {
    const mcpServers = appState.currentMcpConfig.mcpServers || {};
    const service = mcpServers[name];
    if (!service) return;

    appState.editingMcp = { name, config: service };

    // 填充表单
    document.getElementById('mcp-name').value = name;
    document.getElementById('mcp-type').value = service.type;

    if (service.type === 'stdio' && service.command) {
        document.getElementById('mcp-command').value = service.command[0] || '';
        document.getElementById('mcp-args').value = service.command.slice(1).join(' ') || '';
    } else if (service.url) {
        document.getElementById('mcp-url').value = service.url;
        if (service.headers) {
            document.getElementById('mcp-headers').value = JSON.stringify(service.headers, null, 2);
        }
    }

    // 触发类型切换
    document.getElementById('mcp-type').dispatchEvent(new Event('change'));

    // 显示模态框
    document.getElementById('mcp-modal-title').textContent = '编辑 MCP 服务';
    document.getElementById('delete-mcp').style.display = 'inline-block';
    document.getElementById('mcp-modal').style.display = 'block';
}

// 保存MCP服务
async function saveMcpService() {
    try {
        const name = document.getElementById('mcp-name').value.trim();
        if (!name) {
            showNotification('请输入服务名称', 'warning');
            return;
        }

        const type = document.getElementById('mcp-type').value;
        let mcpConfig = { type };

        if (type === 'stdio') {
            const command = document.getElementById('mcp-command').value.trim();
            const args = document.getElementById('mcp-args').value.trim();

            if (!command) {
                showNotification('请输入命令路径', 'warning');
                return;
            }

            mcpConfig.command = [command];
            if (args) {
                mcpConfig.command.push(...args.split(/\s+/));
            }
        } else {
            const url = document.getElementById('mcp-url').value.trim();
            if (!url) {
                showNotification('请输入服务URL', 'warning');
                return;
            }
            mcpConfig.url = url;

            const headersText = document.getElementById('mcp-headers').value.trim();
            if (headersText) {
                try {
                    mcpConfig.headers = JSON.parse(headersText);
                } catch (e) {
                    showNotification('Headers格式错误，请输入有效的JSON', 'error');
                    return;
                }
            }
        }

        // 更新配置
        if (!appState.currentMcpConfig.mcpServers) {
            appState.currentMcpConfig.mcpServers = {};
        }
        appState.currentMcpConfig.mcpServers[name] = mcpConfig;

        // 保存到文件
        await ipcRenderer.invoke('save-mcp-config', appState.currentMcpConfig);

        // 更新服务列表
        await loadMcpConfig();

        hideMcpModal();
        updateStatus('MCP 服务保存成功', 'success');
        showNotification('MCP 服务保存成功', 'success');
    } catch (error) {
        showNotification('保存失败: ' + error.message, 'error');
    }
}

// 确认删除MCP服务
function confirmDeleteMcp(name) {
    if (confirm(`确定要删除 MCP 服务 "${name}" 吗？`)) {
        deleteMcpService(name);
    }
}

// 删除MCP服务
async function deleteMcpService(name) {
    try {
        if (appState.currentMcpConfig.mcpServers && appState.currentMcpConfig.mcpServers[name]) {
            delete appState.currentMcpConfig.mcpServers[name];
            await ipcRenderer.invoke('save-mcp-config', appState.currentMcpConfig);
            await loadMcpConfig();
            updateStatus('MCP 服务删除成功', 'success');
            showNotification('MCP 服务删除成功', 'success');
        }
    } catch (error) {
        showNotification('删除失败: ' + error.message, 'error');
    }
}

// 隐藏MCP模态框
function hideMcpModal() {
    document.getElementById('mcp-modal').style.display = 'none';
    appState.editingMcp = null;
}

// ============ 用量监控 ============

function loadUsageData() {
    // 模拟用量数据
    const period = document.getElementById('usage-period').value;

    const mockData = {
        current: { input: 12345, output: 8901, cache: 2468 },
        today: { input: 45678, output: 23456, cache: 9876 },
        week: { input: 156789, output: 89123, cache: 34567 },
        month: { input: 456789, output: 234567, cache: 123456 }
    };

    const data = mockData[period] || mockData.current;

    document.getElementById('input-tokens').textContent = data.input.toLocaleString();
    document.getElementById('output-tokens').textContent = data.output.toLocaleString();
    document.getElementById('cache-tokens').textContent = data.cache.toLocaleString();

    // 计算成本
    const inputCost = (data.input / 1000) * 0.003;
    const outputCost = (data.output / 1000) * 0.015;
    const totalCost = inputCost + outputCost;
    document.getElementById('usage-cost').textContent = '$' + totalCost.toFixed(4);
}

// ============ 通用功能 ============

// 通知功能
function showNotification(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div');
    notification.className = `notification alert alert-${type} slide-in-right`;
    notification.textContent = message;

    // 添加关闭按钮
    const closeBtn = document.createElement('span');
    closeBtn.innerHTML = '×';
    closeBtn.style.cursor = 'pointer';
    closeBtn.style.marginLeft = '12px';
    closeBtn.onclick = () => notification.remove();
    notification.appendChild(closeBtn);

    // 添加到页面
    document.body.appendChild(notification);

    // 自动移除
    setTimeout(() => {
        notification.style.animation = 'slideInRight 0.3s ease reverse';
        setTimeout(() => notification.remove(), 300);
    }, duration);
}

// 状态更新
function updateStatus(message, type = 'info') {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');

    // 添加过渡效果
    statusText.style.opacity = '0';

    setTimeout(() => {
        statusText.textContent = message;

        // 更新指示器颜色
        statusIndicator.className = 'status-indicator';
        if (type === 'error') {
            statusIndicator.classList.add('error');
        } else if (type === 'warning') {
            statusIndicator.classList.add('warning');
        } else if (type === 'success') {
            statusIndicator.classList.add('success');
        }

        statusText.style.opacity = '1';
        statusText.style.transition = 'opacity 0.2s ease';
    }, 100);

    // 3秒后恢复
    if (type !== 'loading') {
        setTimeout(() => {
            statusText.textContent = '就绪';
            statusIndicator.className = 'status-indicator';
        }, 3000);
    }
}

function updateConfigStatus(status) {
    const configStatus = document.getElementById('config-status');
    configStatus.textContent = status;

    // 添加脉冲效果
    configStatus.style.animation = 'pulse 0.5s ease';
    setTimeout(() => {
        configStatus.style.animation = '';
    }, 500);
}

// 键盘快捷键
function handleKeyboardShortcuts(e) {
    // Ctrl+S 保存
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        if (document.getElementById('mcp-modal').style.display === 'block') {
            saveMcpService();
        }
    }

    // Esc 关闭模态框
    if (e.key === 'Escape') {
        hideMcpModal();
        hideApiKeyModal();
        hideNewSettingsModal();
        hideProviderModal();
    }
}