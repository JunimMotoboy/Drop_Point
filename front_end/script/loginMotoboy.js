// Dados de validação (simulados)
const validMotoboys = [
    {
        email: 'joao@droppoint.com',
        senha: '123456',
        nome: 'João Silva',
        avatar: '../img/motoboy-avatar.png'
    },
    {
        email: 'maria@droppoint.com',
        senha: '123456',
        nome: 'Maria Santos',
        avatar: '../img/motoboy-avatar.png'
    },
    {
        email: 'carlos@droppoint.com',
        senha: '123456',
        nome: 'Carlos Oliveira',
        avatar: '../img/motoboy-avatar.png'
    }
];

// Estado do formulário
let isLoading = false;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    setupFormValidation();
    setupEventListeners();
    checkAutoLogin();
});

// Configurar validação do formulário
function setupFormValidation() {
    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');

    // Validação em tempo real
    emailInput.addEventListener('input', () => validateField('email'));
    emailInput.addEventListener('blur', () => validateField('email'));
    
    senhaInput.addEventListener('input', () => validateField('senha'));
    senhaInput.addEventListener('blur', () => validateField('senha'));

    // Submit do formulário
    form.addEventListener('submit', handleFormSubmit);
}

// Configurar outros event listeners
function setupEventListeners() {
    // Enter key no campo senha
    document.getElementById('senha').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleFormSubmit(e);
        }
    });
}

// Verificar auto-login
function checkAutoLogin() {
    const savedEmail = localStorage.getItem('motoboyEmail');
    const rememberMe = localStorage.getItem('motoboyRememberMe');
    
    if (savedEmail && rememberMe === 'true') {
        document.getElementById('email').value = savedEmail;
        // Não preenchemos a senha por segurança
    }
}

// Validar campo individual
function validateField(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + '-error');
    let isValid = true;
    let errorMessage = '';

    // Limpar erro anterior
    clearFieldError(fieldName);

    switch (fieldName) {
        case 'email':
            if (!field.value.trim()) {
                errorMessage = 'E-mail é obrigatório';
                isValid = false;
            } else if (!isValidEmail(field.value)) {
                errorMessage = 'Digite um e-mail válido';
                isValid = false;
            }
            break;

        case 'senha':
            if (!field.value.trim()) {
                errorMessage = 'Senha é obrigatória';
                isValid = false;
            } else if (field.value.length < 6) {
                errorMessage = 'Senha deve ter pelo menos 6 caracteres';
                isValid = false;
            }
            break;
    }

    if (!isValid) {
        showFieldError(fieldName, errorMessage);
    }

    return isValid;
}

// Validar e-mail
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostrar erro no campo
function showFieldError(fieldName, message) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + '-error');
    
    field.classList.add('error');
    errorElement.textContent = message;
    errorElement.style.display = 'block';
}

// Limpar erro do campo
function clearFieldError(fieldName) {
    const field = document.getElementById(fieldName);
    const errorElement = document.getElementById(fieldName + '-error');
    
    field.classList.remove('error');
    errorElement.textContent = '';
    errorElement.style.display = 'none';
}

// Limpar todos os erros
function clearAllErrors() {
    ['email', 'senha'].forEach(fieldName => {
        clearFieldError(fieldName);
    });
}

// Lidar com submit do formulário
function handleFormSubmit(event) {
    event.preventDefault();
    
    if (isLoading) return;
    
    // Validar todos os campos
    const isEmailValid = validateField('email');
    const isSenhaValid = validateField('senha');
    
    if (!isEmailValid || !isSenhaValid) {
        showNotification('Por favor, corrija os erros no formulário', 'error');
        return;
    }
    
    // Iniciar processo de login
    startLogin();
}

// Iniciar login
function startLogin() {
    isLoading = true;
    
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;
    
    // Mostrar loading
    showLoadingState();
    
    // Simular chamada de API
    setTimeout(() => {
        performLogin(email, senha);
    }, 1500);
}

// Mostrar estado de loading
function showLoadingState() {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.loading-spinner');
    
    loginBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'inline-block';
    
    // Adicionar classe de loading ao formulário
    document.getElementById('loginForm').classList.add('loading');
}

// Esconder estado de loading
function hideLoadingState() {
    const loginBtn = document.getElementById('loginBtn');
    const btnText = loginBtn.querySelector('.btn-text');
    const spinner = loginBtn.querySelector('.loading-spinner');
    
    loginBtn.disabled = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
    
    // Remover classe de loading do formulário
    document.getElementById('loginForm').classList.remove('loading');
    
    isLoading = false;
}

// Realizar login
function performLogin(email, senha) {
    // Buscar motoboy válido
    const motoboy = validMotoboys.find(m => 
        m.email.toLowerCase() === email.toLowerCase() && m.senha === senha
    );
    
    hideLoadingState();
    
    if (motoboy) {
        // Login bem-sucedido
        handleSuccessfulLogin(motoboy);
    } else {
        // Login falhou
        handleFailedLogin();
    }
}

// Lidar com login bem-sucedido
function handleSuccessfulLogin(motoboy) {
    // Salvar dados do motoboy
    localStorage.setItem('motoboyLoggedIn', 'true');
    localStorage.setItem('motoboyName', motoboy.nome);
    localStorage.setItem('motoboyEmail', motoboy.email);
    localStorage.setItem('motoboyAvatar', motoboy.avatar);
    
    // Lembrar login se solicitado
    const rememberCheckbox = document.getElementById('rememberMe');
    if (rememberCheckbox && rememberCheckbox.checked) {
        localStorage.setItem('motoboyRememberMe', 'true');
    }
    
    // Mostrar sucesso
    showNotification('Login realizado com sucesso! Redirecionando...', 'success');
    
    // Adicionar efeito de sucesso
    document.getElementById('loginForm').classList.add('success');
    
    // Redirecionar após delay
    setTimeout(() => {
        window.location.href = 'dashboardEntregamovel.html';
    }, 2000);
}

// Lidar com login falhado
function handleFailedLogin() {
    showNotification('E-mail ou senha incorretos. Tente novamente.', 'error');
    
    // Destacar campos de erro
    document.getElementById('email').classList.add('error');
    document.getElementById('senha').classList.add('error');
    
    // Limpar senha
    document.getElementById('senha').value = '';
    
    // Focar no email
    document.getElementById('email').focus();
    
    // Remover destaque após um tempo
    setTimeout(() => {
        document.getElementById('email').classList.remove('error');
        document.getElementById('senha').classList.remove('error');
    }, 3000);
}

// Toggle password visibility
function togglePassword(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    
    if (field.type === 'password') {
        field.type = 'text';
        button.textContent = '🙈';
    } else {
        field.type = 'password';
        button.textContent = '👁️';
    }
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
    
    // Estilos inline
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
    
    // Auto remove
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
    
    .form-login.loading {
        opacity: 0.7;
        pointer-events: none;
    }
    
    .form-login.success {
        animation: successPulse 0.5s ease;
    }
    
    @keyframes successPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.02); }
        100% { transform: scale(1); }
    }
    
    .input-field.error {
        border-color: #e74c3c !important;
        box-shadow: 0 0 0 3px rgba(231, 76, 60, 0.1) !important;
    }
    
    .error-message {
        color: #e74c3c;
        font-size: 0.8rem;
        margin-top: 5px;
        display: none;
    }
    
    .loading-spinner {
        width: 20px;
        height: 20px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 1s ease-in-out infinite;
    }
    
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);