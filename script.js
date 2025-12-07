// GitHub仓库配置
const GITHUB_USERNAME = "rpg636zjhi";
const GITHUB_REPO = "MCPE-Server-List";

// Gist 配置
const GIST_ID = "ee19f0e5a28fdaeac23326f975d03706";

// 全局变量
let allServers = [];
let filteredServers = [];

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    loadServersFromGist();
    setupEventListeners();
    fetchGithubUpdateTime();
});

// 从 Gist 加载服务器数据
function loadServersFromGist() {
    // Gist API URL - 获取 Gist 内容
    const gistApiUrl = `https://api.github.com/gists/${GIST_ID}`;
    
    fetch(gistApiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Gist API响应不正常');
            }
            return response.json();
        })
        .then(gistData => {
            // Gist 中可能包含多个文件，我们需要找到包含服务器数据的文件
            const files = gistData.files;
            let serverData = null;
            
            // 查找包含服务器数据的文件
            for (const filename in files) {
                if (filename.endsWith('.json') || filename === 'servers.json' || filename.includes('server')) {
                    const fileContent = files[filename].content;
                    try {
                        serverData = JSON.parse(fileContent);
                        break; // 找到第一个有效的JSON文件就停止
                    } catch (error) {
                        console.warn(`无法解析文件 ${filename}:`, error);
                    }
                }
            }
            
            if (serverData) {
                allServers = serverData.servers || serverData;
                filteredServers = [...allServers];
                
                // 更新统计信息
                updateStats({ servers: allServers });
                
                // 渲染服务器列表
                renderServerList();
                
                // 更新最后更新时间（使用Gist的更新时间）
                const updateTime = formatGithubTime(gistData.updated_at);
                document.getElementById('last-update').textContent = updateTime;
            } else {
                throw new Error('未在Gist中找到有效的服务器数据');
            }
        })
        .catch(error => {
            console.error('从Gist加载服务器数据时出错:', error);
            document.getElementById('server-list').innerHTML = 
                '<div class="error-message">无法加载服务器数据。请稍后再试。</div>';
            
            // 尝试备用方案：直接使用 Gist 的 raw URL
            loadServersFromRawGist();
        });
}

// 备用方案：直接从 Gist 的 raw URL 加载数据
function loadServersFromRawGist() {
    // Gist raw URL - 直接获取文件内容
    const gistRawUrl = `https://gist.githubusercontent.com/rpg636zjhi/${GIST_ID}/raw/servers.json`;
    
    fetch(gistRawUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Gist raw URL响应不正常');
            }
            return response.json();
        })
        .then(data => {
            allServers = data.servers || data;
            filteredServers = [...allServers];
            
            // 更新统计信息
            updateStats({ servers: allServers });
            
            // 渲染服务器列表
            renderServerList();
            
            // 由于从raw URL加载，无法获取更新时间，显示当前时间
            const now = new Date();
            const formattedTime = now.toLocaleString('zh-CN');
            document.getElementById('last-update').textContent = formattedTime + ' (本地时间)';
        })
        .catch(error => {
            console.error('从Gist raw URL加载服务器数据时出错:', error);
            document.getElementById('server-list').innerHTML = 
                '<div class="error-message">无法加载服务器数据。请检查网络连接或稍后再试。</div>';
        });
}

// 从GitHub API获取最后更新时间
function fetchGithubUpdateTime() {
    // GitHub API URL - 获取仓库最后更新时间
    const apiUrl = `https://api.github.com/repos/${GITHUB_USERNAME}/${GITHUB_REPO}`;
    
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('GitHub API响应不正常');
            }
            return response.json();
        })
        .then(data => {
            // 这里我们不再直接设置更新时间，因为已经从Gist获取了
            // 但可以保留这个函数用于其他用途
            console.log('GitHub仓库最后更新时间:', data.updated_at);
        })
        .catch(error => {
            console.error('获取GitHub更新时间时出错:', error);
        });
}

// 格式化GitHub时间
function formatGithubTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
}

// 更新统计信息 - 只更新总服务器数
function updateStats(data) {
    const totalServers = data.servers.length;
    document.getElementById('total-servers').textContent = totalServers;
}

// 渲染服务器列表
function renderServerList() {
    const serverListElement = document.getElementById('server-list');
    
    if (filteredServers.length === 0) {
        serverListElement.innerHTML = '<div class="no-results">没有找到匹配的服务器。</div>';
        return;
    }
    
    serverListElement.innerHTML = filteredServers.map(server => `
        <div class="server-card ${server.status}" data-id="${server.id}">
            <div class="server-header">
                <div>
                    <div class="server-name">
                        <i class="fas fa-server"></i>
                        ${server.name}
                    </div>
                    <div class="server-version">版本: ${server.version}</div>
                </div>
            </div>
            
            <div class="input-wrapper">
                <input type="text" class="address-input" value="${server.ip}:${server.port}" readonly>
                <button class="input-copy-btn" data-ip="${server.ip}:${server.port}">
                    <i class="far fa-copy"></i> 复制
                </button>
            </div>
            
            <div class="server-info">
                <div class="last-updated">
                    更新: ${formatTime(server.lastUpdated)}
                </div>
            </div>
            
            <p class="server-description">${server.description}</p>
            
            <div class="server-tags">
                ${server.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
    
    // 为每个服务器卡片添加点击事件（查看详情）
    document.querySelectorAll('.server-card').forEach(card => {
        card.addEventListener('click', function(e) {
            // 如果点击的是复制按钮或输入框，则不触发详情查看
            if (e.target.classList.contains('input-copy-btn') || 
                e.target.classList.contains('address-input') ||
                e.target.closest('.input-copy-btn') ||
                e.target.closest('.address-input')) {
                return;
            }
            const serverId = parseInt(this.getAttribute('data-id'));
            showServerDetails(serverId);
        });
    });
    
    // 为复制按钮添加事件
    document.querySelectorAll('.input-copy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation(); // 防止事件冒泡到卡片
            const address = this.getAttribute('data-ip');
            const input = this.previousElementSibling;
            
            // 选中输入框中的文本
            input.select();
            input.setSelectionRange(0, 99999); // 移动设备支持
            
            // 复制到剪贴板
            if (navigator.clipboard) {
                navigator.clipboard.writeText(address).then(() => {
                    showCopyFeedback(this);
                });
            } else {
                // 备用方法
                document.execCommand('copy');
                showCopyFeedback(this);
            }
        });
    });
    
    // 为输入框添加点击选中功能
    document.querySelectorAll('.address-input').forEach(input => {
        input.addEventListener('click', function(e) {
            e.stopPropagation();
            this.select();
            this.setSelectionRange(0, 99999);
        });
    });
}

// 显示复制反馈
function showCopyFeedback(button) {
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="fas fa-check"></i> 已复制';
    button.classList.add('copied');
    
    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.classList.remove('copied');
    }, 2000);
}

// 显示服务器详情
function showServerDetails(serverId) {
    const server = allServers.find(s => s.id === serverId);
    if (!server) return;
    
    const modal = document.getElementById('server-modal');
    const modalContent = document.getElementById('modal-content');
    
    modalContent.innerHTML = `
        <h2 class="modal-server-name">
            <i class="fas fa-server"></i> ${server.name}
        </h2>
        
        <div class="modal-server-status">
            <span class="server-version">版本: ${server.version}</span>
        </div>
        
        <div class="input-wrapper">
            <input type="text" class="address-input" value="${server.ip}:${server.port}" readonly>
            <button class="input-copy-btn" data-ip="${server.ip}:${server.port}">
                <i class="far fa-copy"></i> 复制地址
            </button>
        </div>
        
        <div class="modal-description">
            <h3><i class="fas fa-info-circle"></i> 描述</h3>
            <p>${server.description}</p>
        </div>
        
        <div class="modal-details">
            <div class="detail-item">
                <div class="detail-label">服务器ID</div>
                <div class="detail-value">#${server.id}</div>
            </div>
            ${server.website ? `
            <div class="detail-item">
                <div class="detail-label">官方网站</div>
                <div class="detail-value">
                    <a href="${server.website}" target="_blank">访问网站</a>
                </div>
            </div>
            ` : ''}
        </div>
        
        <div class="modal-tags">
            <h3><i class="fas fa-tags"></i> 标签</h3>
            <div class="server-tags">
                ${server.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `;
    
    // 为模态框内的复制按钮添加事件
    modalContent.querySelector('.input-copy-btn').addEventListener('click', function() {
        const address = this.getAttribute('data-ip');
        const input = this.previousElementSibling;
        
        input.select();
        input.setSelectionRange(0, 99999);
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(address).then(() => {
                showCopyFeedback(this);
            });
        } else {
            document.execCommand('copy');
            showCopyFeedback(this);
        }
    });
    
    // 为模态框内的输入框添加点击选中功能
    modalContent.querySelector('.address-input').addEventListener('click', function() {
        this.select();
        this.setSelectionRange(0, 99999);
    });
    
    // 显示模态框
    modal.style.display = 'flex';
}

// 设置事件监听器
function setupEventListeners() {
    // 搜索功能
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('input', function() {
        filterServers();
    });
    
    // 筛选按钮
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // 移除所有按钮的active类
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            // 为当前点击的按钮添加active类
            this.classList.add('active');
            
            filterServers();
        });
    });
    
    // 联系我们按钮（现在改为提交服务器）
    document.getElementById('contact-btn').addEventListener('click', function() {
        const githubUrl = `https://github.com/${GITHUB_USERNAME}/${GITHUB_REPO}`;
        alert(`想要添加你的服务器？\n\n请访问GitHub仓库提交Pull Request或Issue：\n${githubUrl}`);
    });
    
    // 模态框关闭按钮
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('server-modal').style.display = 'none';
    });
    
    // 点击模态框外部关闭
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('server-modal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
    
    // 按ESC键关闭模态框
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            document.getElementById('server-modal').style.display = 'none';
        }
    });
}

// 筛选服务器
function filterServers() {
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    
    filteredServers = allServers.filter(server => {
        // 搜索筛选
        const matchesSearch = searchTerm === '' || 
            server.name.toLowerCase().includes(searchTerm) ||
            server.description.toLowerCase().includes(searchTerm) ||
            server.tags.some(tag => tag.toLowerCase().includes(searchTerm));
        
        // 筛选按钮筛选
        let matchesFilter = true;
        switch(activeFilter) {
            case 'survival':
                matchesFilter = server.tags.includes('生存');
                break;
            case 'creative':
                matchesFilter = server.tags.includes('创造');
                break;
            case 'game':
                matchesFilter = server.tags.includes('PVP');
                break;
            // 'all' 不需要额外筛选
        }
        
        return matchesSearch && matchesFilter;
    });
    
    renderServerList();
}

// 格式化时间
function formatTime(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    // 懒得修了
    if(diffMins < 60) {
        return date.toLocaleDateString('zh-CN');
    } else if (diffHours < 24) {
        return date.toLocaleDateString('zh-CN');
    } else if (diffDays < 7) {
        return date.toLocaleDateString('zh-CN');
    } else {
        return date.toLocaleDateString('zh-CN');
    }
}

// 添加一些额外的交互效果
document.addEventListener('DOMContentLoaded', function() {
    // 添加动画效果
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    // 观察服务器卡片
    const cards = document.querySelectorAll('.server-card');
    cards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        card.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(card);
    });
});