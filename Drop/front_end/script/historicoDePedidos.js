// Histórico de Pedidos - JavaScript Avançado
document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    checkAuthentication();
    
    // Inicializar página
    initializeHistoryPage();
    
    // Carregar dados
    loadHistoryData();
    
    // Configurar eventos
    setupEventListeners();
});

let currentOrders = [];
let filteredOrders = [];
let currentPage = 1;
const ordersPerPage = 10;
let currentView = 'list';
let selectedRating = 0;

function checkAuthentication() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (!isLoggedIn || isLoggedIn !== 'true') {
        window.location.href = 'loginUsuario.html';
        return false;
    }
    return true;
}

function initializeHistoryPage() {
    // Configurar datas padrão
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3); // 3 meses atrás
    
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
}

function loadHistoryData() {
    // Simular carregamento de dados históricos
    showLoading();
    
    // Dados mockados mais realistas
    const mockOrders = [
        {
            id: 'DP001',
            date: '2025-10-27',
            time: '14:30',
            status: 'completed',
            origin: 'Shopping Vila Olímpia',
            destination: 'Rua das Flores, 123 - Vila Madalena',
            value: 25.50,
            rating: 5,
            motoboy: 'João Silva',
            motoboyPhone: '(11) 99999-8888',
            deliveryTime: 35,
            items: ['Documento', 'Envelope lacrado'],
            paymentMethod: 'Cartão de Crédito',
            feedback: 'Entrega muito rápida e cuidadosa!'
        },
        {
            id: 'DP002',
            date: '2025-10-26',
            time: '09:15',
            status: 'completed',
            origin: 'Rua Augusta, 500',
            destination: 'Av. Paulista, 1000 - Conjunto 45',
            value: 18.75,
            rating: 4,
            motoboy: 'Maria Santos',
            motoboyPhone: '(11) 98888-7777',
            deliveryTime: 28,
            items: ['Contrato', 'Documentos importantes'],
            paymentMethod: 'PIX',
            feedback: 'Ótimo serviço, muito profissional'
        },
        {
            id: 'DP003',
            date: '2025-10-25',
            time: '16:45',
            status: 'cancelled',
            origin: 'Centro Empresarial',
            destination: 'Moema Shopping',
            value: 22.00,
            rating: 0,
            motoboy: null,
            motoboyPhone: null,
            deliveryTime: 0,
            items: ['Medicamento'],
            paymentMethod: 'Cartão de Débito',
            cancelReason: 'Cancelado pelo cliente'
        },
        {
            id: 'DP004',
            date: '2025-10-24',
            time: '11:20',
            status: 'completed',
            origin: 'Laboratório Central',
            destination: 'Residencial - Zona Sul',
            value: 32.90,
            rating: 5,
            motoboy: 'Carlos Oliveira',
            motoboyPhone: '(11) 97777-6666',
            deliveryTime: 42,
            items: ['Exames médicos', 'Envelope confidencial'],
            paymentMethod: 'Dinheiro',
            feedback: 'Pontualidade exemplar!'
        },
        {
            id: 'DP005',
            date: '2025-10-23',
            time: '13:55',
            status: 'completed',
            origin: 'Escritório Central',
            destination: 'Residência - Vila Mariana',
            value: 29.40,
            rating: 4,
            motoboy: 'Ana Costa',
            motoboyPhone: '(11) 96666-5555',
            deliveryTime: 38,
            items: ['Documentos corporativos'],
            paymentMethod: 'Cartão de Crédito',
            feedback: 'Serviço de qualidade'
        }
    ];
    
    // Simular delay de rede
    setTimeout(() => {
        currentOrders = mockOrders;
        filteredOrders = [...currentOrders];
        
        updateStatistics();
        displayOrders();
        setupPagination();
        hideLoading();
    }, 1500);
}

function updateStatistics() {
    const completedOrders = filteredOrders.filter(order => order.status === 'completed');
    
    // Total de pedidos
    document.getElementById('totalOrders').textContent = filteredOrders.length;
    
    // Total gasto
    const totalSpent = filteredOrders.reduce((sum, order) => sum + order.value, 0);
    document.getElementById('totalSpent').textContent = `R$ ${totalSpent.toFixed(2)}`;
    
    // Avaliação média
    const ratedOrders = completedOrders.filter(order => order.rating > 0);
    const avgRating = ratedOrders.length > 0 
        ? ratedOrders.reduce((sum, order) => sum + order.rating, 0) / ratedOrders.length 
        : 0;
    document.getElementById('avgRating').textContent = avgRating.toFixed(1);
    
    // Tempo médio
    const avgTime = completedOrders.length > 0
        ? completedOrders.reduce((sum, order) => sum + order.deliveryTime, 0) / completedOrders.length
        : 0;
    document.getElementById('avgTime').textContent = `${Math.round(avgTime)} min`;
    
    // Atualizar contador
    document.getElementById('ordersCount').textContent = `(${filteredOrders.length})`;
}

function displayOrders() {
    const container = document.getElementById('ordersContainer');
    const emptyState = document.getElementById('emptyState');
    
    if (filteredOrders.length === 0) {
        container.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }
    
    container.style.display = currentView === 'grid' ? 'grid' : 'flex';
    container.className = `orders-container ${currentView === 'grid' ? 'grid-view' : ''}`;
    emptyState.style.display = 'none';
    
    const startIndex = (currentPage - 1) * ordersPerPage;
    const endIndex = startIndex + ordersPerPage;
    const ordersToShow = filteredOrders.slice(startIndex, endIndex);
    
    container.innerHTML = ordersToShow.map(order => createOrderCard(order)).join('');
}

function createOrderCard(order) {
    const statusClass = getStatusClass(order.status);
    const statusText = getStatusText(order.status);
    const formattedDate = formatDate(order.date);
    
    return `
        <div class="order-item" onclick="showOrderDetails('${order.id}')">
            <div class="order-header">
                <div>
                    <div class="order-id">#${order.id}</div>
                    <div class="order-date">${formattedDate} às ${order.time}</div>
                </div>
                <span class="order-status ${statusClass}">${statusText}</span>
            </div>
            
            <div class="order-details">
                <div class="order-route">
                    <div class="route-item">
                        <span class="route-icon">📍</span>
                        <span class="route-address">${order.origin}</span>
                    </div>
                    <div class="route-item">
                        <span class="route-icon">🎯</span>
                        <span class="route-address">${order.destination}</span>
                    </div>
                </div>
                
                <div class="order-meta">
                    <span class="order-value">R$ ${order.value.toFixed(2)}</span>
                    ${order.rating > 0 ? `
                        <div class="order-rating">
                            ${'⭐'.repeat(order.rating)}
                            <span>(${order.rating})</span>
                        </div>
                    ` : ''}
                    ${order.deliveryTime > 0 ? `<span>${order.deliveryTime} min</span>` : ''}
                </div>
            </div>
            
            <div class="order-actions" onclick="event.stopPropagation()">
                <button class="action-btn btn-details" onclick="showOrderDetails('${order.id}')">
                    Detalhes
                </button>
                ${order.status === 'completed' ? `
                    <button class="action-btn btn-reorder" onclick="reorderItem('${order.id}')">
                        Repetir
                    </button>
                    ${order.rating === 0 ? `
                        <button class="action-btn btn-rate" onclick="rateOrder('${order.id}')">
                            Avaliar
                        </button>
                    ` : ''}
                    <button class="action-btn btn-download" onclick="downloadReceipt('${order.id}')">
                        Recibo
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

function getStatusClass(status) {
    const statusMap = {
        'completed': 'status-completed',
        'cancelled': 'status-cancelled',
        'in-progress': 'status-in-progress'
    };
    return statusMap[status] || '';
}

function getStatusText(status) {
    const statusMap = {
        'completed': 'Concluído',
        'cancelled': 'Cancelado',
        'in-progress': 'Em Andamento'
    };
    return statusMap[status] || status;
}

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

function setupPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);
    
    if (totalPages <= 1) {
        pagination.innerHTML = '';
        return;
    }
    
    let paginationHTML = '';
    
    // Botão anterior
    if (currentPage > 1) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage - 1})">← Anterior</button>`;
    }
    
    // Números das páginas
    for (let i = 1; i <= totalPages; i++) {
        if (i === currentPage || i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) {
            paginationHTML += `<button class="page-btn ${i === currentPage ? 'active' : ''}" onclick="changePage(${i})">${i}</button>`;
        } else if (i === currentPage + 2 || i === currentPage - 2) {
            paginationHTML += `<span class="page-ellipsis">...</span>`;
        }
    }
    
    // Botão próximo
    if (currentPage < totalPages) {
        paginationHTML += `<button class="page-btn" onclick="changePage(${currentPage + 1})">Próximo →</button>`;
    }
    
    pagination.innerHTML = paginationHTML;
}

function changePage(page) {
    currentPage = page;
    displayOrders();
    setupPagination();
    
    // Scroll suave para o topo
    document.querySelector('.orders-section').scrollIntoView({ behavior: 'smooth' });
}

function changeView(view) {
    currentView = view;
    
    // Atualizar botões de visualização
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`).classList.add('active');
    
    // Atualizar visualização
    displayOrders();
}

function setQuickFilter(period) {
    const endDate = new Date();
    let startDate = new Date();
    
    switch (period) {
        case 'week':
            startDate.setDate(startDate.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(startDate.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(startDate.getFullYear() - 1);
            break;
        case 'all':
        default:
            startDate.setFullYear(startDate.getFullYear() - 10);
            break;
    }
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    // Atualizar botões
    document.querySelectorAll('.quick-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    applyFilters();
}

function applyFilters() {
    const startDate = new Date(document.getElementById('startDate').value);
    const endDate = new Date(document.getElementById('endDate').value);
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const sortBy = document.getElementById('sortBy').value;
    
    filteredOrders = currentOrders.filter(order => {
        const orderDate = new Date(order.date);
        
        // Filtro de data
        if (orderDate < startDate || orderDate > endDate) return false;
        
        // Filtro de busca
        if (searchTerm && !order.id.toLowerCase().includes(searchTerm) && 
            !order.origin.toLowerCase().includes(searchTerm) && 
            !order.destination.toLowerCase().includes(searchTerm) &&
            !(order.motoboy && order.motoboy.toLowerCase().includes(searchTerm))) {
            return false;
        }
        
        // Filtro de status
        if (statusFilter !== 'all' && order.status !== statusFilter) return false;
        
        return true;
    });
    
    // Ordenação
    filteredOrders.sort((a, b) => {
        switch (sortBy) {
            case 'date_desc':
                return new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time);
            case 'date_asc':
                return new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time);
            case 'value_desc':
                return b.value - a.value;
            case 'value_asc':
                return a.value - b.value;
            default:
                return 0;
        }
    });
    
    currentPage = 1;
    updateStatistics();
    displayOrders();
    setupPagination();
}

function searchHistory() {
    applyFilters();
}

function clearAllFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('statusFilter').value = 'all';
    document.getElementById('sortBy').value = 'date_desc';
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);
    
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
    
    // Resetar filtros rápidos
    document.querySelectorAll('.quick-filter').forEach(btn => btn.classList.remove('active'));
    document.querySelector('[onclick="setQuickFilter(\'all\')"]').classList.add('active');
    
    filteredOrders = [...currentOrders];
    currentPage = 1;
    updateStatistics();
    displayOrders();
    setupPagination();
}

function showOrderDetails(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('orderDetailsModal');
    const modalTitle = document.getElementById('modalOrderTitle');
    const modalBody = document.getElementById('modalOrderBody');
    
    modalTitle.textContent = `Pedido #${order.id}`;
    
    modalBody.innerHTML = `
        <div class="order-details-content">
            <div class="detail-section">
                <h3>📋 Informações Gerais</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <span class="detail-label">Data:</span>
                        <span class="detail-value">${formatDate(order.date)} às ${order.time}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value">
                            <span class="order-status ${getStatusClass(order.status)}">${getStatusText(order.status)}</span>
                        </span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Valor:</span>
                        <span class="detail-value">R$ ${order.value.toFixed(2)}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Pagamento:</span>
                        <span class="detail-value">${order.paymentMethod}</span>
                    </div>
                </div>
            </div>
            
            <div class="detail-section">
                <h3>🗺️ Rota da Entrega</h3>
                <div class="route-details">
                    <div class="route-point">
                        <span class="route-marker origin">📍</span>
                        <div>
                            <strong>Origem:</strong><br>
                            ${order.origin}
                        </div>
                    </div>
                    <div class="route-line"></div>
                    <div class="route-point">
                        <span class="route-marker destination">🎯</span>
                        <div>
                            <strong>Destino:</strong><br>
                            ${order.destination}
                        </div>
                    </div>
                </div>
            </div>
            
            ${order.items ? `
                <div class="detail-section">
                    <h3>📦 Itens da Entrega</h3>
                    <ul class="items-list">
                        ${order.items.map(item => `<li>${item}</li>`).join('')}
                    </ul>
                </div>
            ` : ''}
            
            ${order.motoboy ? `
                <div class="detail-section">
                    <h3>🏍️ Motoboy</h3>
                    <div class="motoboy-info">
                        <div class="motoboy-details">
                            <strong>${order.motoboy}</strong><br>
                            <span class="phone-number">${order.motoboyPhone}</span><br>
                            ${order.deliveryTime > 0 ? `<span class="delivery-time">Tempo de entrega: ${order.deliveryTime} minutos</span>` : ''}
                        </div>
                        ${order.rating > 0 ? `
                            <div class="rating-display">
                                <div class="stars">${'⭐'.repeat(order.rating)}</div>
                                <div class="rating-text">${order.rating}/5</div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            ` : ''}
            
            ${order.feedback ? `
                <div class="detail-section">
                    <h3>💬 Sua Avaliação</h3>
                    <div class="feedback-content">
                        <p>"${order.feedback}"</p>
                    </div>
                </div>
            ` : ''}
            
            ${order.cancelReason ? `
                <div class="detail-section">
                    <h3>❌ Motivo do Cancelamento</h3>
                    <div class="cancel-reason">
                        <p>${order.cancelReason}</p>
                    </div>
                </div>
            ` : ''}
        </div>
    `;
    
    // Configurar botão de repetir pedido
    const reorderBtn = document.getElementById('reorderBtn');
    if (order.status === 'completed') {
        reorderBtn.style.display = 'block';
        reorderBtn.onclick = () => reorderItem(orderId);
    } else {
        reorderBtn.style.display = 'none';
    }
    
    modal.style.display = 'block';
}

function rateOrder(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;
    
    const modal = document.getElementById('ratingModal');
    selectedRating = 0;
    
    // Resetar estrelas
    document.querySelectorAll('.star').forEach(star => {
        star.classList.remove('active');
        star.onclick = () => selectRating(parseInt(star.dataset.rating));
    });
    
    document.getElementById('reviewComment').value = '';
    modal.style.display = 'block';
    
    // Armazenar ID do pedido para submissão
    modal.dataset.orderId = orderId;
}

function selectRating(rating) {
    selectedRating = rating;
    
    document.querySelectorAll('.star').forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function submitRating() {
    const orderId = document.getElementById('ratingModal').dataset.orderId;
    const comment = document.getElementById('reviewComment').value;
    
    if (selectedRating === 0) {
        alert('Por favor, selecione uma avaliação');
        return;
    }
    
    // Atualizar ordem na lista
    const orderIndex = currentOrders.findIndex(o => o.id === orderId);
    if (orderIndex !== -1) {
        currentOrders[orderIndex].rating = selectedRating;
        currentOrders[orderIndex].feedback = comment;
    }
    
    // Mostrar feedback
    showNotification('Avaliação enviada com sucesso! Obrigado pelo seu feedback.', 'success');
    
    // Fechar modal e atualizar visualização
    closeModal();
    applyFilters();
}

function reorderItem(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // Simular redirecionamento para nova entrega com dados pré-preenchidos
    showNotification('Redirecionando para criar novo pedido com os mesmos dados...', 'info');
    
    // Salvar dados para reutilização
    localStorage.setItem('reorderData', JSON.stringify({
        origin: order.origin,
        destination: order.destination,
        items: order.items
    }));
    
    setTimeout(() => {
        window.location.href = 'cadastrarPedido.html';
    }, 2000);
}

function downloadReceipt(orderId) {
    const order = currentOrders.find(o => o.id === orderId);
    if (!order) return;
    
    // Simular download de recibo
    showNotification('Gerando recibo... Download iniciará em breve.', 'info');
    
    // Simular criação de PDF
    setTimeout(() => {
        const receiptData = {
            orderId: order.id,
            date: order.date,
            time: order.time,
            origin: order.origin,
            destination: order.destination,
            value: order.value,
            paymentMethod: order.paymentMethod,
            motoboy: order.motoboy
        };
        
        // Criar blob simulado
        const blob = new Blob([JSON.stringify(receiptData, null, 2)], {
            type: 'application/json'
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recibo-${order.id}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showNotification('Recibo baixado com sucesso!', 'success');
    }, 1500);
}

function exportHistory() {
    showNotification('Preparando exportação...', 'info');
    
    setTimeout(() => {
        const csvContent = generateCSV(filteredOrders);
        downloadCSV(csvContent, 'historico-pedidos.csv');
        showNotification('Histórico exportado com sucesso!', 'success');
    }, 1000);
}

function generateCSV(orders) {
    const headers = ['ID', 'Data', 'Hora', 'Status', 'Origem', 'Destino', 'Valor', 'Motoboy', 'Avaliação'];
    const rows = orders.map(order => [
        order.id,
        order.date,
        order.time,
        getStatusText(order.status),
        order.origin,
        order.destination,
        `R$ ${order.value.toFixed(2)}`,
        order.motoboy || 'N/A',
        order.rating || 'N/A'
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
}

function downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function refreshHistory() {
    showNotification('Atualizando histórico...', 'info');
    loadHistoryData();
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.style.display = 'none';
    });
}

function setupEventListeners() {
    // Filtros de data
    document.getElementById('startDate').addEventListener('change', applyFilters);
    document.getElementById('endDate').addEventListener('change', applyFilters);
    
    // Filtros de status e ordenação
    document.getElementById('statusFilter').addEventListener('change', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    
    // Busca em tempo real
    let searchTimeout;
    document.getElementById('searchInput').addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(applyFilters, 300);
    });
    
    // Enter na busca
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
    
    // Fechar modal ao clicar fora
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            closeModal();
        }
    });
    
    // ESC para fechar modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function showLoading() {
    const container = document.getElementById('ordersContainer');
    container.innerHTML = `
        <div class="loading-state">
            <div class="loading-spinner"></div>
            <p>Carregando histórico...</p>
        </div>
    `;
}

function hideLoading() {
    // A função displayOrders() já substitui o conteúdo
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 1001;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
    `;
    
    document.body.appendChild(notification);
    
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
    
    .loading-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 60px 20px;
        color: #ddd;
    }
    
    .loading-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid rgba(255, 255, 255, 0.3);
        border-top: 4px solid #3498db;
        border-radius: 50%;
        animation: spin 1s linear infinite;
        margin-bottom: 20px;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    .order-details-content {
        color: #fff;
    }
    
    .detail-section {
        margin-bottom: 30px;
    }
    
    .detail-section h3 {
        margin-bottom: 15px;
        color: #3498db;
        font-size: 1.1rem;
    }
    
    .detail-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
    }
    
    .detail-item {
        display: flex;
        flex-direction: column;
        gap: 5px;
    }
    
    .detail-label {
        font-size: 0.85rem;
        color: #ddd;
        font-weight: 500;
    }
    
    .detail-value {
        font-weight: 600;
        color: #fff;
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
    
    .route-marker {
        font-size: 1.5rem;
        min-width: 30px;
    }
    
    .route-line {
        height: 20px;
        width: 2px;
        background: #3498db;
        margin-left: 14px;
    }
    
    .items-list {
        list-style: none;
        padding: 0;
    }
    
    .items-list li {
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .items-list li:before {
        content: "📦 ";
        margin-right: 8px;
    }
    
    .motoboy-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
    }
    
    .phone-number {
        color: #3498db;
        text-decoration: none;
    }
    
    .delivery-time {
        color: #27ae60;
        font-size: 0.9rem;
    }
    
    .rating-display {
        text-align: center;
    }
    
    .stars {
        font-size: 1.2rem;
        margin-bottom: 5px;
    }
    
    .rating-text {
        font-size: 0.9rem;
        color: #ddd;
    }
    
    .feedback-content {
        padding: 15px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        border-left: 4px solid #3498db;
    }
    
    .cancel-reason {
        padding: 15px;
        background: rgba(231, 76, 60, 0.2);
        border-radius: 8px;
        border-left: 4px solid #e74c3c;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        width: 20px;
        height: 20px;
    }
`;

document.head.appendChild(dynamicStyles);