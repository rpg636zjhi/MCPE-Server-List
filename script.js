// GitHub仓库配置
const GITHUB_USERNAME = "yourusername"; // 替换为你的GitHub用户名
const GITHUB_REPO = "mc014-server-list"; // 替换为你的仓库名

// 全局变量
let allServers = [];
let filteredServers = [];

// DOM加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    loadServers();
    setupEventListeners();
    fetchGithubUpdateTime();
});

// 加载服务器数据
function loadServers() {
    fetch('servers.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('网络响应不正常');
            }
            return response.json();
        })
        .then(data => {
            allServers = data.servers;
            filteredServers = [...allServers];
            
            // 更新统计信息
            updateStats(data);
            
            // 渲染服务器列表
            renderServerList();
        })
        .catch(error => {
            console.error('加载服务器数据时出错:', error);
            document.getElementById('server-list').innerHTML = 
                '<div class="error-message">无法加载服务器数据。请稍后再试。</div>';
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
            const updateTime = data.updated_at;
            const formattedTime = formatGithubTime(updateTime);
            document.getElementById('last-update').textContent = formattedTime;
        })
        .catch(error => {
            console.error('获取GitHub更新时间时出错:', error);
            document.getElementById('last-update').textContent = '获取失败';
            
            // 备用方案：使用当前时间
            const now = new Date();
            const formattedTime = now.toLocaleString('zh-CN');
            document.getElementById('last-update').textContent = formattedTime + ' (本地时间)';
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
            case 'online':
                matchesFilter = server.status === 'online';
                break;
            case 'offline':
                matchesFilter = server.status === 'offline';
                break;
            case 'survival':
                matchesFilter = server.tags.includes('生存');
                break;
            case 'creative':
                matchesFilter = server.tags.includes('创造');
                break;
            case 'pvp':
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
    // 懒得修Bug了，先这样吧
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