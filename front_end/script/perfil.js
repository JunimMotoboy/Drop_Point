// Dados do perfil (simulados)
let userData = {
    name: '',
    phone: '',
    email: '',
    avatar: null,
    favoriteAddresses: [
        {
            id: 1,
            name: 'Casa',
            address: 'Rua das Flores, 123, Centro, São Paulo - SP',
            isDefault: true
        },
        {
            id: 2,
            name: 'Trabalho',
            address: 'Av. Paulista, 1578, Bela Vista, São Paulo - SP',
            isDefault: false
        }
    ],
    preferences: {
        notifications: {
            orderUpdates: true,
            promotions: false,
            newsletter: true,
            sms: false
        },
        delivery: {
            fastDelivery: true,
            ecoMode: false,
            contactlessDelivery: true
        }
    },
    paymentMethod: 'credit-card',
    stats: {
        totalOrders: 47,
        totalSpent: 'R$ 2.847,50',
        avgRating: 4.8,
        favoriteCategory: 'Alimentação'
    }
};

// Estado da aplicação
let currentEditingAddress = null;
let hasUnsavedChanges = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    initializeProfile();
    loadUserData();
    setupEventListeners();
    updateSaveButtonState();
});

// Configurar event listeners
function setupEventListeners() {
    // Avatar upload
    const avatarInput = document.getElementById('avatarInput');
    const changeAvatarBtn = document.querySelector('.change-avatar-btn');
    
    changeAvatarBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', handleAvatarChange);
    
    // Formulário principal
    const profileInputs = document.querySelectorAll('.profile-input');
    profileInputs.forEach(input => {
        input.addEventListener('input', handleInputChange);
    });
    
    // Botões de ação
    document.getElementById('addAddressBtn').addEventListener('click', openAddressModal);
    document.getElementById('changePasswordBtn').addEventListener('click', openPasswordModal);
    document.getElementById('exportDataBtn').addEventListener('click', exportUserData);
    document.getElementById('deleteAccountBtn').addEventListener('click', confirmDeleteAccount);
    document.getElementById('saveAllBtn').addEventListener('click', saveAllChanges);
    
    // Preferências
    setupPreferencesListeners();
    
    // Métodos de pagamento
    setupPaymentMethodListeners();
    
    // Modal
    setupModalListeners();
    
    // Botão voltar
    document.querySelector('.btn-back').addEventListener('click', () => {
        if (hasUnsavedChanges) {
            if (confirm('Você tem alterações não salvas. Deseja sair mesmo assim?')) {
                goBack();
            }
        } else {
            goBack();
        }
    });
    
    // Detectar mudanças não salvas
    window.addEventListener('beforeunload', (e) => {
        if (hasUnsavedChanges) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// Inicializar perfil
function initializeProfile() {
    // Carregar dados do localStorage
    const savedUserData = localStorage.getItem('userData');
    if (savedUserData) {
        userData = { ...userData, ...JSON.parse(savedUserData) };
    }
    
    // Se não tiver nome, pegar do localStorage do login
    if (!userData.name) {
        userData.name = localStorage.getItem('userName') || 'Usuário';
    }
    
    if (!userData.email) {
        userData.email = localStorage.getItem('userEmail') || '';
    }
}

// Carregar dados do usuário na interface
function loadUserData() {
    // Carregar dados básicos
    document.getElementById('userName').value = userData.name;
    document.getElementById('userPhone').value = userData.phone;
    document.getElementById('userEmail').value = userData.email;
    
    // Carregar avatar
    if (userData.avatar) {
        const avatarImg = document.getElementById('userAvatarImg');
        const avatarPlaceholder = document.getElementById('avatarPlaceholder');
        
        avatarImg.src = userData.avatar;
        avatarImg.style.display = 'block';
        avatarPlaceholder.style.display = 'none';
    } else {
        updateAvatarPlaceholder();
    }
    
    // Carregar endereços favoritos
    renderFavoriteAddresses();
    
    // Carregar preferências
    loadPreferences();
    
    // Carregar método de pagamento
    loadPaymentMethod();
    
    // Carregar estatísticas
    loadStats();
}

// Atualizar placeholder do avatar
function updateAvatarPlaceholder() {
    const placeholder = document.getElementById('avatarPlaceholder');
    const initial = userData.name ? userData.name.charAt(0).toUpperCase() : 'U';
    placeholder.textContent = initial;
}

// Handle avatar change
function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            showNotification('Arquivo muito grande. Máximo 5MB.', 'error');
            return;
        }
        
        if (!file.type.startsWith('image/')) {
            showNotification('Por favor, selecione uma imagem válida.', 'error');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            userData.avatar = e.target.result;
            
            const avatarImg = document.getElementById('userAvatarImg');
            const avatarPlaceholder = document.getElementById('avatarPlaceholder');
            
            avatarImg.src = userData.avatar;
            avatarImg.style.display = 'block';
            avatarPlaceholder.style.display = 'none';
            
            markAsChanged();
            showNotification('Avatar atualizado! Lembre-se de salvar as alterações.', 'success');
        };
        reader.readAsDataURL(file);
    }
}

// Handle input changes
function handleInputChange(event) {
    const field = event.target.id;
    const value = event.target.value;
    
    switch(field) {
        case 'userName':
            userData.name = value;
            updateAvatarPlaceholder();
            break;
        case 'userPhone':
            userData.phone = value;
            break;
        case 'userEmail':
            userData.email = value;
            break;
    }
    
    markAsChanged();
}

// Renderizar endereços favoritos
function renderFavoriteAddresses() {
    const container = document.getElementById('favoritesList');
    
    if (userData.favoriteAddresses.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 40px; color: #999;">
                <div style="font-size: 3rem; margin-bottom: 15px;">📍</div>
                <p>Nenhum endereço favorito ainda</p>
                <p style="font-size: 0.9rem;">Adicione seus endereços mais utilizados para facilitar futuros pedidos</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = userData.favoriteAddresses.map(address => `
        <div class="favorite-item" data-id="${address.id}">
            <div class="favorite-name">
                ${address.name}
                ${address.isDefault ? '<span style="color: #3498db; font-size: 0.8rem; margin-left: 8px;">● Padrão</span>' : ''}
            </div>
            <div class="favorite-address">${address.address}</div>
            <div class="favorite-actions">
                <button class="favorite-btn btn-edit" onclick="editAddress(${address.id})">
                    ✏️ Editar
                </button>
                <button class="favorite-btn btn-delete" onclick="deleteAddress(${address.id})">
                    🗑️ Excluir
                </button>
            </div>
        </div>
    `).join('');
}

// Configurar preferências
function loadPreferences() {
    // Notificações
    document.getElementById('orderUpdates').checked = userData.preferences.notifications.orderUpdates;
    document.getElementById('promotions').checked = userData.preferences.notifications.promotions;
    document.getElementById('newsletter').checked = userData.preferences.notifications.newsletter;
    document.getElementById('smsNotifications').checked = userData.preferences.notifications.sms;
    
    // Entrega
    document.getElementById('fastDelivery').checked = userData.preferences.delivery.fastDelivery;
    document.getElementById('ecoMode').checked = userData.preferences.delivery.ecoMode;
    document.getElementById('contactlessDelivery').checked = userData.preferences.delivery.contactlessDelivery;
}

function setupPreferencesListeners() {
    const notificationInputs = [
        'orderUpdates', 'promotions', 'newsletter', 'smsNotifications'
    ];
    
    const deliveryInputs = [
        'fastDelivery', 'ecoMode', 'contactlessDelivery'
    ];
    
    notificationInputs.forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            userData.preferences.notifications[id] = e.target.checked;
            markAsChanged();
        });
    });
    
    deliveryInputs.forEach(id => {
        document.getElementById(id).addEventListener('change', (e) => {
            userData.preferences.delivery[id] = e.target.checked;
            markAsChanged();
        });
    });
}

// Configurar métodos de pagamento
function loadPaymentMethod() {
    const radio = document.querySelector(`input[name="payment-method"][value="${userData.paymentMethod}"]`);
    if (radio) {
        radio.checked = true;
    }
}

function setupPaymentMethodListeners() {
    const paymentRadios = document.querySelectorAll('input[name="payment-method"]');
    paymentRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            userData.paymentMethod = e.target.value;
            markAsChanged();
        });
    });
}

// Carregar estatísticas
function loadStats() {
    document.getElementById('totalOrders').textContent = userData.stats.totalOrders;
    document.getElementById('totalSpent').textContent = userData.stats.totalSpent;
    document.getElementById('avgRating').textContent = userData.stats.avgRating;
    document.getElementById('favoriteCategory').textContent = userData.stats.favoriteCategory;
}

// Modal functions
function setupModalListeners() {
    const modal = document.getElementById('addressModal');
    const closeBtn = document.querySelector('.modal-close');
    const cancelBtn = document.getElementById('cancelAddress');
    const saveBtn = document.getElementById('saveAddress');
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    saveBtn.addEventListener('click', saveAddress);
    
    // Fechar modal clicando fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeModal();
        }
    });
}

function openAddressModal(address = null) {
    const modal = document.getElementById('addressModal');
    const title = document.getElementById('modalTitle');
    
    currentEditingAddress = address;
    
    if (address) {
        title.textContent = 'Editar Endereço';
        document.getElementById('addressName').value = address.name;
        document.getElementById('addressStreet').value = address.address.split(',')[0];
        document.getElementById('addressNumber').value = address.address.split(',')[1]?.trim() || '';
        document.getElementById('addressNeighborhood').value = address.address.split(',')[2]?.trim() || '';
        document.getElementById('addressCity').value = address.address.split(',')[3]?.trim() || '';
        document.getElementById('addressReference').value = address.reference || '';
        document.getElementById('isDefaultAddress').checked = address.isDefault;
    } else {
        title.textContent = 'Novo Endereço';
        document.getElementById('addressForm').reset();
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('addressModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentEditingAddress = null;
}

function saveAddress() {
    const form = document.getElementById('addressForm');
    const formData = new FormData(form);
    
    const name = formData.get('name');
    const street = formData.get('street');
    const number = formData.get('number');
    const neighborhood = formData.get('neighborhood');
    const city = formData.get('city');
    const reference = formData.get('reference');
    const isDefault = formData.get('isDefault') === 'on';
    
    if (!name || !street || !neighborhood || !city) {
        showNotification('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }
    
    const address = `${street}, ${number}, ${neighborhood}, ${city}`;
    
    if (currentEditingAddress) {
        // Editar endereço existente
        const index = userData.favoriteAddresses.findIndex(addr => addr.id === currentEditingAddress.id);
        if (index !== -1) {
            userData.favoriteAddresses[index] = {
                ...userData.favoriteAddresses[index],
                name,
                address,
                reference,
                isDefault
            };
        }
    } else {
        // Novo endereço
        const newAddress = {
            id: Date.now(),
            name,
            address,
            reference,
            isDefault
        };
        userData.favoriteAddresses.push(newAddress);
    }
    
    // Se este for o padrão, remover padrão dos outros
    if (isDefault) {
        userData.favoriteAddresses.forEach(addr => {
            if (addr.id !== (currentEditingAddress?.id || Date.now())) {
                addr.isDefault = false;
            }
        });
    }
    
    renderFavoriteAddresses();
    closeModal();
    markAsChanged();
    showNotification('Endereço salvo com sucesso!', 'success');
}

// Funções de endereço
function editAddress(id) {
    const address = userData.favoriteAddresses.find(addr => addr.id === id);
    if (address) {
        openAddressModal(address);
    }
}

function deleteAddress(id) {
    if (confirm('Tem certeza que deseja excluir este endereço?')) {
        userData.favoriteAddresses = userData.favoriteAddresses.filter(addr => addr.id !== id);
        renderFavoriteAddresses();
        markAsChanged();
        showNotification('Endereço excluído com sucesso!', 'success');
    }
}

// Modal de alteração de senha
function openPasswordModal() {
    const modal = createPasswordModal();
    document.body.appendChild(modal);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function createPasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'passwordModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Alterar Senha</h2>
                <button class="modal-close" onclick="closePasswordModal()">&times;</button>
            </div>
            <div class="modal-body">
                <form id="passwordForm">
                    <div class="form-group">
                        <label for="currentPassword">Senha Atual</label>
                        <input type="password" id="currentPassword" name="currentPassword" required>
                    </div>
                    <div class="form-group">
                        <label for="newPassword">Nova Senha</label>
                        <input type="password" id="newPassword" name="newPassword" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="confirmPassword">Confirmar Nova Senha</label>
                        <input type="password" id="confirmPassword" name="confirmPassword" required>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn-secondary" onclick="closePasswordModal()">Cancelar</button>
                <button type="button" class="btn-primary" onclick="changePassword()">Alterar Senha</button>
            </div>
        </div>
    `;
    
    return modal;
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

function changePassword() {
    const form = document.getElementById('passwordForm');
    const formData = new FormData(form);
    
    const currentPassword = formData.get('currentPassword');
    const newPassword = formData.get('newPassword');
    const confirmPassword = formData.get('confirmPassword');
    
    if (!currentPassword || !newPassword || !confirmPassword) {
        showNotification('Por favor, preencha todos os campos.', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showNotification('As senhas não coincidem.', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showNotification('A nova senha deve ter pelo menos 6 caracteres.', 'error');
        return;
    }
    
    // Simular alteração de senha
    setTimeout(() => {
        closePasswordModal();
        showNotification('Senha alterada com sucesso!', 'success');
    }, 1000);
}

// Exportar dados
function exportUserData() {
    const dataToExport = {
        ...userData,
        exportDate: new Date().toISOString(),
        version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { 
        type: 'application/json' 
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `droppoint-dados-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Dados exportados com sucesso!', 'success');
}

// Confirmar exclusão de conta
function confirmDeleteAccount() {
    const confirmation = prompt(
        'Esta ação é irreversível. Digite "EXCLUIR" para confirmar a exclusão da sua conta:'
    );
    
    if (confirmation === 'EXCLUIR') {
        // Simular exclusão de conta
        if (confirm('Tem certeza absoluta? Todos os seus dados serão perdidos.')) {
            localStorage.clear();
            alert('Conta excluída com sucesso. Você será redirecionado para a página inicial.');
            window.location.href = '../index.html';
        }
    } else if (confirmation !== null) {
        showNotification('Confirmação incorreta. Conta não foi excluída.', 'error');
    }
}

// Salvar todas as alterações
function saveAllChanges() {
    const saveBtn = document.getElementById('saveAllBtn');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Salvando...';
    
    // Simular salvamento
    setTimeout(() => {
        // Salvar no localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('userName', userData.name);
        localStorage.setItem('userEmail', userData.email);
        
        hasUnsavedChanges = false;
        updateSaveButtonState();
        
        saveBtn.disabled = false;
        saveBtn.textContent = 'Salvar Tudo';
        
        showNotification('Todas as alterações foram salvas com sucesso!', 'success');
    }, 1500);
}

// Marcar como alterado
function markAsChanged() {
    hasUnsavedChanges = true;
    updateSaveButtonState();
}

// Atualizar estado do botão salvar
function updateSaveButtonState() {
    const saveBtn = document.getElementById('saveAllBtn');
    if (hasUnsavedChanges) {
        saveBtn.style.background = '#e74c3c';
        saveBtn.textContent = 'Salvar Alterações';
        saveBtn.style.animation = 'pulse 2s infinite';
    } else {
        saveBtn.style.background = '#27ae60';
        saveBtn.textContent = 'Tudo Salvo ✓';
        saveBtn.style.animation = 'none';
    }
}

// Voltar
function goBack() {
    window.location.href = 'dashboardUsuario.html';
}

// Sistema de notificações
function showNotification(message, type = 'info') {
    // Remove notificação existente
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">
                ${type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ'}
            </span>
            <span class="notification-message">${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
        </div>
    `;
    
    // Adicionar estilos inline para a notificação
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        background: ${type === 'success' ? '#27ae60' : type === 'error' ? '#e74c3c' : '#3498db'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        font-family: 'Inter', sans-serif;
    `;
    
    notification.querySelector('.notification-content').style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    notification.querySelector('.notification-close').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
        margin-left: auto;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Adicionar estilos de animação
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
    }
`;
document.head.appendChild(style);