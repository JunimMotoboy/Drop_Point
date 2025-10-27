// Dados simulados do motoboy
let motoboyData = {
    profile: {
        name: 'João Silva',
        avatar: '../img/motoboy-avatar.png',
        rating: 4.8,
        totalDeliveries: 1247,
        memberSince: '2023-01-15'
    },
    status: {
        isOnline: false,
        currentDelivery: null,
        workStartTime: null,
        dailyEarnings: 0,
        todayDeliveries: 0,
        todayDistance: 0
    },
    stats: {
        completionRate: 98.5,
        avgDeliveryTime: 25,
        customerRating: 4.8,
        weeklyEarnings: 580.50
    },
    availableDeliveries: [
        {
            id: 'DEL001',
            type: 'expressa',
            pickup: 'Shopping Villa Lobos',
            delivery: 'Rua Augusta, 1234',
            distance: 8.5,
            payment: 22.50,
            estimatedTime: 30,
            customer: 'Maria Santos',
            items: 'Eletrônicos - 1 item',
            urgency: 'alta'
        },
        {
            id: 'DEL002',
            type: 'normal',
            pickup: 'Mercado Central',
            delivery: 'Vila Madalena',
            distance: 5.2,
            payment: 15.00,
            estimatedTime: 25,
            customer: 'Pedro Oliveira',
            items: 'Documentos',
            urgency: 'normal'
        },
        {
            id: 'DEL003',
            type: 'ultra',
            pickup: 'Farmácia São João',
            delivery: 'Av. Paulista, 2000',
            distance: 12.8,
            payment: 35.00,
            estimatedTime: 45,
            customer: 'Ana Costa',
            items: 'Medicamentos',
            urgency: 'urgente'
        }
    ],
    notifications: [
        {
            id: 1,
            type: 'delivery',
            title: 'Nova entrega disponível',
            message: 'Entrega expressa de R$ 22,50 - Shopping Villa Lobos',
            time: '2 min atrás',
            unread: true
        },
        {
            id: 2,
            type: 'earning',
            title: 'Pagamento processado',
            message: 'Seus ganhos de ontem (R$ 85,50) foram creditados',
            time: '1 hora atrás',
            unread: true
        },
        {
            id: 3,
            type: 'rating',
            title: 'Nova avaliação',
            message: 'Cliente avaliou sua entrega com 5 estrelas!',
            time: '3 horas atrás',
            unread: false
        }
    ]
};

// Estado da aplicação
let appState = {
    workTimer: null,
    workStartTime: null,
    isProfileMenuOpen: false,
    isNotificationPanelOpen: false,
    selectedDelivery: null
};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeDashboard();
    loadMotoboyData();
    setupEventListeners();
    startDataUpdates();
});

// Inicializar dashboard
function initializeDashboard() {
    // Carregar dados salvos
    const savedData = localStorage.getItem('motoboyData');
    if (savedData) {
        motoboyData = { ...motoboyData, ...JSON.parse(savedData) };
    }
    
    // Carregar dados do login
    const motoboyName = localStorage.getItem('motoboyName');
    if (motoboyName) {
        motoboyData.profile.name = motoboyName;
    }
    
    updateWelcomeMessage();
}

// Carregar dados do motoboy na interface
function loadMotoboyData() {
    // Profile info
    document.getElementById('profileName').textContent = motoboyData.profile.name;
    document.getElementById('welcomeMessage').textContent = `Bem-vindo, ${motoboyData.profile.name.split(' ')[0]}!`;
    
    // Status
    updateWorkStatus();
    
    // Stats
    updateQuickStats();
    
    // Available deliveries
    renderAvailableDeliveries();
    
    // Notifications
    renderNotifications();
    updateNotificationBadge();
    
    // Current delivery
    updateCurrentDelivery();
}

// Configurar event listeners
function setupEventListeners() {
    // Work status toggle
    const workToggle = document.getElementById('workStatusToggle');
    workToggle.addEventListener('change', toggleWorkStatus);
    
    // Filters
    document.getElementById('distanceFilter').addEventListener('change', filterDeliveries);
    document.getElementById('urgencyFilter').addEventListener('change', filterDeliveries);
    
    // Click outside to close dropdowns
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.profile-menu')) {
            closeProfileMenu();
        }
        if (!e.target.closest('.notification-panel') && !e.target.closest('.notification-btn')) {
            closeNotificationPanel();
        }
    });
}

// Atualizar mensagem de boas-vindas baseada no horário
function updateWelcomeMessage() {
    const hour = new Date().getHours();
    let greeting;
    
    if (hour < 12) {
        greeting = 'Bom dia';
    } else if (hour < 18) {
        greeting = 'Boa tarde';
    } else {
        greeting = 'Boa noite';
    }
    
    document.getElementById('welcomeMessage').textContent = `${greeting}, ${motoboyData.profile.name.split(' ')[0]}!`;
}

// Toggle work status
function toggleWorkStatus() {
    const isChecked = document.getElementById('workStatusToggle').checked;
    
    if (isChecked) {
        startWorkSession();
    } else {
        endWorkSession();
    }
    
    updateWorkStatus();
    saveMotoboyData();
}

function startWorkSession() {
    motoboyData.status.isOnline = true;
    motoboyData.status.workStartTime = new Date().toISOString();
    appState.workStartTime = new Date();
    
    // Iniciar timer
    startWorkTimer();
    
    showNotification('Você está online! Pronto para receber entregas.', 'success');
    
    // Simular nova entrega disponível após ficar online
    setTimeout(() => {
        addNewAvailableDelivery();
    }, 3000);
}

function endWorkSession() {
    motoboyData.status.isOnline = false;
    motoboyData.status.workStartTime = null;
    appState.workStartTime = null;
    
    // Parar timer
    stopWorkTimer();
    
    const earnings = motoboyData.status.dailyEarnings;
    const deliveries = motoboyData.status.todayDeliveries;
    
    showNotification(`Sessão finalizada! Você fez ${deliveries} entregas e ganhou R$ ${earnings.toFixed(2)} hoje.`, 'info');
}

// Work timer functions
function startWorkTimer() {
    if (appState.workTimer) {
        clearInterval(appState.workTimer);
    }
    
    appState.workTimer = setInterval(updateWorkTimer, 1000);
    document.getElementById('workTimer').style.display = 'block';
}

function stopWorkTimer() {
    if (appState.workTimer) {
        clearInterval(appState.workTimer);
        appState.workTimer = null;
    }
    document.getElementById('workTimer').style.display = 'none';
}

function updateWorkTimer() {
    if (!appState.workStartTime) return;
    
    const now = new Date();
    const diff = now - appState.workStartTime;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    const timeText = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('timerText').textContent = timeText;
}

// Atualizar status de trabalho
function updateWorkStatus() {
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    const statusTitle = document.getElementById('statusTitle');
    const statusDesc = document.getElementById('statusDesc');
    const workToggle = document.getElementById('workStatusToggle');
    
    if (motoboyData.status.isOnline) {
        statusDot.className = 'status-dot online';
        statusText.textContent = 'Online';
        statusTitle.textContent = 'Você está Online';
        statusDesc.textContent = 'Recebendo pedidos automaticamente';
        workToggle.checked = true;
        
        if (motoboyData.status.workStartTime && !appState.workStartTime) {
            appState.workStartTime = new Date(motoboyData.status.workStartTime);
            startWorkTimer();
        }
    } else {
        statusDot.className = 'status-dot offline';
        statusText.textContent = 'Offline';
        statusTitle.textContent = 'Ficar Online';
        statusDesc.textContent = 'Ativar para receber pedidos';
        workToggle.checked = false;
        stopWorkTimer();
    }
}

// Atualizar estatísticas rápidas
function updateQuickStats() {
    document.getElementById('totalDeliveries').textContent = motoboyData.status.todayDeliveries;
    document.getElementById('averageRating').textContent = motoboyData.stats.customerRating.toFixed(1);
    document.getElementById('completionRate').textContent = motoboyData.stats.completionRate.toFixed(0) + '%';
    document.getElementById('totalDistance').textContent = motoboyData.status.todayDistance.toFixed(1) + 'km';
    document.getElementById('dailyEarnings').textContent = `R$ ${motoboyData.status.dailyEarnings.toFixed(2)}`;
    document.getElementById('todayEarnings').textContent = `R$ ${motoboyData.status.dailyEarnings.toFixed(2)}`;
}

// Renderizar entregas disponíveis
function renderAvailableDeliveries() {
    const container = document.getElementById('deliveriesList');
    
    if (motoboyData.availableDeliveries.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📦</div>
                <h3>Nenhuma entrega disponível</h3>
                <p>Novas entregas aparecerão aqui quando você estiver online</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = motoboyData.availableDeliveries.map(delivery => `
        <div class="delivery-item" onclick="openDeliveryDetails('${delivery.id}')">
            <div class="delivery-item-header">
                <div class="delivery-type">
                    <span class="type-badge ${delivery.type}">${getTypeLabel(delivery.type)}</span>
                    <span class="payment-amount">R$ ${delivery.payment.toFixed(2)}</span>
                </div>
                <div class="delivery-distance">${delivery.distance}km</div>
            </div>
            <div class="delivery-route">
                <div class="route-point pickup">
                    <span class="route-icon">📍</span>
                    <span class="route-text">${delivery.pickup}</span>
                </div>
                <div class="route-arrow">→</div>
                <div class="route-point delivery">
                    <span class="route-icon">🏠</span>
                    <span class="route-text">${delivery.delivery}</span>
                </div>
            </div>
            <div class="delivery-details-preview">
                <div class="detail-item">
                    <span class="detail-icon">👤</span>
                    <span>${delivery.customer}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">📦</span>
                    <span>${delivery.items}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-icon">⏱️</span>
                    <span>~${delivery.estimatedTime} min</span>
                </div>
            </div>
            <div class="delivery-actions-preview">
                <button class="quick-accept-btn" onclick="event.stopPropagation(); quickAcceptDelivery('${delivery.id}')">
                    ⚡ Aceitar Rápido
                </button>
            </div>
        </div>
    `).join('');
}

function getTypeLabel(type) {
    const labels = {
        'ultra': 'Ultra Rápida',
        'expressa': 'Expressa',
        'normal': 'Normal',
        'economica': 'Econômica'
    };
    return labels[type] || type;
}

// Filtrar entregas
function filterDeliveries() {
    const distanceFilter = document.getElementById('distanceFilter').value;
    const urgencyFilter = document.getElementById('urgencyFilter').value;
    
    let filtered = [...motoboyData.availableDeliveries];
    
    if (distanceFilter !== 'all') {
        filtered = filtered.filter(delivery => {
            switch (distanceFilter) {
                case 'near': return delivery.distance <= 5;
                case 'medium': return delivery.distance > 5 && delivery.distance <= 15;
                case 'far': return delivery.distance > 15;
                default: return true;
            }
        });
    }
    
    if (urgencyFilter !== 'all') {
        filtered = filtered.filter(delivery => delivery.type === urgencyFilter);
    }
    
    renderFilteredDeliveries(filtered);
}

function renderFilteredDeliveries(deliveries) {
    const originalDeliveries = motoboyData.availableDeliveries;
    motoboyData.availableDeliveries = deliveries;
    renderAvailableDeliveries();
    motoboyData.availableDeliveries = originalDeliveries;
}

// Abrir detalhes da entrega
function openDeliveryDetails(deliveryId) {
    const delivery = motoboyData.availableDeliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    
    appState.selectedDelivery = delivery;
    
    const modal = document.getElementById('deliveryModal');
    const content = document.getElementById('deliveryModalContent');
    
    content.innerHTML = `
        <div class="delivery-details-full">
            <div class="delivery-header-full">
                <div class="delivery-type-full">
                    <span class="type-badge-large ${delivery.type}">${getTypeLabel(delivery.type)}</span>
                    <div class="payment-info">
                        <span class="payment-large">R$ ${delivery.payment.toFixed(2)}</span>
                        <span class="payment-per-km">R$ ${(delivery.payment / delivery.distance).toFixed(2)}/km</span>
                    </div>
                </div>
                <div class="urgency-indicator ${delivery.urgency}">
                    ${delivery.urgency === 'urgente' ? '🚨' : delivery.urgency === 'alta' ? '⚡' : '⏰'} 
                    ${delivery.urgency.charAt(0).toUpperCase() + delivery.urgency.slice(1)}
                </div>
            </div>
            
            <div class="route-details">
                <h4>📍 Rota de Entrega</h4>
                <div class="route-full">
                    <div class="route-step pickup">
                        <div class="step-icon">🏪</div>
                        <div class="step-info">
                            <div class="step-label">Retirada</div>
                            <div class="step-address">${delivery.pickup}</div>
                        </div>
                    </div>
                    <div class="route-line"></div>
                    <div class="route-step delivery">
                        <div class="step-icon">🏠</div>
                        <div class="step-info">
                            <div class="step-label">Entrega</div>
                            <div class="step-address">${delivery.delivery}</div>
                        </div>
                    </div>
                </div>
                <div class="route-stats">
                    <div class="stat">
                        <span class="stat-icon">📏</span>
                        <span class="stat-text">${delivery.distance}km</span>
                    </div>
                    <div class="stat">
                        <span class="stat-icon">⏱️</span>
                        <span class="stat-text">~${delivery.estimatedTime} min</span>
                    </div>
                    <div class="stat">
                        <span class="stat-icon">⛽</span>
                        <span class="stat-text">~R$ ${(delivery.distance * 0.3).toFixed(2)} combustível</span>
                    </div>
                </div>
            </div>
            
            <div class="customer-info">
                <h4>👤 Informações do Cliente</h4>
                <div class="customer-details">
                    <div class="customer-item">
                        <span class="customer-label">Nome:</span>
                        <span class="customer-value">${delivery.customer}</span>
                    </div>
                    <div class="customer-item">
                        <span class="customer-label">Itens:</span>
                        <span class="customer-value">${delivery.items}</span>
                    </div>
                    <div class="customer-item">
                        <span class="customer-label">Observações:</span>
                        <span class="customer-value">Entregar até às 18h, portão azul</span>
                    </div>
                </div>
            </div>
            
            <div class="estimated-earnings">
                <h4>💰 Ganhos Estimados</h4>
                <div class="earnings-breakdown">
                    <div class="earning-item">
                        <span>Valor base:</span>
                        <span>R$ ${delivery.payment.toFixed(2)}</span>
                    </div>
                    <div class="earning-item">
                        <span>Combustível estimado:</span>
                        <span class="negative">-R$ ${(delivery.distance * 0.3).toFixed(2)}</span>
                    </div>
                    <div class="earning-item total">
                        <span>Lucro líquido:</span>
                        <span>R$ ${(delivery.payment - (delivery.distance * 0.3)).toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    modal.style.display = 'block';
}

function closeDeliveryModal() {
    document.getElementById('deliveryModal').style.display = 'none';
    appState.selectedDelivery = null;
}

// Aceitar entrega
function acceptDelivery() {
    if (!appState.selectedDelivery) return;
    
    const delivery = appState.selectedDelivery;
    
    // Remover das disponíveis
    motoboyData.availableDeliveries = motoboyData.availableDeliveries.filter(d => d.id !== delivery.id);
    
    // Definir como entrega atual
    motoboyData.status.currentDelivery = {
        ...delivery,
        startTime: new Date().toISOString(),
        status: 'pickup'
    };
    
    closeDeliveryModal();
    updateCurrentDelivery();
    renderAvailableDeliveries();
    saveMotoboyData();
    
    showNotification(`Entrega ${delivery.id} aceita! Dirija-se ao local de retirada.`, 'success');
    
    // Simular chegada ao local de retirada após um tempo
    setTimeout(() => {
        if (motoboyData.status.currentDelivery && motoboyData.status.currentDelivery.id === delivery.id) {
            updateDeliveryStatus('delivery');
        }
    }, 10000);
}

function quickAcceptDelivery(deliveryId) {
    const delivery = motoboyData.availableDeliveries.find(d => d.id === deliveryId);
    if (!delivery) return;
    
    appState.selectedDelivery = delivery;
    acceptDelivery();
}

// Atualizar entrega atual
function updateCurrentDelivery() {
    const section = document.getElementById('currentDeliverySection');
    const details = document.getElementById('currentDeliveryDetails');
    
    if (!motoboyData.status.currentDelivery) {
        section.style.display = 'none';
        return;
    }
    
    section.style.display = 'block';
    const delivery = motoboyData.status.currentDelivery;
    
    details.innerHTML = `
        <div class="current-delivery-info">
            <div class="delivery-id">Entrega #${delivery.id}</div>
            <div class="delivery-customer">
                <span class="customer-icon">👤</span>
                <span>${delivery.customer}</span>
            </div>
            <div class="delivery-route-current">
                <div class="route-step ${delivery.status === 'pickup' ? 'active' : 'completed'}">
                    <span class="route-icon">📍</span>
                    <span class="route-text">${delivery.pickup}</span>
                </div>
                <div class="route-arrow">→</div>
                <div class="route-step ${delivery.status === 'delivery' ? 'active' : ''}">
                    <span class="route-icon">🏠</span>
                    <span class="route-text">${delivery.delivery}</span>
                </div>
            </div>
            <div class="delivery-progress">
                <div class="progress-info">
                    <span>Status: ${getStatusLabel(delivery.status)}</span>
                    <span>Pagamento: R$ ${delivery.payment.toFixed(2)}</span>
                </div>
            </div>
        </div>
    `;
    
    // Atualizar botão de completar
    const completeBtn = document.getElementById('completeBtn');
    if (delivery.status === 'pickup') {
        completeBtn.textContent = '📦 Item Coletado';
        completeBtn.onclick = () => updateDeliveryStatus('delivery');
    } else {
        completeBtn.textContent = '✅ Finalizar Entrega';
        completeBtn.onclick = () => completeDelivery();
    }
}

function getStatusLabel(status) {
    const labels = {
        'pickup': 'Coletando item',
        'delivery': 'Em rota de entrega'
    };
    return labels[status] || status;
}

function updateDeliveryStatus(newStatus) {
    if (motoboyData.status.currentDelivery) {
        motoboyData.status.currentDelivery.status = newStatus;
        updateCurrentDelivery();
        saveMotoboyData();
        
        if (newStatus === 'delivery') {
            showNotification('Item coletado! Dirija-se ao endereço de entrega.', 'info');
        }
    }
}

// Completar entrega
function completeDelivery() {
    if (!motoboyData.status.currentDelivery) return;
    
    const delivery = motoboyData.status.currentDelivery;
    
    // Atualizar estatísticas
    motoboyData.status.dailyEarnings += delivery.payment;
    motoboyData.status.todayDeliveries += 1;
    motoboyData.status.todayDistance += delivery.distance;
    
    // Limpar entrega atual
    motoboyData.status.currentDelivery = null;
    
    // Atualizar interface
    updateCurrentDelivery();
    updateQuickStats();
    saveMotoboyData();
    
    showNotification(`Entrega concluída! Você ganhou R$ ${delivery.payment.toFixed(2)}`, 'success');
    
    // Adicionar nova notificação
    addNotification({
        type: 'earning',
        title: 'Entrega concluída',
        message: `Parabéns! Você ganhou R$ ${delivery.payment.toFixed(2)} na entrega #${delivery.id}`,
        time: 'agora',
        unread: true
    });
    
    // Simular nova entrega disponível
    setTimeout(() => {
        addNewAvailableDelivery();
    }, 5000);
}

// Adicionar nova entrega disponível
function addNewAvailableDelivery() {
    const newDelivery = generateRandomDelivery();
    motoboyData.availableDeliveries.push(newDelivery);
    renderAvailableDeliveries();
    
    addNotification({
        type: 'delivery',
        title: 'Nova entrega disponível',
        message: `${getTypeLabel(newDelivery.type)} - R$ ${newDelivery.payment.toFixed(2)} - ${newDelivery.distance}km`,
        time: 'agora',
        unread: true
    });
    
    saveMotoboyData();
}

function generateRandomDelivery() {
    const types = ['normal', 'expressa', 'ultra'];
    const pickups = ['Shopping Center', 'Restaurante Central', 'Farmácia São Paulo', 'Loja de Eletrônicos', 'Mercado Local'];
    const deliveries = ['Vila Madalena', 'Pinheiros', 'Itaim Bibi', 'Jardins', 'Centro'];
    const customers = ['Ana Silva', 'Carlos Santos', 'Maria Oliveira', 'João Costa', 'Lucia Ferreira'];
    const items = ['Documentos', 'Medicamentos', 'Eletrônicos - 1 item', 'Roupas - 2 itens', 'Alimentos'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const distance = Math.random() * 20 + 2;
    let payment = 12 + (distance * 1.2);
    
    if (type === 'expressa') payment *= 1.5;
    if (type === 'ultra') payment *= 2.2;
    
    return {
        id: 'DEL' + Math.random().toString(36).substr(2, 6).toUpperCase(),
        type,
        pickup: pickups[Math.floor(Math.random() * pickups.length)],
        delivery: deliveries[Math.floor(Math.random() * deliveries.length)],
        distance: Math.round(distance * 10) / 10,
        payment: Math.round(payment * 100) / 100,
        estimatedTime: Math.round(distance * 2 + 10),
        customer: customers[Math.floor(Math.random() * customers.length)],
        items: items[Math.floor(Math.random() * items.length)],
        urgency: type === 'ultra' ? 'urgente' : type === 'expressa' ? 'alta' : 'normal'
    };
}

// Funções de ação rápida
function openDeliveryMap() {
    const currentDelivery = getCurrentDelivery();
    
    if (!currentDelivery) {
        showNotification('Nenhuma entrega em andamento para abrir rota', 'warning');
        return;
    }
    
    // Coordenadas simuladas (em uma implementação real, viria do banco de dados)
    const addresses = {
        'Rua das Flores, 123 - Centro': {
            lat: -23.5505,
            lng: -46.6333,
            address: 'Rua das Flores, 123 - Centro, São Paulo - SP'
        },
        'Av. Paulista, 456 - Bela Vista': {
            lat: -23.5618,
            lng: -46.6565,
            address: 'Av. Paulista, 456 - Bela Vista, São Paulo - SP'
        },
        'Rua Augusta, 789 - Consolação': {
            lat: -23.5576,
            lng: -46.6624,
            address: 'Rua Augusta, 789 - Consolação, São Paulo - SP'
        },
        'Rua Oscar Freire, 321 - Jardins': {
            lat: -23.5614,
            lng: -46.6692,
            address: 'Rua Oscar Freire, 321 - Jardins, São Paulo - SP'
        },
        'Av. Faria Lima, 654 - Itaim Bibi': {
            lat: -23.5707,
            lng: -46.6937,
            address: 'Av. Faria Lima, 654 - Itaim Bibi, São Paulo - SP'
        }
    };
    
    const destinationCoords = addresses[currentDelivery.address] || {
        lat: -23.5505,
        lng: -46.6333,
        address: currentDelivery.address
    };
    
    // Mostrar modal de seleção de aplicativo de navegação
    showNavigationModal(destinationCoords);
}

function getCurrentDelivery() {
    // Simular entrega atual (em uma implementação real, seria obtida do estado)
    const deliveries = [
        {
            id: 'DEL001',
            address: 'Rua das Flores, 123 - Centro',
            customer: 'Maria Silva',
            phone: '(11) 99999-1234',
            value: 35.50
        },
        {
            id: 'DEL002', 
            address: 'Av. Paulista, 456 - Bela Vista',
            customer: 'João Santos',
            phone: '(11) 99999-5678',
            value: 42.00
        }
    ];
    
    // Retornar primeira entrega como exemplo
    return deliveries[0];
}

function showNavigationModal(destination) {
    // Remover modal existente se houver
    const existingModal = document.getElementById('navigationModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    const modal = document.createElement('div');
    modal.id = 'navigationModal';
    modal.className = 'modal-overlay';
    modal.innerHTML = `
        <div class="modal-content navigation-modal">
            <div class="modal-header">
                <h3>📍 Escolha o Aplicativo de Navegação</h3>
                <button class="modal-close" onclick="closeNavigationModal()">×</button>
            </div>
            
            <div class="destination-info">
                <h4>📍 Destino:</h4>
                <p>${destination.address}</p>
                <small>Lat: ${destination.lat}, Lng: ${destination.lng}</small>
            </div>
            
            <div class="navigation-options">
                <button class="nav-option google-maps" onclick="openGoogleMaps(${destination.lat}, ${destination.lng}, '${destination.address}')">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234285F4'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E" alt="Google Maps">
                    <div>
                        <span class="app-name">Google Maps</span>
                        <span class="app-desc">Navegação completa</span>
                    </div>
                </button>
                
                <button class="nav-option waze" onclick="openWaze(${destination.lat}, ${destination.lng})">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%2300d4ff'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E" alt="Waze">
                    <div>
                        <span class="app-name">Waze</span>
                        <span class="app-desc">Trânsito em tempo real</span>
                    </div>
                </button>
                
                <button class="nav-option uber" onclick="openUberNavigator(${destination.lat}, ${destination.lng})">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23000'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E" alt="Uber Navigator">
                    <div>
                        <span class="app-name">Uber Navigator</span>
                        <span class="app-desc">Para entregadores</span>
                    </div>
                </button>
                
                <button class="nav-option browser" onclick="openBrowserMap(${destination.lat}, ${destination.lng}, '${destination.address}')">
                    <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z'/%3E%3C/svg%3E" alt="Navegador">
                    <div>
                        <span class="app-name">Abrir no Navegador</span>
                        <span class="app-desc">Google Maps Web</span>
                    </div>
                </button>
            </div>
            
            <div class="modal-footer">
                <button class="btn-cancel" onclick="closeNavigationModal()">Cancelar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Animar entrada
    setTimeout(() => {
        modal.classList.add('show');
    }, 10);
}

function closeNavigationModal() {
    const modal = document.getElementById('navigationModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

function openGoogleMaps(lat, lng, address) {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=&travelmode=driving`;
    
    // Tentar abrir o app primeiro, depois o navegador
    const mobileUrl = `comgooglemaps://?daddr=${lat},${lng}&directionsmode=driving`;
    
    if (isMobileDevice()) {
        // Tentar abrir o app nativo
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = mobileUrl;
        document.body.appendChild(iframe);
        
        // Se o app não abrir em 2 segundos, abrir no navegador
        setTimeout(() => {
            window.open(googleMapsUrl, '_blank');
            iframe.remove();
        }, 2000);
    } else {
        window.open(googleMapsUrl, '_blank');
    }
    
    closeNavigationModal();
    showNotification('Abrindo Google Maps...', 'success');
}

function openWaze(lat, lng) {
    const wazeUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    const mobileUrl = `waze://?ll=${lat},${lng}&navigate=yes`;
    
    if (isMobileDevice()) {
        const iframe = document.createElement('iframe');
        iframe.style.display = 'none';
        iframe.src = mobileUrl;
        document.body.appendChild(iframe);
        
        setTimeout(() => {
            window.open(wazeUrl, '_blank');
            iframe.remove();
        }, 2000);
    } else {
        window.open(wazeUrl, '_blank');
    }
    
    closeNavigationModal();
    showNotification('Abrindo Waze...', 'success');
}

function openUberNavigator(lat, lng) {
    const uberUrl = `uber://?action=setPickup&pickup=my_location&dropoff[latitude]=${lat}&dropoff[longitude]=${lng}`;
    
    if (isMobileDevice()) {
        window.location.href = uberUrl;
    } else {
        showNotification('Uber Navigator disponível apenas em dispositivos móveis', 'warning');
        return;
    }
    
    closeNavigationModal();
    showNotification('Abrindo Uber Navigator...', 'success');
}

function openBrowserMap(lat, lng, address) {
    const encodedAddress = encodeURIComponent(address);
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
    
    window.open(googleMapsUrl, '_blank');
    closeNavigationModal();
    showNotification('Abrindo mapa no navegador...', 'success');
}

function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// ===============================
// SISTEMA DE CHAT EM TEMPO REAL
// ===============================

let chatMessages = [
    {
        id: 1,
        sender: 'client',
        message: 'Olá! Estou aguardando meu pedido.',
        time: new Date(Date.now() - 300000) // 5 min atrás
    },
    {
        id: 2,
        sender: 'motoboy',
        message: 'Oi! Já peguei seu pedido e estou a caminho!',
        time: new Date(Date.now() - 240000) // 4 min atrás
    },
    {
        id: 3,
        sender: 'client',
        message: 'Perfeito! Qual o tempo estimado?',
        time: new Date(Date.now() - 180000) // 3 min atrás
    }
];

let chatOpen = false;

function initializeChat() {
    renderChatMessages();
    simulateClientMessages();
    updateChatNotification();
}

function toggleChat() {
    const chatWidget = document.getElementById('chatWidget');
    const chatToggle = document.getElementById('chatToggle');
    
    chatOpen = !chatOpen;
    
    if (chatOpen) {
        chatWidget.classList.remove('closed');
        chatToggle.textContent = '➖';
        markMessagesAsRead();
    } else {
        chatWidget.classList.add('closed');
        chatToggle.textContent = '💬';
    }
}

function renderChatMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    if (!messagesContainer) return;
    
    messagesContainer.innerHTML = '';
    
    chatMessages.forEach(msg => {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${msg.sender === 'motoboy' ? 'sent' : 'received'}`;
        
        const timeStr = msg.time.toLocaleTimeString('pt-BR', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
        
        messageDiv.innerHTML = `
            <div>${msg.message}</div>
            <div class="message-time">${timeStr}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
    });
    
    // Scroll para a última mensagem
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    if (!input || !input.value.trim()) return;
    
    const message = {
        id: Date.now(),
        sender: 'motoboy',
        message: input.value.trim(),
        time: new Date()
    };
    
    chatMessages.push(message);
    input.value = '';
    
    renderChatMessages();
    showNotification('Mensagem enviada!', 'success');
    
    // Simular resposta do cliente após alguns segundos
    setTimeout(() => {
        simulateClientResponse();
    }, 2000 + Math.random() * 3000);
}

function sendQuickMessage(text) {
    const message = {
        id: Date.now(),
        sender: 'motoboy',
        message: text,
        time: new Date()
    };
    
    chatMessages.push(message);
    renderChatMessages();
    showNotification('Mensagem rápida enviada!', 'success');
}

function handleChatKeyPress(event) {
    if (event.key === 'Enter') {
        sendChatMessage();
    }
}

function simulateClientMessages() {
    setInterval(() => {
        if (Math.random() < 0.3) { // 30% chance a cada intervalo
            const responses = [
                'Ok, obrigado!',
                'Perfeito!',
                'Estou aguardando aqui',
                'Tudo bem, sem pressa',
                'Valeu!',
                'Estou no apartamento 201',
                'Pode deixar na portaria',
                'Estou descendo'
            ];
            
            const message = {
                id: Date.now(),
                sender: 'client',
                message: responses[Math.floor(Math.random() * responses.length)],
                time: new Date()
            };
            
            chatMessages.push(message);
            renderChatMessages();
            updateChatNotification();
            
            if (!chatOpen) {
                showNotification('Nova mensagem do cliente!', 'info');
            }
        }
    }, 30000); // A cada 30 segundos
}

function simulateClientResponse() {
    const responses = [
        'Obrigado pela informação!',
        'Perfeito!',
        'Ok, estou aguardando',
        'Entendido!',
        'Valeu!'
    ];
    
    const message = {
        id: Date.now(),
        sender: 'client',
        message: responses[Math.floor(Math.random() * responses.length)],
        time: new Date()
    };
    
    chatMessages.push(message);
    renderChatMessages();
    updateChatNotification();
}

function updateChatNotification() {
    const notification = document.getElementById('chatNotification');
    if (!notification) return;
    
    const unreadCount = chatMessages.filter(msg => 
        msg.sender === 'client' && !msg.read
    ).length;
    
    if (unreadCount > 0) {
        notification.textContent = unreadCount;
        notification.style.display = 'flex';
    } else {
        notification.style.display = 'none';
    }
}

function markMessagesAsRead() {
    chatMessages.forEach(msg => {
        if (msg.sender === 'client') {
            msg.read = true;
        }
    });
    updateChatNotification();
}

// ===============================
// SISTEMA DE AVALIAÇÃO BIDIRECIONAL
// ===============================

let currentRating = {
    customer: 0,
    location: 0,
    payment: 0,
    comments: '',
    tags: []
};

function openRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.style.display = 'flex';
        initializeRatingStars();
    }
}

function closeRatingModal() {
    const modal = document.getElementById('ratingModal');
    if (modal) {
        modal.style.display = 'none';
        resetRating();
    }
}

function initializeRatingStars() {
    const starGroups = document.querySelectorAll('.rating-stars');
    
    starGroups.forEach(group => {
        const stars = group.querySelectorAll('.star');
        const ratingType = group.dataset.rating;
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                setRating(ratingType, index + 1);
                updateStarDisplay(group, index + 1);
            });
            
            star.addEventListener('mouseover', () => {
                highlightStars(group, index + 1);
            });
        });
        
        group.addEventListener('mouseleave', () => {
            updateStarDisplay(group, currentRating[ratingType]);
        });
    });
    
    // Inicializar tags
    const tagButtons = document.querySelectorAll('.tag-btn');
    tagButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            toggleTag(btn.dataset.tag, btn);
        });
    });
}

function setRating(type, value) {
    currentRating[type] = value;
}

function updateStarDisplay(group, rating) {
    const stars = group.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function highlightStars(group, rating) {
    updateStarDisplay(group, rating);
}

function toggleTag(tag, button) {
    const index = currentRating.tags.indexOf(tag);
    
    if (index > -1) {
        currentRating.tags.splice(index, 1);
        button.classList.remove('active');
    } else {
        currentRating.tags.push(tag);
        button.classList.add('active');
    }
}

function submitRating() {
    // Capturar comentários
    const commentsTextarea = document.getElementById('ratingComments');
    if (commentsTextarea) {
        currentRating.comments = commentsTextarea.value;
    }
    
    // Validar se pelo menos uma avaliação foi feita
    if (currentRating.customer === 0 && currentRating.location === 0 && currentRating.payment === 0) {
        showNotification('Por favor, avalie pelo menos um aspecto da entrega', 'warning');
        return;
    }
    
    // Salvar avaliação
    saveRating(currentRating);
    
    showNotification('Avaliação enviada com sucesso!', 'success');
    closeRatingModal();
    
    // Atualizar estatísticas
    updateRatingStats();
}

function skipRating() {
    showNotification('Avaliação pulada', 'info');
    closeRatingModal();
}

function saveRating(rating) {
    const ratings = JSON.parse(localStorage.getItem('motoboyRatings') || '[]');
    
    const newRating = {
        ...rating,
        date: new Date().toISOString(),
        deliveryId: 'DEL' + Date.now()
    };
    
    ratings.push(newRating);
    localStorage.setItem('motoboyRatings', JSON.stringify(ratings));
}

function updateRatingStats() {
    const ratings = JSON.parse(localStorage.getItem('motoboyRatings') || '[]');
    
    if (ratings.length === 0) return;
    
    const avgCustomer = ratings.reduce((sum, r) => sum + r.customer, 0) / ratings.length;
    const avgLocation = ratings.reduce((sum, r) => sum + r.location, 0) / ratings.length;
    const avgPayment = ratings.reduce((sum, r) => sum + r.payment, 0) / ratings.length;
    
    // Atualizar display das estatísticas (implementar conforme necessário)
    console.log('Estatísticas de Avaliação:', {
        totalAvaliacoes: ratings.length,
        mediaCliente: avgCustomer.toFixed(1),
        mediaLocal: avgLocation.toFixed(1),
        mediaPagamento: avgPayment.toFixed(1)
    });
}

function resetRating() {
    currentRating = {
        customer: 0,
        location: 0,
        payment: 0,
        comments: '',
        tags: []
    };
    
    // Resetar interface
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
    });
    
    document.querySelectorAll('.tag-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const commentsTextarea = document.getElementById('ratingComments');
    if (commentsTextarea) {
        commentsTextarea.value = '';
    }
}

// ===============================
// SISTEMA DE COMPROVANTE FOTOGRÁFICO
// ===============================

let cameraStream = null;
let capturedPhotoBlob = null;

function openPhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.style.display = 'flex';
        initializeCamera();
    }
}

function closePhotoModal() {
    const modal = document.getElementById('photoModal');
    if (modal) {
        modal.style.display = 'none';
        stopCamera();
        resetPhotoCapture();
    }
}

async function initializeCamera() {
    try {
        const video = document.getElementById('cameraVideo');
        const preview = document.getElementById('photoPreview');
        
        if (!video) return;
        
        // Resetar preview
        preview.style.display = 'none';
        video.style.display = 'block';
        
        // Solicitar acesso à câmera
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: 'environment', // Câmera traseira preferencial
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        });
        
        video.srcObject = cameraStream;
        
    } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        showNotification('Erro ao acessar câmera. Tente selecionar da galeria.', 'error');
    }
}

function stopCamera() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
}

function capturePhoto() {
    const video = document.getElementById('cameraVideo');
    const canvas = document.getElementById('photoCanvas');
    const preview = document.getElementById('photoPreview');
    const capturedImg = document.getElementById('capturedPhoto');
    
    if (!video || !canvas || !preview || !capturedImg) return;
    
    const context = canvas.getContext('2d');
    
    // Definir dimensões do canvas
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Capturar frame atual do vídeo
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Converter para blob
    canvas.toBlob((blob) => {
        capturedPhotoBlob = blob;
        
        // Mostrar preview
        const url = URL.createObjectURL(blob);
        capturedImg.src = url;
        
        // Esconder vídeo e mostrar preview
        video.style.display = 'none';
        preview.style.display = 'block';
        
        showNotification('Foto capturada! Confirme ou refaça.', 'success');
    }, 'image/jpeg', 0.8);
}

function selectFromGallery() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Preferir câmera traseira
    
    input.onchange = (event) => {
        const file = event.target.files[0];
        if (file) {
            capturedPhotoBlob = file;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const capturedImg = document.getElementById('capturedPhoto');
                const preview = document.getElementById('photoPreview');
                const video = document.getElementById('cameraVideo');
                
                if (capturedImg && preview && video) {
                    capturedImg.src = e.target.result;
                    video.style.display = 'none';
                    preview.style.display = 'block';
                    
                    showNotification('Foto selecionada! Confirme ou refaça.', 'success');
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    input.click();
}

function retakePhoto() {
    const preview = document.getElementById('photoPreview');
    const video = document.getElementById('cameraVideo');
    
    if (preview && video) {
        preview.style.display = 'none';
        video.style.display = 'block';
        capturedPhotoBlob = null;
    }
}

function confirmPhoto() {
    if (!capturedPhotoBlob) {
        showNotification('Nenhuma foto capturada', 'warning');
        return;
    }
    
    // Salvar foto
    saveDeliveryPhoto(capturedPhotoBlob);
    
    showNotification('Comprovante de entrega salvo com sucesso!', 'success');
    closePhotoModal();
    
    // Marcar entrega como concluída com foto
    completeDeliveryWithPhoto();
}

function saveDeliveryPhoto(photoBlob) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const photoData = {
            id: 'PHOTO_' + Date.now(),
            deliveryId: 'DEL001', // ID da entrega atual
            data: e.target.result,
            timestamp: new Date().toISOString(),
            size: photoBlob.size
        };
        
        // Salvar no localStorage (em produção, seria enviado para servidor)
        const photos = JSON.parse(localStorage.getItem('deliveryPhotos') || '[]');
        photos.push(photoData);
        localStorage.setItem('deliveryPhotos', JSON.stringify(photos));
        
        console.log('Foto salva:', photoData.id);
    };
    reader.readAsDataURL(photoBlob);
}

function completeDeliveryWithPhoto() {
    // Atualizar status da entrega
    updateDeliveryStatus('completed_with_photo');
    
    // Abrir modal de avaliação
    setTimeout(() => {
        openRatingModal();
    }, 1000);
}

function resetPhotoCapture() {
    capturedPhotoBlob = null;
    
    const preview = document.getElementById('photoPreview');
    const video = document.getElementById('cameraVideo');
    
    if (preview && video) {
        preview.style.display = 'none';
        video.style.display = 'block';
    }
}

// ===============================
// INTEGRAÇÃO COM SISTEMA EXISTENTE
// ===============================

// Modificar função de completar entrega para incluir novas funcionalidades
const originalCompleteDelivery = window.completeDelivery;

function completeDelivery() {
    // Primeiro abrir modal de foto
    openPhotoModal();
}

// Inicializar novos sistemas
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar sistemas existentes primeiro
    if (typeof initializeDashboard === 'function') {
        initializeDashboard();
    }
    
    // Inicializar novos sistemas
    initializeChat();
    initializeAnalytics();
    initializeGamification();
    initializeOfflineSupport();
    
    // Simular abertura do chat automaticamente após 5 segundos
    setTimeout(() => {
        if (!chatOpen) {
            toggleChat();
        }
    }, 5000);
});

// ===============================
// SISTEMA DE ANALYTICS AVANÇADO
// ===============================

let analyticsData = {
    weekly: {
        deliveries: 47,
        rating: 4.8,
        avgTime: 18,
        earnings: 1247.50
    },
    monthly: {
        deliveries: 187,
        rating: 4.7,
        avgTime: 19,
        earnings: 4892.30
    },
    goals: {
        monthlyDeliveries: { current: 187, target: 200 },
        fiveStarRating: { current: 142, target: 150 },
        avgTime: { current: 19, target: 15 }
    }
};

function initializeAnalytics() {
    updateAnalyticsDisplay();
    updateGoalsDisplay();
    
    // Atualizar analytics a cada 5 minutos
    setInterval(updateAnalyticsData, 300000);
}

function updateAnalyticsDisplay() {
    const weeklyDeliveries = document.getElementById('weeklyDeliveries');
    const weeklyRating = document.getElementById('weeklyRating');
    const avgDeliveryTime = document.getElementById('avgDeliveryTime');
    
    if (weeklyDeliveries) weeklyDeliveries.textContent = analyticsData.weekly.deliveries;
    if (weeklyRating) weeklyRating.textContent = analyticsData.weekly.rating;
    if (avgDeliveryTime) avgDeliveryTime.textContent = analyticsData.weekly.avgTime + 'min';
}

function updateGoalsDisplay() {
    // Atualizar progresso das metas
    const progressBars = document.querySelectorAll('.progress-fill');
    const goals = analyticsData.goals;
    
    if (progressBars.length >= 2) {
        // Meta de entregas
        const deliveryProgress = (goals.monthlyDeliveries.current / goals.monthlyDeliveries.target) * 100;
        progressBars[0].style.width = Math.min(deliveryProgress, 100) + '%';
        
        // Meta de avaliação 5 estrelas
        const ratingProgress = (goals.fiveStarRating.current / goals.fiveStarRating.target) * 100;
        progressBars[1].style.width = Math.min(ratingProgress, 100) + '%';
    }
}

function updateAnalyticsData() {
    // Simular atualização de dados
    const previousDeliveries = analyticsData.weekly.deliveries;
    
    // Pequenas variações aleatórias
    analyticsData.weekly.deliveries += Math.floor(Math.random() * 3);
    analyticsData.weekly.rating += (Math.random() - 0.5) * 0.1;
    analyticsData.weekly.avgTime += Math.floor((Math.random() - 0.5) * 4);
    
    // Manter valores dentro de limites realistas
    analyticsData.weekly.rating = Math.max(3.0, Math.min(5.0, analyticsData.weekly.rating));
    analyticsData.weekly.avgTime = Math.max(10, Math.min(45, analyticsData.weekly.avgTime));
    
    updateAnalyticsDisplay();
    
    // Se houve mudança significativa, notificar
    if (analyticsData.weekly.deliveries > previousDeliveries) {
        showNotification('Suas estatísticas foram atualizadas!', 'info');
    }
}

function openAnalyticsModal() {
    // Implementar modal detalhado de analytics
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.id = 'analyticsModal';
    modal.innerHTML = `
        <div class="modal-content analytics-modal">
            <div class="modal-header">
                <h3>📊 Relatório Detalhado de Performance</h3>
                <button class="modal-close" onclick="closeAnalyticsModal()">×</button>
            </div>
            
            <div class="analytics-detail">
                <div class="period-selector">
                    <button class="period-btn active" data-period="week">Semana</button>
                    <button class="period-btn" data-period="month">Mês</button>
                    <button class="period-btn" data-period="year">Ano</button>
                </div>
                
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h4>🚚 Total de Entregas</h4>
                        <span class="big-number">${analyticsData.weekly.deliveries}</span>
                        <span class="trend positive">+12% vs semana anterior</span>
                    </div>
                    
                    <div class="metric-card">
                        <h4>⭐ Avaliação Média</h4>
                        <span class="big-number">${analyticsData.weekly.rating}</span>
                        <span class="trend positive">+0.2 vs semana anterior</span>
                    </div>
                    
                    <div class="metric-card">
                        <h4>⏱️ Tempo Médio</h4>
                        <span class="big-number">${analyticsData.weekly.avgTime}min</span>
                        <span class="trend negative">+2min vs semana anterior</span>
                    </div>
                    
                    <div class="metric-card">
                        <h4>💰 Ganhos</h4>
                        <span class="big-number">R$ ${analyticsData.weekly.earnings.toFixed(2)}</span>
                        <span class="trend positive">+8.5% vs semana anterior</span>
                    </div>
                </div>
                
                <div class="charts-section">
                    <h4>📈 Gráfico de Entregas por Dia</h4>
                    <div class="simple-chart">
                        <div class="chart-bars">
                            <div class="bar" style="height: 60%"><span>8</span></div>
                            <div class="bar" style="height: 80%"><span>12</span></div>
                            <div class="bar" style="height: 45%"><span>6</span></div>
                            <div class="bar" style="height: 90%"><span>15</span></div>
                            <div class="bar" style="height: 70%"><span>9</span></div>
                            <div class="bar" style="height: 55%"><span>7</span></div>
                            <div class="bar" style="height: 40%"><span>5</span></div>
                        </div>
                        <div class="chart-labels">
                            <span>Seg</span><span>Ter</span><span>Qua</span><span>Qui</span><span>Sex</span><span>Sab</span><span>Dom</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="modal-footer">
                <button class="btn-secondary" onclick="exportAnalytics()">📄 Exportar PDF</button>
                <button class="btn-primary" onclick="closeAnalyticsModal()">Fechar</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
}

function closeAnalyticsModal() {
    const modal = document.getElementById('analyticsModal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function exportAnalytics() {
    showNotification('Relatório sendo gerado... Aguarde o download.', 'info');
    
    // Simular geração de PDF
    setTimeout(() => {
        showNotification('Relatório exportado com sucesso!', 'success');
    }, 2000);
}

// ===============================
// SISTEMA DE GAMIFICAÇÃO AVANÇADO
// ===============================

let gamificationData = {
    badges: [
        { id: 'centuriao', name: 'Centurião', icon: '💯', earned: true, description: '100 Entregas Completas' },
        { id: 'veloz', name: 'Veloz', icon: '⚡', earned: true, description: 'Velocidade Média < 20min' },
        { id: 'estrela', name: 'Estrela', icon: '⭐', earned: true, description: 'Avaliação 5⭐ por 30 dias' },
        { id: 'lenda', name: 'Lenda', icon: '🔒', earned: false, description: '500 Entregas', progress: 187 }
    ],
    ranking: [
        { position: 1, name: 'Carlos Silva', score: 2156 },
        { position: 2, name: 'Ana Santos', score: 1923 },
        { position: 3, name: 'Você', score: 1847, isCurrentUser: true },
        { position: 4, name: 'Pedro Lima', score: 1654 },
        { position: 5, name: 'Julia Costa', score: 1432 }
    ],
    points: 1847,
    level: 12
};

function initializeGamification() {
    updateBadgesDisplay();
    updateRankingDisplay();
    checkNewAchievements();
    
    // Verificar conquistas a cada entrega
    document.addEventListener('deliveryCompleted', checkNewAchievements);
}

function updateBadgesDisplay() {
    const badgesContainer = document.querySelector('.badges-container');
    if (!badgesContainer) return;
    
    badgesContainer.innerHTML = '';
    
    gamificationData.badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = `badge ${badge.earned ? 'earned' : 'locked'}`;
        badgeElement.title = badge.description;
        
        if (!badge.earned && badge.progress) {
            badgeElement.title += ` (Progresso: ${badge.progress}/500)`;
        }
        
        badgeElement.innerHTML = `
            <span class="badge-icon">${badge.icon}</span>
            <span class="badge-name">${badge.name}</span>
        `;
        
        badgesContainer.appendChild(badgeElement);
    });
}

function updateRankingDisplay() {
    const rankingList = document.querySelector('.ranking-list');
    if (!rankingList) return;
    
    rankingList.innerHTML = '';
    
    gamificationData.ranking.forEach(player => {
        const rankElement = document.createElement('div');
        rankElement.className = `rank-item ${player.isCurrentUser ? 'current-user' : ''}`;
        
        rankElement.innerHTML = `
            <span class="rank-position">${player.position}º</span>
            <span class="rank-name">${player.name}</span>
            <span class="rank-score">${player.score.toLocaleString()} pts</span>
        `;
        
        rankingList.appendChild(rankElement);
    });
}

function checkNewAchievements() {
    const stats = getMotoboyStats();
    let newBadges = [];
    
    // Verificar badge Centurião (100 entregas)
    if (stats.totalDeliveries >= 100 && !gamificationData.badges[0].earned) {
        gamificationData.badges[0].earned = true;
        newBadges.push(gamificationData.badges[0]);
    }
    
    // Verificar badge Veloz (tempo médio < 20min)
    if (stats.avgDeliveryTime < 20 && !gamificationData.badges[1].earned) {
        gamificationData.badges[1].earned = true;
        newBadges.push(gamificationData.badges[1]);
    }
    
    // Verificar badge Estrela (avaliação 5⭐ por 30 dias)
    if (stats.avgRating >= 4.8 && !gamificationData.badges[2].earned) {
        gamificationData.badges[2].earned = true;
        newBadges.push(gamificationData.badges[2]);
    }
    
    // Atualizar progresso do badge Lenda
    if (!gamificationData.badges[3].earned) {
        gamificationData.badges[3].progress = stats.totalDeliveries;
        
        if (stats.totalDeliveries >= 500) {
            gamificationData.badges[3].earned = true;
            gamificationData.badges[3].icon = '👑';
            newBadges.push(gamificationData.badges[3]);
        }
    }
    
    // Mostrar notificações para novos badges
    newBadges.forEach(badge => {
        showBadgeNotification(badge);
    });
    
    if (newBadges.length > 0) {
        updateBadgesDisplay();
    }
}

function showBadgeNotification(badge) {
    const notification = document.createElement('div');
    notification.className = 'badge-notification';
    notification.innerHTML = `
        <div class="badge-notification-content">
            <div class="badge-notification-icon">${badge.icon}</div>
            <div class="badge-notification-text">
                <h4>🎉 Novo Badge Conquistado!</h4>
                <p><strong>${badge.name}</strong></p>
                <small>${badge.description}</small>
            </div>
        </div>
    `;
    
    // Estilos inline
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #ffd700, #ffed4e);
        color: #333;
        padding: 20px;
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        z-index: 10000;
        animation: badgeAppear 0.5s ease;
        max-width: 300px;
        text-align: center;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'badgeDisappear 0.5s ease';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}

function getMotoboyStats() {
    // Simular estatísticas do motoboy
    return {
        totalDeliveries: analyticsData.monthly.deliveries,
        avgDeliveryTime: analyticsData.weekly.avgTime,
        avgRating: analyticsData.weekly.rating,
        totalEarnings: analyticsData.monthly.earnings
    };
}

function openGoalsModal() {
    showNotification('Sistema de metas personalizado em desenvolvimento!', 'info');
}

// ===============================
// SISTEMA DE SUPORTE OFFLINE
// ===============================

let offlineMode = false;
let pendingSyncData = [];

function initializeOfflineSupport() {
    // Registrar Service Worker para cache
    if ('serviceWorker' in navigator) {
        registerServiceWorker();
    }
    
    // Monitorar status de conexão
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Verificar status inicial
    if (!navigator.onLine) {
        handleOffline();
    }
    
    // Cache de dados essenciais
    cacheEssentialData();
}

function registerServiceWorker() {
    // Em uma implementação real, registraria um service worker
    console.log('Service Worker seria registrado aqui para cache offline');
}

function handleOffline() {
    offlineMode = true;
    showOfflineNotification();
    switchToOfflineMode();
}

function handleOnline() {
    if (offlineMode) {
        offlineMode = false;
        showOnlineNotification();
        syncPendingData();
        switchToOnlineMode();
    }
}

function showOfflineNotification() {
    const notification = document.createElement('div');
    notification.id = 'offlineNotification';
    notification.className = 'offline-notification';
    notification.innerHTML = `
        <div class="offline-content">
            <span class="offline-icon">📶</span>
            <div class="offline-text">
                <strong>Modo Offline</strong>
                <p>Você está trabalhando offline. Os dados serão sincronizados quando a conexão retornar.</p>
            </div>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 70px;
        left: 20px;
        right: 20px;
        background: #ff6b6b;
        color: white;
        padding: 15px;
        border-radius: 10px;
        z-index: 9999;
        animation: slideDown 0.3s ease;
    `;
    
    document.body.appendChild(notification);
}

function showOnlineNotification() {
    const offlineNotification = document.getElementById('offlineNotification');
    if (offlineNotification) {
        offlineNotification.remove();
    }
    
    showNotification('Conexão restaurada! Sincronizando dados...', 'success');
}

function switchToOfflineMode() {
    // Desabilitar funcionalidades que requerem internet
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) {
        chatWidget.style.opacity = '0.5';
        chatWidget.style.pointerEvents = 'none';
    }
    
    // Adicionar indicador visual de modo offline
    document.body.classList.add('offline-mode');
}

function switchToOnlineMode() {
    // Reabilitar funcionalidades
    const chatWidget = document.getElementById('chatWidget');
    if (chatWidget) {
        chatWidget.style.opacity = '1';
        chatWidget.style.pointerEvents = 'auto';
    }
    
    // Remover indicador visual
    document.body.classList.remove('offline-mode');
}

function cacheEssentialData() {
    // Cache de dados essenciais no localStorage
    const essentialData = {
        userProfile: JSON.parse(localStorage.getItem('motoboyProfile') || '{}'),
        currentDeliveries: JSON.parse(localStorage.getItem('currentDeliveries') || '[]'),
        earnings: JSON.parse(localStorage.getItem('motoboyEarnings') || '{}'),
        lastSync: new Date().toISOString()
    };
    
    localStorage.setItem('offlineCache', JSON.stringify(essentialData));
}

function addToPendingSync(data) {
    pendingSyncData.push({
        ...data,
        timestamp: new Date().toISOString()
    });
    
    localStorage.setItem('pendingSyncData', JSON.stringify(pendingSyncData));
}

function syncPendingData() {
    if (pendingSyncData.length === 0) return;
    
    // Simular sincronização
    setTimeout(() => {
        console.log('Sincronizando', pendingSyncData.length, 'itens pendentes');
        
        pendingSyncData.forEach(item => {
            console.log('Sincronizado:', item);
        });
        
        pendingSyncData = [];
        localStorage.removeItem('pendingSyncData');
        
        showNotification('Dados sincronizados com sucesso!', 'success');
    }, 2000);
}

// Adicionar estilos de animação para badges e modo offline
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes badgeAppear {
        from {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }
        to {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
    }
    
    @keyframes badgeDisappear {
        from {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }
        to {
            opacity: 0;
            transform: translate(-50%, -50%) scale(0.5);
        }
    }
    
    @keyframes slideDown {
        from {
            transform: translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }
    
    .offline-mode {
        filter: grayscale(20%);
    }
    
    .offline-content {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .offline-icon {
        font-size: 24px;
    }
    
    .offline-text strong {
        display: block;
        font-size: 16px;
        margin-bottom: 5px;
    }
    
    .offline-text p {
        margin: 0;
        font-size: 14px;
        opacity: 0.9;
    }
`;
document.head.appendChild(additionalStyles);

// ===============================
// GOOGLE MAPS INTEGRATION
// ===============================

let deliveryMap = null;
let motoboyMarker = null;
let customerMarker = null;
let routeDirections = null;
let directionsService = null;
let directionsRenderer = null;
let trafficLayer = null;
let motoboyPosition = { lat: -23.5505, lng: -46.6333 }; // Posição inicial do motoboy
let customerPosition = { lat: -23.5618, lng: -46.6565 }; // Posição do cliente
let mapType = 'roadmap';
let isTrafficVisible = false;

// Inicializar Google Maps
function initMap() {
    console.log('Inicializando Google Maps...');
    
    // Verificar se a API foi carregada
    if (typeof google === 'undefined') {
        console.error('Google Maps API não carregada');
        return;
    }
    
    // Não inicializar o mapa automaticamente, apenas preparar
    console.log('Google Maps API carregada com sucesso');
}

// Abrir mapa em tempo real
function openLiveMap() {
    const mapSection = document.getElementById('mapSection');
    const currentDeliverySection = document.getElementById('currentDeliverySection');
    
    if (!mapSection) {
        showNotification('Erro ao abrir mapa', 'error');
        return;
    }
    
    // Mostrar seção do mapa
    mapSection.style.display = 'block';
    
    // Rolar para o mapa
    mapSection.scrollIntoView({ behavior: 'smooth' });
    
    // Inicializar o mapa após um pequeno delay
    setTimeout(() => {
        initDeliveryMap();
    }, 500);
    
    showNotification('Abrindo mapa em tempo real...', 'info');
}

// Fechar mapa em tempo real
function closeLiveMap() {
    const mapSection = document.getElementById('mapSection');
    if (mapSection) {
        mapSection.style.display = 'none';
    }
    
    // Limpar marcadores e rotas
    if (deliveryMap) {
        if (motoboyMarker) motoboyMarker.setMap(null);
        if (customerMarker) customerMarker.setMap(null);
        if (directionsRenderer) directionsRenderer.setMap(null);
        if (trafficLayer) trafficLayer.setMap(null);
    }
    
    showNotification('Mapa fechado', 'info');
}

// Inicializar mapa de entrega
function initDeliveryMap() {
    if (typeof google === 'undefined') {
        showNotification('Google Maps não está disponível. Usando simulação.', 'warning');
        simulateMapFunctionality();
        return;
    }
    
    const mapElement = document.getElementById('deliveryMap');
    if (!mapElement) {
        console.error('Elemento do mapa não encontrado');
        return;
    }
    
    // Configurações do mapa
    const mapOptions = {
        zoom: 14,
        center: motoboyPosition,
        mapTypeId: mapType,
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true
    };
    
    // Criar mapa
    deliveryMap = new google.maps.Map(mapElement, mapOptions);
    
    // Inicializar serviços
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#007bff',
            strokeWeight: 5,
            strokeOpacity: 0.8
        }
    });
    directionsRenderer.setMap(deliveryMap);
    
    // Camada de trânsito
    trafficLayer = new google.maps.TrafficLayer();
    
    // Criar marcadores
    createMarkers();
    
    // Calcular rota
    calculateRoute();
    
    // Simular movimento do motoboy
    startMotoboyTracking();
    
    showNotification('Mapa carregado com sucesso!', 'success');
}

// Criar marcadores
function createMarkers() {
    // Marcador do motoboy
    motoboyMarker = new google.maps.Marker({
        position: motoboyPosition,
        map: deliveryMap,
        title: 'Motoboy - João Silva',
        icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#007bff" stroke="white" stroke-width="4"/>
                    <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">🏍️</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        },
        animation: google.maps.Animation.BOUNCE
    });
    
    // Para a animação após 3 segundos
    setTimeout(() => {
        if (motoboyMarker) {
            motoboyMarker.setAnimation(null);
        }
    }, 3000);
    
    // Marcador do cliente
    customerMarker = new google.maps.Marker({
        position: customerPosition,
        map: deliveryMap,
        title: 'Cliente - Maria Silva',
        icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#28a745" stroke="white" stroke-width="4"/>
                    <text x="20" y="26" text-anchor="middle" fill="white" font-size="16" font-weight="bold">📍</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        }
    });
    
    // InfoWindows
    const motoboyInfoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; font-family: 'Inter', sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #333;">🏍️ João Silva</h4>
                <p style="margin: 0; font-size: 14px; color: #666;">Motoboy • Honda CG 160</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #007bff; font-weight: 600;">⭐ 4.9 • 187 entregas</p>
            </div>
        `
    });
    
    const customerInfoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; font-family: 'Inter', sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #333;">📍 Maria Silva</h4>
                <p style="margin: 0; font-size: 14px; color: #666;">Rua das Flores, 123 - Centro</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #28a745; font-weight: 600;">📱 (11) 99999-1234</p>
            </div>
        `
    });
    
    // Eventos de clique nos marcadores
    motoboyMarker.addListener('click', () => {
        customerInfoWindow.close();
        motoboyInfoWindow.open(deliveryMap, motoboyMarker);
    });
    
    customerMarker.addListener('click', () => {
        motoboyInfoWindow.close();
        customerInfoWindow.open(deliveryMap, customerMarker);
    });
}

// Calcular rota
function calculateRoute() {
    if (!directionsService || !directionsRenderer) return;
    
    const request = {
        origin: motoboyPosition,
        destination: customerPosition,
        travelMode: google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false
    };
    
    directionsService.route(request, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            // Atualizar informações da rota
            const route = result.routes[0].legs[0];
            document.getElementById('routeDistance').textContent = route.distance.text;
            document.getElementById('routeTime').textContent = route.duration.text;
            
            // Ajustar zoom para mostrar toda a rota
            const bounds = new google.maps.LatLngBounds();
            bounds.extend(motoboyPosition);
            bounds.extend(customerPosition);
            deliveryMap.fitBounds(bounds);
            
        } else {
            console.error('Erro ao calcular rota:', status);
            showNotification('Erro ao calcular rota', 'error');
        }
    });
}

// Simular movimento do motoboy
function startMotoboyTracking() {
    let step = 0;
    const totalSteps = 50;
    
    const moveInterval = setInterval(() => {
        if (step >= totalSteps) {
            clearInterval(moveInterval);
            showNotification('Motoboy chegou ao destino!', 'success');
            return;
        }
        
        // Calcular nova posição (interpolação linear simples)
        const progress = step / totalSteps;
        const lat = motoboyPosition.lat + (customerPosition.lat - motoboyPosition.lat) * progress;
        const lng = motoboyPosition.lng + (customerPosition.lng - motoboyPosition.lng) * progress;
        
        const newPosition = { lat, lng };
        
        // Atualizar marcador
        if (motoboyMarker) {
            motoboyMarker.setPosition(newPosition);
        }
        
        // Atualizar informações de distância
        const remainingDistance = (2.5 * (1 - progress)).toFixed(1);
        const remainingTime = Math.ceil(8 * (1 - progress));
        
        document.getElementById('routeDistance').textContent = remainingDistance + ' km restantes';
        document.getElementById('routeTime').textContent = remainingTime + ' min restantes';
        
        step++;
    }, 2000); // Atualizar a cada 2 segundos
}

// Centralizar mapa no motoboy
function centerMap() {
    if (deliveryMap && motoboyMarker) {
        deliveryMap.setCenter(motoboyMarker.getPosition());
        deliveryMap.setZoom(16);
        showNotification('Mapa centralizado no motoboy', 'info');
    }
}

// Toggle camada de trânsito
function toggleTraffic() {
    if (!deliveryMap || !trafficLayer) return;
    
    isTrafficVisible = !isTrafficVisible;
    
    if (isTrafficVisible) {
        trafficLayer.setMap(deliveryMap);
        document.getElementById('trafficStatus').textContent = 'Visível';
        showNotification('Camada de trânsito ativada', 'info');
    } else {
        trafficLayer.setMap(null);
        document.getElementById('trafficStatus').textContent = 'Oculto';
        showNotification('Camada de trânsito desativada', 'info');
    }
}

// Toggle tipo de mapa
function toggleMapType() {
    if (!deliveryMap) return;
    
    mapType = mapType === 'roadmap' ? 'satellite' : 'roadmap';
    deliveryMap.setMapTypeId(mapType);
    
    const button = document.querySelector('.btn-map-control[onclick="toggleMapType()"]');
    if (button) {
        button.textContent = mapType === 'satellite' ? '🗺️ Mapa' : '🛰️ Satélite';
    }
    
    showNotification(`Modo ${mapType === 'satellite' ? 'satélite' : 'mapa'} ativado`, 'info');
}

// Simulação para quando Google Maps não estiver disponível
function simulateMapFunctionality() {
    const mapElement = document.getElementById('deliveryMap');
    if (mapElement) {
        mapElement.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                background: linear-gradient(45deg, #e3f2fd, #bbdefb);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: #1976d2;
                font-family: 'Inter', sans-serif;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
            ">
                <div style="font-size: 48px; margin-bottom: 20px;">🗺️</div>
                <h3 style="margin: 0 0 10px 0;">Simulação de Mapa</h3>
                <p style="margin: 0 0 20px 0; opacity: 0.8;">Motoboy em rota para o cliente</p>
                <div style="
                    background: white;
                    padding: 15px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-top: 20px;
                ">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 10px;">
                        <span style="font-size: 20px;">🏍️</span>
                        <span>João Silva</span>
                        <span style="color: #28a745; font-weight: 600;">→</span>
                        <span style="font-size: 20px;">📍</span>
                        <span>Maria Silva</span>
                    </div>
                    <div style="font-size: 14px; color: #666;">
                        Distância: 2.3km • Tempo: 8 min
                    </div>
                </div>
            </div>
        `;
    }
    
    // Simular atualizações de informações
    document.getElementById('routeDistance').textContent = '2.3 km';
    document.getElementById('routeTime').textContent = '8 min';
    document.getElementById('trafficStatus').textContent = 'Normal';
}

function contactCustomer() {
    showNotification('Função de contato com cliente em desenvolvimento', 'info');
}

// Notifications
function renderNotifications() {
    const container = document.getElementById('notificationList');
    
    if (motoboyData.notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔔</div>
                <h3>Nenhuma notificação</h3>
                <p>Suas notificações aparecerão aqui</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = motoboyData.notifications.map(notification => `
        <div class="notification-item ${notification.unread ? 'unread' : ''}">
            <div class="notification-icon">${getNotificationIcon(notification.type)}</div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${notification.time}</div>
            </div>
            ${notification.unread ? '<div class="unread-indicator"></div>' : ''}
        </div>
    `).join('');
}

function getNotificationIcon(type) {
    const icons = {
        delivery: '📦',
        earning: '💰',
        rating: '⭐',
        system: '🔧',
        promotion: '🎉'
    };
    return icons[type] || '📢';
}

function addNotification(notification) {
    notification.id = Date.now();
    motoboyData.notifications.unshift(notification);
    
    // Manter apenas 20 notificações
    if (motoboyData.notifications.length > 20) {
        motoboyData.notifications = motoboyData.notifications.slice(0, 20);
    }
    
    renderNotifications();
    updateNotificationBadge();
    saveMotoboyData();
}

function updateNotificationBadge() {
    const unreadCount = motoboyData.notifications.filter(n => n.unread).length;
    const badge = document.getElementById('notificationCount');
    
    if (unreadCount > 0) {
        badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

// Toggle functions
function toggleNotifications() {
    const panel = document.getElementById('notificationPanel');
    appState.isNotificationPanelOpen = !appState.isNotificationPanelOpen;
    
    if (appState.isNotificationPanelOpen) {
        panel.classList.add('active');
        
        // Marcar como lidas após um tempo
        setTimeout(() => {
            motoboyData.notifications.forEach(n => n.unread = false);
            renderNotifications();
            updateNotificationBadge();
            saveMotoboyData();
        }, 2000);
    } else {
        panel.classList.remove('active');
    }
}

function closeNotificationPanel() {
    document.getElementById('notificationPanel').classList.remove('active');
    appState.isNotificationPanelOpen = false;
}

function toggleProfileMenu() {
    const dropdown = document.getElementById('profileDropdown');
    appState.isProfileMenuOpen = !appState.isProfileMenuOpen;
    
    if (appState.isProfileMenuOpen) {
        dropdown.classList.add('active');
    } else {
        dropdown.classList.remove('active');
    }
}

function closeProfileMenu() {
    document.getElementById('profileDropdown').classList.remove('active');
    appState.isProfileMenuOpen = false;
}

// Navigation functions
function openHistoryPage() {
    showNotification('Página de histórico em desenvolvimento', 'info');
}

function openEarningsPage() {
    showNotification('Relatório de ganhos em desenvolvimento', 'info');
}

function openSupportPage() {
    showNotification('Central de suporte em desenvolvimento', 'info');
}

function openProfilePage() {
    showNotification('Página de perfil em desenvolvimento', 'info');
}

function openSettingsPage() {
    showNotification('Configurações em desenvolvimento', 'info');
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        localStorage.removeItem('motoboyData');
        localStorage.removeItem('motoboyName');
        window.location.href = 'loginMotoboy.html';
    }
}

// Data persistence
function saveMotoboyData() {
    localStorage.setItem('motoboyData', JSON.stringify(motoboyData));
}

// Auto-updates
function startDataUpdates() {
    // Atualizar dados a cada 30 segundos
    setInterval(() => {
        if (motoboyData.status.isOnline) {
            // Simular possibilidade de nova entrega
            if (Math.random() < 0.1 && motoboyData.availableDeliveries.length < 5) {
                addNewAvailableDelivery();
            }
        }
    }, 30000);
    
    // Atualizar horário a cada minuto
    setInterval(() => {
        updateWelcomeMessage();
    }, 60000);
}

// Notification system
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification-toast');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification-toast notification-${type}`;
    notification.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : type === 'warning' ? '⚠️' : 'ℹ'}
            </span>
            <span class="toast-message">${message}</span>
            <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : type === 'warning' ? '#f39c12' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        font-family: 'Inter', sans-serif;
    `;
    
    notification.querySelector('.toast-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    notification.querySelector('.toast-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// CSS adicional para estilos específicos
const additionalStyles = document.createElement('style');
additionalStyles.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .delivery-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }
    
    .delivery-type {
        display: flex;
        align-items: center;
        gap: 15px;
    }
    
    .type-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .type-badge.ultra {
        background: rgba(231, 76, 60, 0.2);
        color: #e74c3c;
        border: 1px solid rgba(231, 76, 60, 0.4);
    }
    
    .type-badge.expressa {
        background: rgba(243, 156, 18, 0.2);
        color: #f39c12;
        border: 1px solid rgba(243, 156, 18, 0.4);
    }
    
    .type-badge.normal {
        background: rgba(52, 152, 219, 0.2);
        color: #3498db;
        border: 1px solid rgba(52, 152, 219, 0.4);
    }
    
    .payment-amount {
        font-size: 1.2rem;
        font-weight: 700;
        color: #27ae60;
    }
    
    .delivery-distance {
        color: #ddd;
        font-weight: 600;
    }
    
    .delivery-route {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
        padding: 10px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
    }
    
    .route-point {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }
    
    .route-icon {
        font-size: 1.2rem;
    }
    
    .route-text {
        color: #ddd;
        font-size: 0.9rem;
    }
    
    .route-arrow {
        color: #3498db;
        font-weight: bold;
        font-size: 1.2rem;
    }
    
    .delivery-details-preview {
        display: flex;
        gap: 20px;
        margin-bottom: 15px;
        flex-wrap: wrap;
    }
    
    .detail-item {
        display: flex;
        align-items: center;
        gap: 6px;
        color: #ddd;
        font-size: 0.85rem;
    }
    
    .detail-icon {
        font-size: 1rem;
    }
    
    .delivery-actions-preview {
        text-align: center;
    }
    
    .quick-accept-btn {
        background: #27ae60;
        color: #fff;
        border: none;
        padding: 10px 20px;
        border-radius: 20px;
        cursor: pointer;
        font-weight: 600;
        font-size: 0.9rem;
        transition: all 0.3s ease;
        width: 100%;
    }
    
    .quick-accept-btn:hover {
        background: #219a52;
        transform: translateY(-2px);
    }
    
    .current-delivery-info {
        color: #ddd;
    }
    
    .delivery-id {
        font-size: 1.1rem;
        font-weight: 600;
        color: #3498db;
        margin-bottom: 10px;
    }
    
    .delivery-customer {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 15px;
        font-weight: 500;
    }
    
    .delivery-route-current {
        display: flex;
        align-items: center;
        gap: 15px;
        margin-bottom: 15px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
    
    .route-step {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
        transition: all 0.3s ease;
    }
    
    .route-step.active {
        color: #3498db;
        font-weight: 600;
    }
    
    .route-step.completed {
        color: #27ae60;
        opacity: 0.7;
    }
    
    .delivery-progress {
        background: rgba(255, 255, 255, 0.05);
        padding: 10px 15px;
        border-radius: 8px;
    }
    
    .progress-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 0.9rem;
    }
    
    .notification-item {
        padding: 15px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        gap: 12px;
        transition: background 0.3s ease;
        position: relative;
    }
    
    .notification-item:hover {
        background: rgba(255, 255, 255, 0.05);
    }
    
    .notification-item.unread {
        background: rgba(52, 152, 219, 0.1);
        border-left: 3px solid #3498db;
    }
    
    .notification-icon {
        font-size: 1.5rem;
        margin-top: 2px;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-title {
        font-weight: 600;
        color: #fff;
        margin-bottom: 4px;
    }
    
    .notification-message {
        color: #ddd;
        font-size: 0.9rem;
        line-height: 1.4;
        margin-bottom: 4px;
    }
    
    .notification-time {
        color: #999;
        font-size: 0.8rem;
    }
    
    .unread-indicator {
        position: absolute;
        top: 15px;
        right: 15px;
        width: 8px;
        height: 8px;
        background: #3498db;
        border-radius: 50%;
    }
`;
document.head.appendChild(additionalStyles);

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Fechar modais clicando fora
    document.addEventListener('click', function(e) {
        // Modal de avaliação
        const avaliacaoModal = document.getElementById('avaliacaoModal');
        if (avaliacaoModal && e.target === avaliacaoModal) {
            avaliacaoModal.style.display = 'none';
        }
        
        // Modal de foto
        const fotoModal = document.getElementById('fotoModal');
        if (fotoModal && e.target === fotoModal) {
            fotoModal.style.display = 'none';
        }
        
        // Modal de relatório
        const relatorioModal = document.getElementById('relatorioModal');
        if (relatorioModal && e.target === relatorioModal) {
            relatorioModal.style.display = 'none';
        }
        
        // Modal de configurações
        const configModal = document.getElementById('configModal');
        if (configModal && e.target === configModal) {
            configModal.style.display = 'none';
        }
        
        // Fechar painéis de notificação e perfil clicando fora
        if (!e.target.closest('#notificationPanel') && !e.target.closest('.notification-btn')) {
            closeNotificationPanel();
        }
        
        if (!e.target.closest('#profileDropdown') && !e.target.closest('.profile-section')) {
            closeProfileMenu();
        }
    });
    
    // Tecla ESC para fechar modais
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            // Fechar todos os modais
            const modals = document.querySelectorAll('.modal-overlay');
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
            
            // Fechar painéis
            closeNotificationPanel();
            closeProfileMenu();
            
            // Fechar mapa se estiver aberto
            closeLiveMap();
        }
    });
    
    // Configurar status inicial
    updateWorkStatus();
    updateEarnings();
    updateStats();
    
    // Carregar pedidos do dia
    loadTodayDeliveries();
    
    // Simular notificações de novos pedidos
    startOrderNotifications();
    
    // Inicializar suporte offline
    initializeOfflineSupport();
    
    // Iniciar atualizações automáticas
    startDataUpdates();
});