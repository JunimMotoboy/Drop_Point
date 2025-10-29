// DropPoint - Sistema de Navegação e Rotas
// Configuração centralizada de navegação

class DropPointNavigation {
    constructor() {
        this.baseURL = this.getBaseURL();
        this.routes = this.initializeRoutes();
        this.currentUser = this.getCurrentUser();
        this.init();
    }

    // Detectar URL base automaticamente
    getBaseURL() {
        const currentPath = window.location.pathname;
        
        // Se estamos na raiz do projeto
        if (currentPath.includes('Drop_Point')) {
            const basePath = currentPath.substring(0, currentPath.indexOf('Drop_Point') + 'Drop_Point'.length);
            return window.location.origin + basePath;
        }
        
        // Se estamos no front_end
        if (currentPath.includes('front_end')) {
            const basePath = currentPath.substring(0, currentPath.indexOf('front_end'));
            return window.location.origin + basePath;
        }
        
        // Fallback para a raiz
        return window.location.origin;
    }

    // Configuração de todas as rotas do sistema
    initializeRoutes() {
        return {
            // Página inicial
            home: `${this.baseURL}/index.html`,
            
            // Autenticação
            loginUsuario: `${this.baseURL}/front_end/public/loginUsuario.html`,
            loginMotoboy: `${this.baseURL}/front_end/public/loginMotoboy.html`,
            cadastroUsuario: `${this.baseURL}/front_end/public/cadastroUsuario.html`,
            cadastroMotoboy: `${this.baseURL}/front_end/public/cadastroMotoboy.html`,
            
            // Dashboard
            dashboardUsuario: `${this.baseURL}/front_end/public/dashboardUsuario.html`,
            dashboardMotoboy: `${this.baseURL}/front_end/public/dashboardMotoboy.html`,
            dashboardEntregamovel: `${this.baseURL}/front_end/public/dashboardEntregamovel.html`,
            
            // Funcionalidades do Usuário
            cadastrarPedido: `${this.baseURL}/front_end/public/cadastrarPedido.html`,
            acompanharPedidos: `${this.baseURL}/front_end/public/acompanharPedidos.html`,
            historicoDePedidos: `${this.baseURL}/front_end/public/historicoDePedidos.html`,
            avaliacoes: `${this.baseURL}/front_end/public/avaliacoes.html`,
            perfil: `${this.baseURL}/front_end/public/perfil.html`,
            
            // Funcionalidades administrativas
            dashboardEditarPedidos: `${this.baseURL}/front_end/public/dashboardEditarPedidos.html`,
            
            // API Backend
            api: `http://localhost:3000/api`,
            apiHealth: `http://localhost:3000/api/health`
        };
    }

    // Inicializar sistema de navegação
    init() {
        this.setupBackButtons();
        this.setupNavigationHelpers();
        this.checkAuthentication();
        this.setupGlobalErrorHandling();
    }

    // Configurar botões de voltar
    setupBackButtons() {
        // Botões de voltar existentes
        const backButtons = document.querySelectorAll('.btn-back, .back-button, [data-action="back"]');
        backButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.goBack();
            });
        });

        // Criar botão de voltar automático se não existir
        if (backButtons.length === 0 && window.location.pathname !== '/index.html') {
            this.createBackButton();
        }
    }

    // Criar botão de voltar dinâmico
    createBackButton() {
        const backBtn = document.createElement('button');
        backBtn.className = 'btn-back-auto';
        backBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Voltar
        `;
        backBtn.style.cssText = `
            position: fixed;
            top: 20px;
            left: 20px;
            z-index: 1000;
            background: rgba(0, 123, 255, 0.9);
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 25px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.2);
            transition: all 0.3s ease;
        `;
        
        backBtn.addEventListener('click', () => this.goBack());
        document.body.appendChild(backBtn);
    }

    // Lógica inteligente de voltar
    goBack() {
        const currentPath = window.location.pathname;
        const userType = this.getCurrentUserType();
        
        // Definir página anterior baseado no contexto
        if (currentPath.includes('login') || currentPath.includes('cadastro')) {
            this.navigateTo('home');
        } else if (currentPath.includes('public/')) {
            // Se o usuário está logado, voltar para o dashboard apropriado
            if (userType === 'usuario') {
                this.navigateTo('dashboardUsuario');
            } else if (userType === 'motoboy') {
                this.navigateTo('dashboardMotoboy');
            } else {
                this.navigateTo('home');
            }
        } else {
            // Usar histórico do navegador se disponível
            if (window.history.length > 1) {
                window.history.back();
            } else {
                this.navigateTo('home');
            }
        }
    }

    // Configurar helpers de navegação globais
    setupNavigationHelpers() {
        // Função global navigateTo
        window.navigateTo = (route, newTab = false) => this.navigateTo(route, newTab);
        
        // Função global goHome
        window.goHome = () => this.navigateTo('home');
        
        // Função global logout
        window.logout = () => this.logout();
        
        // Função global checkAuth
        window.checkAuth = () => this.checkAuthentication();
    }

    // Navegar para uma rota específica
    navigateTo(route, newTab = false) {
        const url = this.routes[route] || route;
        
        if (!url) {
            console.error(`Rota não encontrada: ${route}`);
            return;
        }

        if (newTab) {
            window.open(url, '_blank');
        } else {
            window.location.href = url;
        }
    }

    // Obter usuário atual do localStorage
    getCurrentUser() {
        try {
            return JSON.parse(localStorage.getItem('droppoint_user') || 'null');
        } catch (error) {
            console.error('Erro ao obter usuário:', error);
            return null;
        }
    }

    // Obter tipo do usuário atual
    getCurrentUserType() {
        const user = this.getCurrentUser();
        return user?.type || null;
    }

    // Verificar autenticação
    checkAuthentication() {
        const currentPath = window.location.pathname;
        const user = this.getCurrentUser();
        const isPublicPage = currentPath.includes('login') || 
                           currentPath.includes('cadastro') || 
                           currentPath === '/index.html' ||
                           currentPath.endsWith('/');

        // Se não está logado e tenta acessar página privada
        if (!user && !isPublicPage) {
            console.log('Usuário não autenticado, redirecionando para login');
            this.navigateTo('loginUsuario');
            return false;
        }

        // Se está logado mas está em página de login
        if (user && (currentPath.includes('login') || currentPath.includes('cadastro'))) {
            console.log('Usuário já logado, redirecionando para dashboard');
            const dashboardRoute = user.type === 'motoboy' ? 'dashboardMotoboy' : 'dashboardUsuario';
            this.navigateTo(dashboardRoute);
            return false;
        }

        return true;
    }

    // Sistema de logout
    logout() {
        // Confirmar logout
        if (confirm('Tem certeza que deseja sair?')) {
            // Limpar dados do localStorage
            localStorage.removeItem('droppoint_user');
            localStorage.removeItem('droppoint_token');
            localStorage.removeItem('droppoint_refresh_token');
            
            // Limpar sessionStorage
            sessionStorage.clear();
            
            // Redirecionar para home
            this.navigateTo('home');
            
            // Mostrar mensagem de sucesso
            setTimeout(() => {
                alert('Logout realizado com sucesso!');
            }, 100);
        }
    }

    // Configurar tratamento global de erros
    setupGlobalErrorHandling() {
        // Interceptar erros de rede
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Erro não tratado:', event.reason);
            
            if (event.reason?.message?.includes('fetch')) {
                this.showNotification('Erro de conexão. Verifique sua internet.', 'error');
            }
        });

        // Interceptar erros JavaScript
        window.addEventListener('error', (event) => {
            console.error('Erro JavaScript:', event.error);
        });
    }

    // Sistema de notificações
    showNotification(message, type = 'info', duration = 5000) {
        // Remover notificação existente
        const existing = document.querySelector('.droppoint-notification');
        if (existing) {
            existing.remove();
        }

        // Criar nova notificação
        const notification = document.createElement('div');
        notification.className = `droppoint-notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${this.getNotificationIcon(type)}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;
        
        // Estilos
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            max-width: 400px;
            animation: slideInRight 0.3s ease;
        `;

        // Event listeners
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });

        // Adicionar ao DOM
        document.body.appendChild(notification);

        // Auto remover
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
    }

    // Ícones para notificações
    getNotificationIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || icons.info;
    }

    // Cores para notificações
    getNotificationColor(type) {
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#007bff'
        };
        return colors[type] || colors.info;
    }

    // Verificar status do backend
    async checkBackendStatus() {
        try {
            const response = await fetch(this.routes.apiHealth);
            const data = await response.json();
            return data.status === 'OK';
        } catch (error) {
            console.warn('Backend não disponível:', error.message);
            return false;
        }
    }

    // Configurar interceptador de requests
    setupAPIInterceptor() {
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            // Adicionar headers padrão
            const user = this.getCurrentUser();
            if (user?.token) {
                options.headers = {
                    ...options.headers,
                    'Authorization': `Bearer ${user.token}`,
                    'Content-Type': 'application/json'
                };
            }

            try {
                const response = await originalFetch(url, options);
                
                // Lidar com 401 (não autorizado)
                if (response.status === 401) {
                    this.showNotification('Sessão expirada. Faça login novamente.', 'warning');
                    this.logout();
                    return;
                }

                return response;
            } catch (error) {
                console.error('Erro na requisição:', error);
                throw error;
            }
        };
    }

    // Métodos de utilidade para formulários
    validateForm(formElement) {
        const inputs = formElement.querySelectorAll('input[required]');
        let isValid = true;

        inputs.forEach(input => {
            if (!input.value.trim()) {
                this.showFieldError(input, 'Este campo é obrigatório');
                isValid = false;
            } else {
                this.clearFieldError(input);
            }
        });

        return isValid;
    }

    showFieldError(input, message) {
        this.clearFieldError(input);
        
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error';
        errorSpan.textContent = message;
        errorSpan.style.cssText = 'color: #dc3545; font-size: 12px; margin-top: 5px; display: block;';
        
        input.parentNode.appendChild(errorSpan);
        input.style.borderColor = '#dc3545';
    }

    clearFieldError(input) {
        const error = input.parentNode.querySelector('.field-error');
        if (error) {
            error.remove();
        }
        input.style.borderColor = '';
    }
}

// Inicializar sistema de navegação quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.DropPointNav = new DropPointNavigation();
});

// CSS para animações e estilos
const navigationStyles = `
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

    .btn-back-auto:hover {
        background: rgba(0, 123, 255, 1) !important;
        transform: translateY(-2px);
    }

    .notification-content {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .notification-close {
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        font-size: 18px;
        margin-left: auto;
    }

    .field-error {
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

// Adicionar estilos ao head
const styleSheet = document.createElement('style');
styleSheet.textContent = navigationStyles;
document.head.appendChild(styleSheet);