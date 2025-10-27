// Acompanhar Pedidos - JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado
    checkUserLogin();
    
    // Carregar pedidos
    loadOrders();
    
    // Configurar event listeners
    setupEventListeners();
});

// Estado da aplicação
let currentFilter = 'all';
let allOrders = [];
let filteredOrders = [];

function checkUserLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'loginUsuario.html';
        return false;
    }
    return true;
}

function loadOrders() {
    showLoadingState();
    
    // Simular carregamento dos pedidos (substitua pela chamada real à API)
    setTimeout(() => {
        const mockOrders = [
            {
                id: 'DP001',
                date: '2025-10-27',
                time: '14:30',
                status: 'in-progress',
                statusText: 'Em andamento',
                origem: 'Shopping Vila Olímpia, São Paulo - SP',
                destino: 'Rua das Flores, 123 - Vila Madalena, São Paulo - SP',
                motoboy: 'João Silva',
                motoboyPhone: '(11) 99999-8888',
                estimatedTime: '15 minutos',
                currentLocation: 'Av. Paulista, 1000',
                price: 'R$ 12,50',
                description: 'Medicamentos da farmácia'
            },
            {
                id: 'DP002',
                date: '2025-10-27',
                time: '13:15',
                status: 'pending',
                statusText: 'Pendente',
                origem: 'Centro, São Paulo - SP',
                destino: 'Zona Sul, São Paulo - SP',
                motoboy: null,
                motoboyPhone: null,
                estimatedTime: 'Aguardando motoboy',
                currentLocation: null,
                price: 'R$ 18,00',
                description: 'Documentos importantes'
            },
            {
                id: 'DP003',
                date: '2025-10-26',
                time: '16:45',
                status: 'delivered',
                statusText: 'Entregue',
                origem: 'Shopping Iguatemi, São Paulo - SP',
                destino: 'Residencial Park, São Paulo - SP',
                motoboy: 'Carlos Santos',
                motoboyPhone: '(11) 88888-7777',
                estimatedTime: 'Concluído',
                currentLocation: 'Entregue',
                price: 'R$ 15,75',
                description: 'Roupas e acessórios'
            },
            {
                id: 'DP004',
                date: '2025-10-25',
                time: '10:20',
                status: 'cancelled',
                statusText: 'Cancelado',
                origem: 'Mercado Central, São Paulo - SP',
                destino: 'Bairro Jardins, São Paulo - SP',
                motoboy: null,
                motoboyPhone: null,
                estimatedTime: 'Cancelado',
                currentLocation: null,
                price: 'R$ 10,00',
                description: 'Compras do mercado'
            }
        ];
        
        allOrders = mockOrders;
        applyFilter(currentFilter);
        hideLoadingState();
    }, 1000);
}

function showLoadingState() {
    const ordersList = document.getElementById('ordersList');
    ordersList.innerHTML = Array(3).fill(0).map(() => `
        <div class="order-card loading">
            <div class="order-header">
                <div>
                    <div class="skeleton" style="width: 120px;"></div>
                    <div class="skeleton" style="width: 80px; height: 12px;"></div>
                </div>
                <div class="skeleton" style="width: 80px; height: 25px; border-radius: 15px;"></div>
            </div>
            <div class="order-route">
                <div class="skeleton" style="width: 100%; height: 16px;"></div>
                <div class="skeleton" style="width: 100%; height: 16px;"></div>
            </div>
            <div class="skeleton" style="width: 150px; height: 30px; border-radius: 15px;"></div>
        </div>
    `).join('');
}

function hideLoadingState() {
    const loadingCards = document.querySelectorAll('.order-card.loading');
    loadingCards.forEach(card => card.remove());
}

function applyFilter(filter) {
    currentFilter = filter;
    
    // Atualizar visual dos tabs
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    event?.target?.classList.add('active') || 
    document.querySelector(`[onclick="filterOrders('${filter}')"]`)?.classList.add('active');
    
    // Filtrar pedidos
    if (filter === 'all') {
        filteredOrders = [...allOrders];
    } else {
        filteredOrders = allOrders.filter(order => order.status === filter);
    }
    
    // Atualizar contador
    updateOrdersCount();
    
    // Renderizar pedidos
    renderOrders();
}

function filterOrders(filter) {
    applyFilter(filter);
}

function updateOrdersCount() {
    const countElement = document.getElementById('ordersCount');
    countElement.textContent = `(${filteredOrders.length})`;
}

function renderOrders() {
    const ordersList = document.getElementById('ordersList');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredOrders.length === 0) {
        ordersList.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    ordersList.style.display = 'flex';
    emptyState.style.display = 'none';
    
    ordersList.innerHTML = filteredOrders.map(order => `
        <div class="order-card" onclick="showOrderDetails('${order.id}')">
            <div class="order-header">
                <div>
                    <div class="order-id">#${order.id}</div>
                    <div class="order-date">${formatDate(order.date)} às ${order.time}</div>
                </div>
                <div class="order-status status-${order.status}">
                    ${order.statusText}
                </div>
            </div>
            
            <div class="order-route">
                <div class="route-item">
                    <span class="route-icon">📍</span>
                    <span class="route-address">${order.origem}</span>
                </div>
                <div class="route-item">
                    <span class="route-icon">📍</span>
                    <span class="route-address">${order.destino}</span>
                </div>
            </div>
            
            <div class="order-actions">
                ${order.status === 'in-progress' ? `
                    <button class="action-btn btn-track" onclick="event.stopPropagation(); trackOrder('${order.id}')">
                        📍 Rastrear
                    </button>
                ` : ''}
                
                <button class="action-btn btn-details" onclick="event.stopPropagation(); showOrderDetails('${order.id}')">
                    📄 Detalhes
                </button>
                
                ${order.motoboy ? `
                    <button class="action-btn btn-contact" onclick="event.stopPropagation(); contactMotoboy('${order.motoboyPhone}')">
                        📞 Contato
                    </button>
                ` : ''}
                
                ${order.status === 'pending' ? `
                    <button class="action-btn btn-cancel" onclick="event.stopPropagation(); cancelOrder('${order.id}')">
                        ❌ Cancelar
                    </button>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function searchOrders() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    
    if (!searchTerm) {
        filteredOrders = allOrders.filter(order => 
            currentFilter === 'all' || order.status === currentFilter
        );
    } else {
        filteredOrders = allOrders.filter(order => {
            const matchesSearch = 
                order.id.toLowerCase().includes(searchTerm) ||
                order.origem.toLowerCase().includes(searchTerm) ||
                order.destino.toLowerCase().includes(searchTerm) ||
                order.description.toLowerCase().includes(searchTerm);
            
            const matchesFilter = 
                currentFilter === 'all' || order.status === currentFilter;
            
            return matchesSearch && matchesFilter;
        });
    }
    
    updateOrdersCount();
    renderOrders();
}

function refreshOrders() {
    const refreshBtn = document.querySelector('.refresh-btn');
    refreshBtn.style.transform = 'rotate(360deg)';
    
    showNotification('Atualizando pedidos...', 'info');
    
    setTimeout(() => {
        loadOrders();
        refreshBtn.style.transform = 'rotate(0deg)';
        showNotification('Pedidos atualizados!', 'success');
    }, 1000);
}

function showOrderDetails(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('orderModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `Pedido #${order.id}`;
    
    modalBody.innerHTML = `
        <div class="order-details">
            <div class="detail-section">
                <h3>📋 Informações Gerais</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Status:</strong>
                        <span class="order-status status-${order.status}">${order.statusText}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Data/Hora:</strong> ${formatDate(order.date)} às ${order.time}
                    </div>
                    <div class="detail-item">
                        <strong>Descrição:</strong> ${order.description}
                    </div>
                    <div class="detail-item">
                        <strong>Valor:</strong> ${order.price}
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>📍 Rota</h3>
                <div class="route-details">
                    <div class="route-point">
                        <div class="route-icon">🟢</div>
                        <div>
                            <strong>Origem:</strong><br>
                            ${order.origem}
                        </div>
                    </div>
                    <div class="route-point">
                        <div class="route-icon">🔴</div>
                        <div>
                            <strong>Destino:</strong><br>
                            ${order.destino}
                        </div>
                    </div>
                </div>
            </div>
            
            ${order.motoboy ? `
                <div class="detail-section">
                    <h3>🏍️ Motoboy</h3>
                    <div class="motoboy-info">
                        <div class="detail-item">
                            <strong>Nome:</strong> ${order.motoboy}
                        </div>
                        <div class="detail-item">
                            <strong>Telefone:</strong> 
                            <a href="tel:${order.motoboyPhone}">${order.motoboyPhone}</a>
                        </div>
                        <div class="detail-item">
                            <strong>Previsão:</strong> ${order.estimatedTime}
                        </div>
                        ${order.currentLocation ? `
                            <div class="detail-item">
                                <strong>Localização atual:</strong> ${order.currentLocation}
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            <div class="detail-actions">
                ${order.status === 'in-progress' ? `
                    <button class="action-btn btn-track" onclick="trackOrder('${order.id}')">
                        📍 Rastrear em Tempo Real
                    </button>
                ` : ''}
                
                ${order.motoboy ? `
                    <button class="action-btn btn-contact" onclick="contactMotoboy('${order.motoboyPhone}')">
                        📞 Ligar para Motoboy
                    </button>
                ` : ''}
                
                <button class="action-btn btn-details" onclick="downloadReceipt('${order.id}')">
                    📥 Baixar Comprovante
                </button>
                
                ${order.status === 'pending' ? `
                    <button class="action-btn btn-cancel" onclick="cancelOrder('${order.id}')">
                        ❌ Cancelar Pedido
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function trackOrder(orderId) {
    const order = allOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('trackingModal');
    const trackingInfo = document.getElementById('trackingInfo');
    
    // Simular dados de rastreamento
    const trackingSteps = [
        { title: 'Pedido confirmado', time: '14:00', completed: true },
        { title: 'Motoboy designado', time: '14:10', completed: true },
        { title: 'Saiu para coleta', time: '14:15', completed: true },
        { title: 'Item coletado', time: '14:25', completed: true },
        { title: 'Em trânsito', time: '14:30', completed: true, current: true },
        { title: 'Entregue', time: 'Previsão: 14:45', completed: false }
    ];
    
    trackingInfo.innerHTML = `
        <div class="tracking-header">
            <h3>📦 Pedido #${orderId}</h3>
            <p>Motoboy: ${order.motoboy || 'Aguardando designação'}</p>
            ${order.currentLocation ? `<p>📍 ${order.currentLocation}</p>` : ''}
        </div>
        
        <div class="tracking-timeline">
            ${trackingSteps.map(step => `
                <div class="tracking-step">
                    <div class="step-icon ${step.completed ? 'step-completed' : step.current ? 'step-current' : 'step-pending'}">
                        ${step.completed ? '✓' : step.current ? '📍' : '○'}
                    </div>
                    <div class="step-details">
                        <div class="step-title">${step.title}</div>
                        <div class="step-time">${step.time}</div>
                    </div>
                </div>
            `).join('')}
        </div>
        
        ${order.status === 'in-progress' ? `
            <div class="live-tracking">
                <p><strong>🔄 Atualizando localização a cada 30 segundos</strong></p>
                <button onclick="updateLocation('${orderId}')" class="action-btn btn-track">
                    Atualizar Agora
                </button>
            </div>
        ` : ''}
    `;
    
    modal.style.display = 'block';
}

function contactMotoboy(phone) {
    if (confirm(`Deseja ligar para o motoboy?\n\n${phone}`)) {
        window.open(`tel:${phone}`);
    }
}

function cancelOrder(orderId) {
    if (confirm('Tem certeza que deseja cancelar este pedido?\n\nEsta ação não pode ser desfeita.')) {
        showNotification('Cancelando pedido...', 'info');
        
        // Simular cancelamento (substitua pela chamada real à API)
        setTimeout(() => {
            const orderIndex = allOrders.findIndex(o => o.id === orderId);
            if (orderIndex !== -1) {
                allOrders[orderIndex].status = 'cancelled';
                allOrders[orderIndex].statusText = 'Cancelado';
            }
            
            applyFilter(currentFilter);
            closeModal();
            showNotification('Pedido cancelado com sucesso!', 'success');
        }, 1500);
    }
}

function downloadReceipt(orderId) {
    showNotification('Gerando comprovante...', 'info');
    
    // Simular download (substitua pela lógica real)
    setTimeout(() => {
        showNotification('Comprovante baixado para Downloads!', 'success');
    }, 1000);
}

function updateLocation(orderId) {
    showNotification('Atualizando localização...', 'info');
    
    // Simular atualização (substitua pela chamada real à API)
    setTimeout(() => {
        showNotification('Localização atualizada!', 'success');
        // Recarregar o rastreamento com dados atualizados
        trackOrder(orderId);
    }, 1000);
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function setupEventListeners() {
    // Busca em tempo real
    const searchInput = document.getElementById('searchInput');
    searchInput.addEventListener('input', debounce(searchOrders, 300));
    
    // Enter na busca
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchOrders();
        }
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
    
    // ESC para fechar modal
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}

// Utilitários
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Hoje';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Ontem';
    } else {
        return date.toLocaleDateString('pt-BR');
    }
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function showNotification(message, type = 'info') {
    // Remover notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Criar nova notificação
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const colors = {
        success: '#27ae60',
        error: '#e74c3c',
        warning: '#f39c12',
        info: '#3498db'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        background: ${colors[type]};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            margin-left: auto;
        ">×</button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Adicionar estilos CSS dinamicamente
const dynamicStyles = document.createElement('style');
dynamicStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .order-details {
        color: #fff;
    }
    
    .detail-section {
        margin-bottom: 25px;
        padding-bottom: 20px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .detail-section:last-child {
        border-bottom: none;
        margin-bottom: 0;
        padding-bottom: 0;
    }
    
    .detail-section h3 {
        margin-bottom: 15px;
        color: #3498db;
        font-size: 1.1rem;
    }
    
    .detail-grid {
        display: grid;
        gap: 12px;
    }
    
    .detail-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
    }
    
    .detail-item strong {
        color: #fff;
        min-width: 120px;
    }
    
    .route-details {
        display: flex;
        flex-direction: column;
        gap: 15px;
    }
    
    .route-point {
        display: flex;
        align-items: flex-start;
        gap: 15px;
    }
    
    .route-point .route-icon {
        font-size: 1.2rem;
        margin-top: 2px;
    }
    
    .motoboy-info {
        background: rgba(255,255,255,0.1);
        padding: 15px;
        border-radius: 8px;
    }
    
    .detail-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 20px;
        padding-top: 20px;
        border-top: 1px solid rgba(255,255,255,0.1);
    }
    
    .tracking-header {
        margin-bottom: 20px;
        text-align: center;
    }
    
    .tracking-header h3 {
        color: #3498db;
        margin-bottom: 10px;
    }
    
    .tracking-timeline {
        margin-bottom: 20px;
    }
    
    .live-tracking {
        background: rgba(52, 152, 219, 0.1);
        padding: 15px;
        border-radius: 8px;
        text-align: center;
        border: 1px solid rgba(52, 152, 219, 0.3);
    }
    
    @media (max-width: 480px) {
        .detail-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 5px;
        }
        
        .detail-actions {
            flex-direction: column;
        }
        
        .detail-actions .action-btn {
            width: 100%;
        }
    }
`;

document.head.appendChild(dynamicStyles);