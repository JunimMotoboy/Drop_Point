// Dashboard do Usuário - JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário está logado
    checkUserLogin();
    
    // Carregar dados do usuário
    loadUserData();
    
    // Carregar pedidos recentes
    loadRecentOrders();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Inicializar sistema de notificações
    initNotificationSystem();
    
    // Simular notificações em tempo real
    startRealtimeUpdates();
});

// ===============================
// GOOGLE MAPS INTEGRATION - CLIENTE
// ===============================

let clientMap = null;
let clientMarker = null;
let motoboyMarker = null;
let clientPosition = { lat: -23.5618, lng: -46.6565 }; // Posição do cliente
let motoboyPosition = { lat: -23.5505, lng: -46.6333 }; // Posição inicial do motoboy
let trackingActive = false;
let trackingInterval = null;

// Dados simulados do motoboy
const motoboyData = {
    nome: 'João Silva',
    rating: 4.9,
    veiculo: 'Honda CG 160',
    placa: 'ABC-1234',
    telefone: '(11) 98888-7777',
    totalEntregas: 187,
    foto: 'https://via.placeholder.com/60x60/007bff/white?text=JS'
};

// Dados simulados do pedido
const pedidoAtual = {
    id: 'PED001',
    status: 'A caminho',
    restaurante: 'Restaurante Italiano',
    itens: ['Pizza Margherita', 'Coca-Cola 2L'],
    valor: 45.90,
    tempoEstimado: 25,
    distancia: 2.8
};

// Inicializar Google Maps para cliente
function initClientMap() {
    console.log('Inicializando Google Maps para cliente...');
    
    // Verificar se a API foi carregada
    if (typeof google === 'undefined') {
        console.error('Google Maps API não carregada');
        return;
    }
    
    console.log('Google Maps API carregada com sucesso para cliente');
}

// Abrir rastreamento ao vivo
function openLiveTracking() {
    const modal = document.getElementById('trackingModal');
    if (!modal) {
        console.error('Modal de rastreamento não encontrado');
        return;
    }
    
    // Mostrar modal
    modal.style.display = 'flex';
    
    // Aguardar animação e inicializar mapa
    setTimeout(() => {
        initTrackingMap();
        startTracking();
    }, 300);
    
    // Atualizar informações do motoboy
    updateMotoboyInfo();
    
    // Iniciar simulação de progresso
    startDeliveryProgress();
}

// Fechar modal de rastreamento
function closeTracking() {
    const modal = document.getElementById('trackingModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Parar rastreamento
    stopTracking();
    
    // Limpar mapa
    if (clientMap) {
        if (clientMarker) clientMarker.setMap(null);
        if (motoboyMarker) motoboyMarker.setMap(null);
    }
}

// Inicializar mapa de rastreamento
function initTrackingMap() {
    if (typeof google === 'undefined') {
        console.log('Google Maps não disponível, usando simulação');
        simulateTrackingMap();
        return;
    }
    
    const mapElement = document.getElementById('trackingMap');
    if (!mapElement) {
        console.error('Elemento do mapa de rastreamento não encontrado');
        return;
    }
    
    // Configurações do mapa
    const mapOptions = {
        zoom: 13,
        center: clientPosition,
        mapTypeId: 'roadmap',
        styles: [
            {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
            }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
        zoomControlOptions: {
            position: google.maps.ControlPosition.TOP_RIGHT
        }
    };
    
    // Criar mapa
    clientMap = new google.maps.Map(mapElement, mapOptions);
    
    // Criar marcadores
    createTrackingMarkers();
    
    // Ajustar visualização para mostrar ambos os marcadores
    const bounds = new google.maps.LatLngBounds();
    bounds.extend(clientPosition);
    bounds.extend(motoboyPosition);
    clientMap.fitBounds(bounds);
    
    console.log('Mapa de rastreamento inicializado');
}

// Criar marcadores de rastreamento
function createTrackingMarkers() {
    // Marcador do cliente
    clientMarker = new google.maps.Marker({
        position: clientPosition,
        map: clientMap,
        title: 'Sua localização',
        icon: {
            url: 'data:image/svg+xml;base64,' + btoa(`
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="20" cy="20" r="18" fill="#28a745" stroke="white" stroke-width="4"/>
                    <circle cx="20" cy="20" r="8" fill="white"/>
                    <circle cx="20" cy="20" r="4" fill="#28a745"/>
                </svg>
            `),
            scaledSize: new google.maps.Size(40, 40),
            anchor: new google.maps.Point(20, 20)
        }
    });
    
    // Marcador do motoboy
    motoboyMarker = new google.maps.Marker({
        position: motoboyPosition,
        map: clientMap,
        title: `${motoboyData.nome} - ${motoboyData.veiculo}`,
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
    
    // Parar animação após 2 segundos
    setTimeout(() => {
        if (motoboyMarker) {
            motoboyMarker.setAnimation(null);
        }
    }, 2000);
    
    // InfoWindows
    const clientInfoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; font-family: 'Inter', sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #333;">📍 Sua localização</h4>
                <p style="margin: 0; font-size: 14px; color: #666;">Aguardando entrega</p>
            </div>
        `
    });
    
    const motoboyInfoWindow = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px; font-family: 'Inter', sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #333;">🏍️ ${motoboyData.nome}</h4>
                <p style="margin: 0; font-size: 14px; color: #666;">${motoboyData.veiculo} • ${motoboyData.placa}</p>
                <p style="margin: 5px 0 0 0; font-size: 12px; color: #007bff; font-weight: 600;">⭐ ${motoboyData.rating} • ${motoboyData.totalEntregas} entregas</p>
            </div>
        `
    });
    
    // Eventos de clique
    clientMarker.addListener('click', () => {
        motoboyInfoWindow.close();
        clientInfoWindow.open(clientMap, clientMarker);
    });
    
    motoboyMarker.addListener('click', () => {
        clientInfoWindow.close();
        motoboyInfoWindow.open(clientMap, motoboyMarker);
    });
}

// Iniciar rastreamento
function startTracking() {
    if (trackingActive) return;
    
    trackingActive = true;
    let moveStep = 0;
    const totalSteps = 60; // 2 minutos de simulação
    
    trackingInterval = setInterval(() => {
        if (moveStep >= totalSteps) {
            clearInterval(trackingInterval);
            trackingActive = false;
            showDeliveryComplete();
            return;
        }
        
        // Simular movimento do motoboy em direção ao cliente
        const progress = moveStep / totalSteps;
        const lat = motoboyPosition.lat + (clientPosition.lat - motoboyPosition.lat) * progress;
        const lng = motoboyPosition.lng + (clientPosition.lng - motoboyPosition.lng) * progress;
        
        const newPosition = { lat, lng };
        
        // Atualizar marcador no mapa
        if (motoboyMarker) {
            motoboyMarker.setPosition(newPosition);
        }
        
        // Atualizar informações de distância e tempo
        const remainingDistance = (pedidoAtual.distancia * (1 - progress)).toFixed(1);
        const remainingTime = Math.ceil(pedidoAtual.tempoEstimado * (1 - progress));
        
        // Atualizar UI
        const distanceElement = document.getElementById('motoboyDistance');
        const etaElement = document.getElementById('motoboyEta');
        
        if (distanceElement) {
            distanceElement.textContent = remainingDistance + ' km';
        }
        
        if (etaElement) {
            etaElement.textContent = remainingTime + ' min';
        }
        
        // Adicionar timeline de eventos
        if (moveStep === 15) {
            addTimelineEvent('🍽️ Pedido coletado no restaurante', new Date().toLocaleTimeString());
        } else if (moveStep === 30) {
            addTimelineEvent('🚗 A caminho do seu endereço', new Date().toLocaleTimeString());
        } else if (moveStep === 45) {
            addTimelineEvent('📍 Chegando ao seu bairro', new Date().toLocaleTimeString());
        }
        
        moveStep++;
    }, 2000); // Atualizar a cada 2 segundos
}

// Parar rastreamento
function stopTracking() {
    if (trackingInterval) {
        clearInterval(trackingInterval);
        trackingInterval = null;
    }
    trackingActive = false;
}

// Atualizar informações do motoboy
function updateMotoboyInfo() {
    document.getElementById('motoboyName').textContent = motoboyData.nome;
    document.getElementById('motoboyRating').textContent = motoboyData.rating;
    document.getElementById('motoboyVehicle').textContent = motoboyData.veiculo;
    document.getElementById('motoboyDistance').textContent = pedidoAtual.distancia + ' km';
    document.getElementById('motoboyEta').textContent = pedidoAtual.tempoEstimado + ' min';
    
    // Atualizar foto (placeholder)
    const fotoElement = document.getElementById('motoboyPhoto');
    if (fotoElement) {
        fotoElement.src = motoboyData.foto;
        fotoElement.alt = motoboyData.nome;
    }
}

// Iniciar progresso da entrega
function startDeliveryProgress() {
    const phases = [
        { id: 'preparing', label: 'Preparando', duration: 0 },
        { id: 'collected', label: 'Coletado', duration: 5000 },
        { id: 'onway', label: 'A caminho', duration: 10000 },
        { id: 'nearby', label: 'Próximo', duration: 45000 }
    ];
    
    let currentPhase = 0;
    
    function updatePhase() {
        // Marcar fase atual como ativa
        phases.forEach((phase, index) => {
            const element = document.getElementById(phase.id);
            if (element) {
                if (index <= currentPhase) {
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            }
        });
        
        currentPhase++;
        
        if (currentPhase < phases.length) {
            setTimeout(updatePhase, phases[currentPhase].duration);
        }
    }
    
    // Iniciar primeira fase
    updatePhase();
}

// Adicionar evento na timeline
function addTimelineEvent(message, time) {
    const timeline = document.querySelector('.delivery-timeline');
    if (!timeline) return;
    
    const eventElement = document.createElement('div');
    eventElement.className = 'timeline-event';
    eventElement.innerHTML = `
        <div class="timeline-time">${time}</div>
        <div class="timeline-message">${message}</div>
    `;
    
    timeline.appendChild(eventElement);
    
    // Scroll para o final
    timeline.scrollTop = timeline.scrollHeight;
}

// Mostrar conclusão da entrega
function showDeliveryComplete() {
    addTimelineEvent('✅ Entrega concluída com sucesso!', new Date().toLocaleTimeString());
    
    // Atualizar status
    document.getElementById('motoboyDistance').textContent = '0 km';
    document.getElementById('motoboyEta').textContent = 'Entregue';
    
    // Marcar todas as fases como concluídas
    document.querySelectorAll('.status-step').forEach(step => {
        step.classList.add('active');
    });
    
    // Mostrar notificação
    setTimeout(() => {
        if (confirm('🎉 Sua entrega foi concluída! Deseja avaliar o motoboy?')) {
            closeTracking();
            // Aqui poderia abrir modal de avaliação
        }
    }, 2000);
}

// Ligar para o motoboy
function callMotoboy() {
    const phone = motoboyData.telefone;
    if (confirm(`Ligar para ${motoboyData.nome}?\n${phone}`)) {
        window.open(`tel:${phone}`, '_self');
    }
}

// Abrir chat com motoboy
function chatWithMotoboy() {
    const whatsapp = motoboyData.telefone.replace(/\D/g, '');
    const message = encodeURIComponent(`Olá ${motoboyData.nome}, estou acompanhando minha entrega ${pedidoAtual.id}.`);
    const whatsappUrl = `https://wa.me/55${whatsapp}?text=${message}`;
    
    window.open(whatsappUrl, '_blank');
}

// Simulação para quando Google Maps não estiver disponível
function simulateTrackingMap() {
    const mapElement = document.getElementById('trackingMap');
    if (mapElement) {
        mapElement.innerHTML = `
            <div style="
                width: 100%;
                height: 100%;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: 'Inter', sans-serif;
                text-align: center;
                padding: 20px;
                box-sizing: border-box;
                position: relative;
                overflow: hidden;
            ">
                <div style="
                    position: absolute;
                    top: -50%;
                    left: -50%;
                    width: 200%;
                    height: 200%;
                    background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
                    background-size: 30px 30px;
                    animation: moveGrid 20s linear infinite;
                "></div>
                
                <div style="position: relative; z-index: 1;">
                    <div style="font-size: 40px; margin-bottom: 15px;">🗺️</div>
                    <h3 style="margin: 0 0 10px 0; font-weight: 600;">Rastreamento Ativo</h3>
                    <p style="margin: 0 0 25px 0; opacity: 0.9; font-size: 14px;">Acompanhando ${motoboyData.nome} em tempo real</p>
                    
                    <div style="
                        background: rgba(255,255,255,0.2);
                        backdrop-filter: blur(10px);
                        padding: 20px;
                        border-radius: 15px;
                        border: 1px solid rgba(255,255,255,0.3);
                        margin-top: 20px;
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                            <div style="text-align: left;">
                                <div style="font-size: 24px; margin-bottom: 5px;">🏍️</div>
                                <div style="font-size: 12px; opacity: 0.8;">Motoboy</div>
                            </div>
                            <div style="
                                flex: 1;
                                margin: 0 15px;
                                height: 2px;
                                background: rgba(255,255,255,0.3);
                                border-radius: 1px;
                                position: relative;
                                overflow: hidden;
                            ">
                                <div style="
                                    position: absolute;
                                    left: 0;
                                    top: 0;
                                    height: 100%;
                                    width: 60%;
                                    background: #4CAF50;
                                    border-radius: 1px;
                                    animation: progressMove 3s ease-in-out infinite;
                                "></div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 24px; margin-bottom: 5px;">📍</div>
                                <div style="font-size: 12px; opacity: 0.8;">Você</div>
                            </div>
                        </div>
                        
                        <div style="
                            display: grid;
                            grid-template-columns: 1fr 1fr;
                            gap: 15px;
                            font-size: 14px;
                        ">
                            <div>
                                <div style="opacity: 0.8;">Distância</div>
                                <div style="font-weight: 600; font-size: 16px;">${pedidoAtual.distancia} km</div>
                            </div>
                            <div>
                                <div style="opacity: 0.8;">Tempo Est.</div>
                                <div style="font-weight: 600; font-size: 16px;">${pedidoAtual.tempoEstimado} min</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <style>
                    @keyframes moveGrid {
                        0% { transform: translate(0, 0); }
                        100% { transform: translate(30px, 30px); }
                    }
                    
                    @keyframes progressMove {
                        0%, 100% { width: 60%; }
                        50% { width: 70%; }
                    }
                </style>
            </div>
        `;
    }
    
    // Iniciar rastreamento simulado
    startTracking();
}

function checkUserLogin() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const userData = localStorage.getItem('user');
    
    if (!isLoggedIn || isLoggedIn !== 'true' || !userData) {
        // Usuário não está logado, redirecionar para login
        window.location.href = 'loginUsuario.html';
        return false;
    }
    return true;
}

function loadUserData() {
    try {
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (userData) {
            // Atualizar elementos da interface com dados do usuário
            document.getElementById('userName').textContent = userData.nome || 'Usuário';
            document.getElementById('profileName').textContent = userData.nome || 'Usuário';
            document.getElementById('profileEmail').textContent = userData.email || 'usuario@email.com';
            
            // Carregar avatar se disponível
            if (userData.avatar) {
                const avatarImg = document.getElementById('userAvatar');
                const avatarPlaceholder = document.querySelector('.avatar-placeholder');
                
                avatarImg.src = userData.avatar;
                avatarImg.style.display = 'block';
                avatarPlaceholder.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
    }
}

function loadRecentOrders() {
    const ordersList = document.getElementById('recentOrdersList');
    
    // Mostrar loading
    ordersList.innerHTML = '<div class="loading-orders">Carregando pedidos...</div>';
    
    // Simular carregamento dos pedidos (substitua pela chamada real à API)
    setTimeout(() => {
        const mockOrders = [
            {
                id: 'DP001',
                origem: 'Rua A, 123',
                destino: 'Rua B, 456',
                status: 'in-progress',
                statusText: 'Em andamento',
                date: '2025-10-27',
                time: '14:30'
            },
            {
                id: 'DP002',
                origem: 'Centro',
                destino: 'Zona Sul',
                status: 'pending',
                statusText: 'Pendente',
                date: '2025-10-27',
                time: '13:15'
            },
            {
                id: 'DP003',
                origem: 'Shopping A',
                destino: 'Residencial B',
                status: 'delivered',
                statusText: 'Entregue',
                date: '2025-10-26',
                time: '16:45'
            }
        ];
        
        displayOrders(mockOrders);
    }, 1000);
}

function displayOrders(orders) {
    const ordersList = document.getElementById('recentOrdersList');
    
    if (orders.length === 0) {
        ordersList.innerHTML = `
            <div class="no-orders">
                <p>Nenhum pedido encontrado</p>
                <button onclick="navigateTo('cadastrarPedido.html')" class="create-order-btn">
                    Criar Primeiro Pedido
                </button>
            </div>
        `;
        return;
    }
    
    ordersList.innerHTML = orders.map(order => `
        <div class="order-item" onclick="viewOrderDetails('${order.id}')">
            <div class="order-info">
                <div class="order-id">#${order.id}</div>
                <div class="order-details">
                    ${order.origem} → ${order.destino}<br>
                    <small>${formatDate(order.date)} às ${order.time}</small>
                </div>
            </div>
            <div class="order-status status-${order.status}">
                ${order.statusText}
            </div>
        </div>
    `).join('');
}

function navigateTo(page) {
    // Adicionar loading state
    showPageLoading();
    
    // Verificar se é um nome de arquivo e corrigir o caminho se necessário
    let targetUrl = page;
    
    // Mapear nomes de páginas para URLs corretas
    const pageMap = {
        'cadastrarPedido.html': 'cadastrarPedido.html',
        'acompanharPedidos.html': 'acompanharPedidos.html',
        'historicoDePedidos.html': 'historicoDePedidos.html',
        'dashboardEntregamovel.html': 'dashboardEntregamovel.html'
    };
    
    if (pageMap[page]) {
        targetUrl = pageMap[page];
    }
    
    // Simular delay de navegação
    setTimeout(() => {
        window.location.href = targetUrl;
    }, 300);
}

function viewOrderDetails(orderId) {
    // Implementar visualização de detalhes do pedido
    alert(`Visualizando pedido ${orderId}\n\nEsta funcionalidade será implementada em breve!`);
}

function logout() {
    if (confirm('Tem certeza que deseja sair?')) {
        // Limpar dados do localStorage
        localStorage.removeItem('user');
        localStorage.removeItem('isLoggedIn');
        
        // Mostrar feedback
        showNotification('Logout realizado com sucesso!', 'success');
        
        // Redirecionar após um breve delay
        setTimeout(() => {
            window.location.href = '../../index.html';
        }, 1500);
    }
}

function emergencyContact() {
    const modal = createModal('Contato de Emergência', `
        <div class="emergency-content">
            <p><strong>🚨 Central de Emergência 24h</strong></p>
            <p>📞 <a href="tel:190">190 - Polícia</a></p>
            <p>📞 <a href="tel:192">192 - SAMU</a></p>
            <p>📞 <a href="tel:193">193 - Bombeiros</a></p>
            <hr style="margin: 20px 0; border: 1px solid rgba(255,255,255,0.2);">
            <p><strong>📞 Suporte DropPoint</strong></p>
            <p><a href="tel:+5511999999999">(11) 99999-9999</a></p>
            <p><a href="mailto:emergencia@droppoint.com">emergencia@droppoint.com</a></p>
        </div>
    `);
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function contactSupport() {
    const modal = createModal('Suporte ao Cliente', `
        <div class="support-content">
            <p><strong>💬 Entre em contato conosco</strong></p>
            <div class="support-options">
                <button onclick="openWhatsApp()" class="support-btn whatsapp">
                    📱 WhatsApp
                </button>
                <button onclick="openEmail()" class="support-btn email">
                    📧 E-mail
                </button>
                <button onclick="openChat()" class="support-btn chat">
                    💬 Chat Online
                </button>
            </div>
            <div class="faq-section">
                <h4>❓ Perguntas Frequentes</h4>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">Como rastrear meu pedido?</div>
                    <div class="faq-answer">Você pode acompanhar seu pedido em tempo real na seção "Acompanhar Pedidos".</div>
                </div>
                <div class="faq-item" onclick="toggleFaq(this)">
                    <div class="faq-question">Quanto tempo demora a entrega?</div>
                    <div class="faq-answer">Nossas entregas são realizadas em até 2 horas na região metropolitana.</div>
                </div>
            </div>
        </div>
    `);
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
}

function quickTracking() {
    document.getElementById('trackingModal').style.display = 'block';
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
        if (modal.id !== 'trackingModal') {
            modal.remove();
        }
    });
}

function trackOrder() {
    const trackingCode = document.getElementById('trackingCode').value.trim();
    const resultDiv = document.getElementById('trackingResult');
    
    if (!trackingCode) {
        alert('Por favor, digite o código do pedido');
        return;
    }
    
    // Simular busca (substitua pela chamada real à API)
    resultDiv.innerHTML = '<div class="loading">Buscando informações...</div>';
    resultDiv.style.display = 'block';
    
    setTimeout(() => {
        // Simulação de resultado
        const mockResult = {
            id: trackingCode,
            status: 'Em trânsito',
            location: 'Rua das Flores, 123',
            estimatedTime: '15 minutos',
            motoboy: 'João Silva',
            phone: '(11) 99999-8888'
        };
        
        resultDiv.innerHTML = `
            <div class="tracking-info">
                <h4>📦 Pedido ${mockResult.id}</h4>
                <p><strong>Status:</strong> ${mockResult.status}</p>
                <p><strong>Localização:</strong> ${mockResult.location}</p>
                <p><strong>Previsão:</strong> ${mockResult.estimatedTime}</p>
                <p><strong>Motoboy:</strong> ${mockResult.motoboy}</p>
                <p><strong>Contato:</strong> ${mockResult.phone}</p>
            </div>
        `;
    }, 1500);
}

function createModal(title, content) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeModal()">&times;</span>
            <h2>${title}</h2>
            ${content}
        </div>
    `;
    return modal;
}

function openWhatsApp() {
    window.open('https://wa.me/5511999999999?text=Olá, preciso de ajuda com o DropPoint', '_blank');
}

function openEmail() {
    window.open('mailto:suporte@droppoint.com?subject=Suporte DropPoint&body=Olá, preciso de ajuda com...', '_blank');
}

function openChat() {
    showNotification('Chat online será implementado em breve!', 'info');
}

function toggleFaq(element) {
    const answer = element.querySelector('.faq-answer');
    const isOpen = answer.style.display === 'block';
    
    // Fechar todas as outras FAQs
    document.querySelectorAll('.faq-answer').forEach(ans => {
        ans.style.display = 'none';
    });
    
    // Abrir/fechar a FAQ clicada
    answer.style.display = isOpen ? 'none' : 'block';
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
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Adicionar estilos inline para a notificação
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
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function showPageLoading() {
    // Criar overlay de loading
    const loadingOverlay = document.createElement('div');
    loadingOverlay.id = 'pageLoading';
    loadingOverlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1002;
        backdrop-filter: blur(5px);
    `;
    
    loadingOverlay.innerHTML = `
        <div style="text-align: center; color: white;">
            <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 20px;"></div>
            <p>Carregando...</p>
        </div>
    `;
    
    document.body.appendChild(loadingOverlay);
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

function setupEventListeners() {
    // Fechar modal ao clicar fora dele
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                closeModal();
            }
        });
    });
    
    // Fechar modal de rastreamento clicando fora
    const trackingModal = document.getElementById('trackingModal');
    if (trackingModal) {
        trackingModal.addEventListener('click', function(e) {
            if (e.target === trackingModal) {
                closeTracking();
            }
        });
    }
    
    // Tecla ESC para fechar modais
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeModal();
            closeTracking();
        }
    });
    
    // Enter no campo de rastreamento
    const trackingCode = document.getElementById('trackingCode');
    if (trackingCode) {
        trackingCode.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                trackOrder();
            }
        });
    }
    
    // Configurar eventos do chat
    setupChatEventListeners();
}

// Adicionar estilos CSS dinamicamente para melhor apresentação
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
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .support-options {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin: 20px 0;
    }
    
    .support-btn {
        padding: 12px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .support-btn.whatsapp {
        background: #25d366;
        color: white;
    }
    
    .support-btn.email {
        background: #3498db;
        color: white;
    }
    
    .support-btn.chat {
        background: #9b59b6;
        color: white;
    }
    
    .faq-section {
        margin-top: 20px;
    }
    
    .faq-item {
        margin-bottom: 10px;
        cursor: pointer;
    }
    
    .faq-question {
        padding: 10px;
        background: rgba(255,255,255,0.1);
        border-radius: 5px;
        font-weight: 600;
    }
    
    .faq-answer {
        padding: 10px;
        background: rgba(255,255,255,0.05);
        border-radius: 0 0 5px 5px;
        display: none;
        font-size: 0.9rem;
    }
    
    .loading-orders {
        text-align: center;
        padding: 40px;
        color: #ddd;
    }
    
    .no-orders {
        text-align: center;
        padding: 40px;
        color: #ddd;
    }
    
    .create-order-btn {
        background: #3498db;
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        margin-top: 15px;
        transition: background 0.3s ease;
    }
    
    .create-order-btn:hover {
        background: #2980b9;
    }
    
    .tracking-info {
        background: rgba(255,255,255,0.1);
        padding: 15px;
        border-radius: 8px;
        margin-top: 15px;
    }
    
    .tracking-info h4 {
        margin-bottom: 10px;
        color: #3498db;
    }
    
    .tracking-info p {
        margin-bottom: 8px;
        font-size: 0.9rem;
    }
    
    .emergency-content a {
        color: #3498db;
        text-decoration: none;
    }
    
    .emergency-content a:hover {
        text-decoration: underline;
    }
    
    .quick-btn.chat {
        background: #9b59b6;
        color: #fff;
    }
    
    .quick-btn.chat:hover {
        background: #8e44ad;
        transform: translateY(-2px);
    }
    
    /* Chat Widget Styles */
    .chat-widget {
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 320px;
        max-height: 500px;
        background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
        border-radius: 15px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        display: none;
        flex-direction: column;
        overflow: hidden;
    }
    
    .chat-widget.open {
        display: flex;
    }
    
    .chat-header {
        padding: 15px 20px;
        background: #34495e;
        display: flex;
        align-items: center;
        gap: 12px;
        cursor: pointer;
        user-select: none;
    }
    
    .chat-avatar {
        width: 40px;
        height: 40px;
        background: #3498db;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.2rem;
    }
    
    .chat-info {
        flex: 1;
    }
    
    .chat-name {
        display: block;
        font-weight: 600;
        color: white;
        font-size: 0.9rem;
    }
    
    .chat-status {
        display: block;
        font-size: 0.75rem;
        color: #27ae60;
    }
    
    .chat-toggle {
        background: none;
        border: none;
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        transition: transform 0.3s ease;
    }
    
    .chat-widget.minimized .chat-toggle {
        transform: rotate(180deg);
    }
    
    .chat-body {
        display: flex;
        flex-direction: column;
        height: 400px;
        transition: all 0.3s ease;
    }
    
    .chat-widget.minimized .chat-body {
        height: 0;
        overflow: hidden;
    }
    
    .chat-messages {
        flex: 1;
        padding: 15px;
        overflow-y: auto;
        background: #2c3e50;
    }
    
    .message {
        margin-bottom: 15px;
        display: flex;
        align-items: flex-start;
        gap: 10px;
    }
    
    .message.sent {
        justify-content: flex-end;
    }
    
    .message.sent .message-content {
        background: #3498db;
        color: white;
        border-radius: 18px 18px 4px 18px;
    }
    
    .message.received .message-content {
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border-radius: 18px 18px 18px 4px;
    }
    
    .message-content {
        max-width: 70%;
        padding: 10px 15px;
        font-size: 0.85rem;
        line-height: 1.4;
    }
    
    .message-time {
        font-size: 0.7rem;
        color: #95a5a6;
        margin-top: 5px;
        text-align: right;
    }
    
    .message.received .message-time {
        text-align: left;
    }
    
    .typing-indicator {
        display: flex;
        align-items: center;
        padding: 10px 15px;
        font-style: italic;
        color: #95a5a6;
        font-size: 0.8rem;
        gap: 8px;
    }
    
    .typing-dots {
        display: inline-block;
        position: relative;
    }
    
    .typing-dots::after {
        content: '...';
        animation: typing 1.5s infinite;
    }
    
    @keyframes typing {
        0%, 60% { content: '...'; }
        30% { content: '..'; }
        60% { content: '.'; }
    }
    
    .chat-input-container {
        padding: 15px;
        background: #34495e;
        display: flex;
        gap: 10px;
        align-items: center;
    }
    
    .chat-input {
        flex: 1;
        padding: 10px 15px;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 25px;
        background: rgba(255, 255, 255, 0.1);
        color: white;
        font-size: 0.85rem;
        outline: none;
    }
    
    .chat-input::placeholder {
        color: rgba(255, 255, 255, 0.6);
    }
    
    .send-btn {
        background: #3498db;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 1rem;
    }
    
    .send-btn:hover {
        background: #2980b9;
        transform: scale(1.1);
    }
    
    .send-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
    
    /* Estilos do Centro de Notificações */
    #notificationCenter {
        position: relative;
        margin-right: 15px;
    }
    
    .notification-bell {
        position: relative;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        transition: all 0.3s ease;
    }
    
    .notification-bell:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: scale(1.1);
    }
    
    .bell-icon {
        font-size: 1.2rem;
        display: block;
    }
    
    .notification-badge {
        position: absolute;
        top: -5px;
        right: -5px;
        background: #e74c3c;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 0.7rem;
        font-weight: bold;
        animation: pulse 2s infinite;
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1); }
    }
    
    .notification-panel {
        position: absolute;
        top: 100%;
        right: 0;
        width: 350px;
        max-height: 400px;
        background: #2c3e50;
        border-radius: 10px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
        display: none;
        z-index: 1001;
        overflow: hidden;
    }
    
    .notification-header {
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #34495e;
    }
    
    .notification-header h3 {
        margin: 0;
        color: white;
        font-size: 1.1rem;
    }
    
    .clear-all-btn {
        background: none;
        border: none;
        color: #3498db;
        cursor: pointer;
        font-size: 0.85rem;
        padding: 5px 10px;
        border-radius: 5px;
        transition: background 0.3s ease;
    }
    
    .clear-all-btn:hover {
        background: rgba(52, 152, 219, 0.2);
    }
    
    .notification-list {
        max-height: 320px;
        overflow-y: auto;
        padding: 10px 0;
    }
    
    .notification-item {
        padding: 15px 20px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: flex-start;
        gap: 12px;
        transition: background 0.3s ease;
        position: relative;
    }
    
    .notification-item:hover {
        background: rgba(255, 255, 255, 0.05);
    }
    
    .notification-item:last-child {
        border-bottom: none;
    }
    
    .notification-icon {
        font-size: 1.5rem;
        min-width: 30px;
        text-align: center;
    }
    
    .notification-content {
        flex: 1;
    }
    
    .notification-title {
        font-weight: 600;
        color: white;
        margin-bottom: 5px;
        font-size: 0.9rem;
    }
    
    .notification-message {
        color: #ddd;
        font-size: 0.85rem;
        line-height: 1.4;
        margin-bottom: 5px;
    }
    
    .notification-time {
        color: #95a5a6;
        font-size: 0.75rem;
    }
    
    .notification-close {
        background: none;
        border: none;
        color: #95a5a6;
        cursor: pointer;
        font-size: 1.2rem;
        padding: 0;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        transition: all 0.3s ease;
    }
    
    .notification-close:hover {
        background: rgba(231, 76, 60, 0.2);
        color: #e74c3c;
    }
    
    .no-notifications {
        text-align: center;
        color: #95a5a6;
        padding: 30px 20px;
        font-style: italic;
    }
    
    /* Responsividade para notificações */
    @media (max-width: 768px) {
        .notification-panel {
            width: 300px;
            right: -50px;
        }
    }
    
    @media (max-width: 480px) {
        .notification-panel {
            width: 280px;
            right: -80px;
        }
        
        .notification-item {
            padding: 12px 15px;
        }
        
        .notification-header {
            padding: 12px 15px;
        }
    }
`;

document.head.appendChild(dynamicStyles);

// Sistema de Notificações Push
function initNotificationSystem() {
    // Verificar se o navegador suporta notificações
    if ('Notification' in window) {
        // Solicitar permissão para notificações
        if (Notification.permission === 'default') {
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    showNotification('Notificações ativadas! Você receberá atualizações em tempo real.', 'success');
                }
            });
        }
    }
    
    // Criar centro de notificações na interface
    createNotificationCenter();
}

function createNotificationCenter() {
    const notificationCenter = document.createElement('div');
    notificationCenter.id = 'notificationCenter';
    notificationCenter.innerHTML = `
        <div class="notification-bell" onclick="toggleNotificationCenter()">
            <span class="bell-icon">🔔</span>
            <span class="notification-badge" id="notificationBadge">0</span>
        </div>
        <div class="notification-panel" id="notificationPanel">
            <div class="notification-header">
                <h3>Notificações</h3>
                <button onclick="clearAllNotifications()" class="clear-all-btn">Limpar Todas</button>
            </div>
            <div class="notification-list" id="notificationList">
                <div class="no-notifications">Nenhuma notificação</div>
            </div>
        </div>
    `;
    
    // Adicionar à seção do usuário no header
    const userSection = document.querySelector('.user-section');
    userSection.insertBefore(notificationCenter, userSection.firstChild);
    
    // Carregar notificações salvas
    loadSavedNotifications();
}

function toggleNotificationCenter() {
    const panel = document.getElementById('notificationPanel');
    const isVisible = panel.style.display === 'block';
    panel.style.display = isVisible ? 'none' : 'block';
    
    if (!isVisible) {
        // Marcar todas como lidas quando abrir o painel
        markAllAsRead();
    }
}

function addNotificationToCenter(notification) {
    const notificationList = document.getElementById('notificationList');
    const noNotifications = notificationList.querySelector('.no-notifications');
    
    if (noNotifications) {
        noNotifications.remove();
    }
    
    const notificationItem = document.createElement('div');
    notificationItem.className = 'notification-item';
    notificationItem.innerHTML = `
        <div class="notification-icon">${notification.icon}</div>
        <div class="notification-content">
            <div class="notification-title">${notification.title}</div>
            <div class="notification-message">${notification.message}</div>
            <div class="notification-time">${formatNotificationTime(notification.time)}</div>
        </div>
        <button class="notification-close" onclick="removeNotification(this)">×</button>
    `;
    
    notificationList.insertBefore(notificationItem, notificationList.firstChild);
    
    // Atualizar badge
    updateNotificationBadge();
    
    // Salvar no localStorage
    saveNotification(notification);
}

function updateNotificationBadge() {
    const badge = document.getElementById('notificationBadge');
    const notifications = document.querySelectorAll('.notification-item').length;
    badge.textContent = notifications;
    badge.style.display = notifications > 0 ? 'block' : 'none';
}

function markAllAsRead() {
    const badge = document.getElementById('notificationBadge');
    badge.style.display = 'none';
}

function clearAllNotifications() {
    const notificationList = document.getElementById('notificationList');
    notificationList.innerHTML = '<div class="no-notifications">Nenhuma notificação</div>';
    updateNotificationBadge();
    localStorage.removeItem('droppoint_notifications');
}

function removeNotification(button) {
    const item = button.parentElement;
    item.remove();
    updateNotificationBadge();
    
    // Se não há mais notificações, mostrar mensagem
    const notificationList = document.getElementById('notificationList');
    if (notificationList.children.length === 0) {
        notificationList.innerHTML = '<div class="no-notifications">Nenhuma notificação</div>';
    }
}

function saveNotification(notification) {
    const saved = JSON.parse(localStorage.getItem('droppoint_notifications') || '[]');
    saved.unshift(notification);
    // Manter apenas as últimas 20 notificações
    if (saved.length > 20) {
        saved.splice(20);
    }
    localStorage.setItem('droppoint_notifications', JSON.stringify(saved));
}

function loadSavedNotifications() {
    const saved = JSON.parse(localStorage.getItem('droppoint_notifications') || '[]');
    saved.forEach(notification => {
        addNotificationToCenter(notification);
    });
}

function formatNotificationTime(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    
    if (diff < 60000) return 'Agora';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m atrás`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h atrás`;
    return time.toLocaleDateString('pt-BR');
}

// Simulação de atualizações em tempo real
function startRealtimeUpdates() {
    // Simular notificações de pedidos a cada 30 segundos
    setInterval(() => {
        const notifications = [
            {
                icon: '📦',
                title: 'Pedido Coletado',
                message: 'Seu pedido #DP001 foi coletado e está a caminho!',
                time: Date.now(),
                type: 'order_update'
            },
            {
                icon: '🚚',
                title: 'Motoboy a Caminho',
                message: 'João está se dirigindo ao local de coleta. ETA: 15 min',
                time: Date.now(),
                type: 'driver_update'
            },
            {
                icon: '📍',
                title: 'Chegou ao Destino',
                message: 'Pedido #DP002 chegou ao destino. Aguardando confirmação.',
                time: Date.now(),
                type: 'delivery_update'
            },
            {
                icon: '⭐',
                title: 'Entrega Concluída',
                message: 'Pedido #DP003 foi entregue com sucesso! Avalie o serviço.',
                time: Date.now(),
                type: 'completion'
            }
        ];
        
        if (Math.random() > 0.7) { // 30% de chance a cada intervalo
            const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
            
            // Notificação do navegador (se permitida)
            if (Notification.permission === 'granted') {
                new Notification(randomNotification.title, {
                    body: randomNotification.message,
                    icon: '../img/Logo.png',
                    badge: '../img/Logo.png'
                });
            }
            
            // Adicionar ao centro de notificações
            addNotificationToCenter(randomNotification);
            
            // Notificação visual na página
            showNotification(`${randomNotification.title}: ${randomNotification.message}`, 'info');
        }
    }, 30000); // A cada 30 segundos
}

// Melhorar sistema de feedback com sons (opcional)
function playNotificationSound() {
    // Criar um beep simples usando Web Audio API
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
}

// Sistema de Chat Integrado
let currentChatType = 'support';
let chatMessages = [];
let isTyping = false;

function openChat(type = 'support') {
    currentChatType = type;
    const chatWidget = document.getElementById('chatWidget');
    const chatName = document.getElementById('chatName');
    const chatStatus = document.getElementById('chatStatus');
    
    // Configurar informações do chat baseado no tipo
    if (type === 'support') {
        chatName.textContent = 'Suporte DropPoint';
        chatStatus.textContent = 'Online';
        document.querySelector('.chat-avatar').textContent = '💬';
    } else if (type === 'motoboy') {
        chatName.textContent = 'João Silva';
        chatStatus.textContent = 'Em entrega';
        document.querySelector('.chat-avatar').textContent = '🏍️';
    }
    
    chatWidget.classList.add('open');
    chatWidget.classList.remove('minimized');
    
    // Inicializar mensagens
    initializeChatMessages(type);
    
    // Focar no input
    setTimeout(() => {
        document.getElementById('chatInput').focus();
    }, 300);
}

function toggleChat() {
    const chatWidget = document.getElementById('chatWidget');
    chatWidget.classList.toggle('minimized');
}

function initializeChatMessages(type) {
    const messagesContainer = document.getElementById('chatMessages');
    messagesContainer.innerHTML = '';
    
    let initialMessages = [];
    
    if (type === 'support') {
        initialMessages = [
            {
                text: 'Olá! Bem-vindo ao suporte DropPoint. Como posso ajudá-lo hoje?',
                sender: 'received',
                time: new Date()
            }
        ];
    } else if (type === 'motoboy') {
        initialMessages = [
            {
                text: 'Olá! Sou o João, seu motoboy. Estou a caminho para a coleta.',
                sender: 'received',
                time: new Date()
            },
            {
                text: 'Tempo estimado: 15 minutos. Qualquer dúvida, pode falar comigo!',
                sender: 'received',
                time: new Date()
            }
        ];
    }
    
    chatMessages = initialMessages;
    displayMessages();
}

function displayMessages() {
    const messagesContainer = document.getElementById('chatMessages');
    
    messagesContainer.innerHTML = chatMessages.map(message => `
        <div class="message ${message.sender}">
            <div class="message-content">
                ${message.text}
                <div class="message-time">${formatChatTime(message.time)}</div>
            </div>
        </div>
    `).join('');
    
    // Scroll para a última mensagem
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const messageText = input.value.trim();
    
    if (!messageText) return;
    
    // Adicionar mensagem do usuário
    chatMessages.push({
        text: messageText,
        sender: 'sent',
        time: new Date()
    });
    
    input.value = '';
    displayMessages();
    
    // Mostrar indicador de digitação
    showTypingIndicator();
    
    // Simular resposta depois de um tempo
    setTimeout(() => {
        hideTypingIndicator();
        generateAutoResponse(messageText);
    }, 1500 + Math.random() * 2000);
}

function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatMessages');
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.id = 'typingIndicator';
    typingIndicator.innerHTML = `
        <span class="typing-dots"></span> ${currentChatType === 'support' ? 'Suporte' : 'João'} está digitando
    `;
    
    messagesContainer.appendChild(typingIndicator);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    isTyping = true;
}

function hideTypingIndicator() {
    const indicator = document.getElementById('typingIndicator');
    if (indicator) {
        indicator.remove();
    }
    isTyping = false;
}

function generateAutoResponse(userMessage) {
    let responseText = '';
    
    const lowerMessage = userMessage.toLowerCase();
    
    if (currentChatType === 'support') {
        if (lowerMessage.includes('pedido') || lowerMessage.includes('entrega')) {
            responseText = 'Entendi que você tem uma dúvida sobre seu pedido. Você pode acompanhar o status em tempo real na página "Acompanhar Pedidos". Precisa de mais alguma coisa?';
        } else if (lowerMessage.includes('cancelar')) {
            responseText = 'Para cancelar um pedido, acesse "Acompanhar Pedidos" e clique no botão de cancelamento. Lembre-se que pedidos já coletados não podem ser cancelados.';
        } else if (lowerMessage.includes('prazo') || lowerMessage.includes('tempo')) {
            responseText = 'Nossos prazos de entrega são de até 2 horas na região metropolitana. Você pode acompanhar o tempo estimado em tempo real no rastreamento.';
        } else if (lowerMessage.includes('preço') || lowerMessage.includes('valor')) {
            responseText = 'Nossos preços variam conforme a distância e região. Use nossa calculadora de custos para ter uma estimativa precisa antes de finalizar o pedido.';
        } else {
            responseText = 'Obrigado pela sua mensagem! Nossa equipe está analisando sua solicitação. Em breve você receberá uma resposta detalhada.';
        }
    } else if (currentChatType === 'motoboy') {
        if (lowerMessage.includes('onde') || lowerMessage.includes('localização')) {
            responseText = 'Estou na Av. Paulista, chegando em aproximadamente 12 minutos no local de coleta. Você pode acompanhar minha localização em tempo real no app.';
        } else if (lowerMessage.includes('demora') || lowerMessage.includes('tempo')) {
            responseText = 'Está tudo no prazo! Chegando em alguns minutos. O trânsito está tranquilo por aqui.';
        } else if (lowerMessage.includes('urgente') || lowerMessage.includes('rápido')) {
            responseText = 'Entendido! Estou fazendo o possível para chegar o mais rápido possível mantendo a segurança. Muito obrigado pela compreensão.';
        } else {
            responseText = 'Recebi sua mensagem! Qualquer novidade eu te aviso. Estou focado na sua entrega! 🏍️💨';
        }
    }
    
    // Adicionar resposta
    chatMessages.push({
        text: responseText,
        sender: 'received',
        time: new Date()
    });
    
    displayMessages();
    
    // Notificação sonora (opcional)
    playNotificationSound();
}

function formatChatTime(date) {
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Melhorar função contactSupport para usar o chat
function contactSupport() {
    openChat('support');
}

// Configurar eventos do chat
function setupChatEventListeners() {
    const chatInput = document.getElementById('chatInput');
    
    // Enter para enviar mensagem
    chatInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Fechar chat ao clicar fora (ESC)
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            const chatWidget = document.getElementById('chatWidget');
            if (chatWidget.classList.contains('open')) {
                chatWidget.classList.remove('open');
            }
        }
    });
}

// Adicionar aos event listeners
function setupEventListeners() {
    // ... eventos existentes ...
    
    // Configurar eventos do chat
    setupChatEventListeners();
    
    // ... resto dos eventos ...
}