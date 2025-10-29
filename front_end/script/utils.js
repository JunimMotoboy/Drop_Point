// DropPoint - Utilitários Globais
// Funções comuns para todas as páginas

class DropPointUtils {
    constructor() {
        this.API_BASE = 'http://localhost:3000/api';
        this.init();
    }

    init() {
        this.setupGlobalFunctions();
        this.checkServerStatus();
    }

    // Configurar funções globais
    setupGlobalFunctions() {
        // Função global para validar campos
        window.validateField = (field, rules) => this.validateField(field, rules);
        
        // Função global para mostrar loading
        window.showLoading = (element) => this.showLoading(element);
        window.hideLoading = (element) => this.hideLoading(element);
        
        // Função global para formatar dados
        window.formatCurrency = (value) => this.formatCurrency(value);
        window.formatDate = (date) => this.formatDate(date);
        window.formatPhone = (phone) => this.formatPhone(phone);
        
        // Função global para máscaras
        window.applyMasks = () => this.applyMasks();
        
        // Função global para API calls
        window.apiCall = (endpoint, options) => this.apiCall(endpoint, options);
    }

    // Validar campo individual
    validateField(field, rules) {
        const value = field.value.trim();
        const fieldName = field.getAttribute('data-name') || field.name || 'Campo';
        
        // Limpar erros anteriores
        this.clearFieldError(field);
        
        // Validar se é obrigatório
        if (rules.required && !value) {
            this.showFieldError(field, `${fieldName} é obrigatório`);
            return false;
        }
        
        // Validar tamanho mínimo
        if (rules.minLength && value.length < rules.minLength) {
            this.showFieldError(field, `${fieldName} deve ter pelo menos ${rules.minLength} caracteres`);
            return false;
        }
        
        // Validar email
        if (rules.email && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(field, 'Digite um e-mail válido');
                return false;
            }
        }
        
        // Validar telefone
        if (rules.phone && value) {
            const phoneRegex = /^\(\d{2}\)\s\d{4,5}-\d{4}$/;
            if (!phoneRegex.test(value)) {
                this.showFieldError(field, 'Digite um telefone válido (XX) XXXXX-XXXX');
                return false;
            }
        }
        
        // Validar CPF
        if (rules.cpf && value) {
            if (!this.validateCPF(value)) {
                this.showFieldError(field, 'Digite um CPF válido');
                return false;
            }
        }
        
        return true;
    }

    // Mostrar erro no campo
    showFieldError(field, message) {
        this.clearFieldError(field);
        
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error-message';
        errorElement.textContent = message;
        errorElement.style.cssText = `
            color: #dc3545;
            font-size: 12px;
            margin-top: 5px;
            display: block;
            animation: fadeIn 0.3s ease;
        `;
        
        field.style.borderColor = '#dc3545';
        field.parentNode.appendChild(errorElement);
    }

    // Limpar erro do campo
    clearFieldError(field) {
        const errorElement = field.parentNode.querySelector('.field-error-message');
        if (errorElement) {
            errorElement.remove();
        }
        field.style.borderColor = '';
    }

    // Validar CPF
    validateCPF(cpf) {
        cpf = cpf.replace(/[^\d]+/g, '');
        
        if (cpf.length !== 11 || !!cpf.match(/(\d)\1{10}/)) {
            return false;
        }
        
        const values = cpf.split('').map(el => +el);
        const rest = (count) => (values.slice(0, count-1)
            .reduce((soma, el, index) => (soma + el * (count-index)), 0) * 10) % 11 % 10;
        
        return rest(10) === values[9] && rest(11) === values[10];
    }

    // Mostrar loading
    showLoading(element) {
        if (!element) {
            element = document.querySelector('.btn-entrar, .btn-cadastrar, .btn-primary');
        }
        
        if (element) {
            element.disabled = true;
            element.style.opacity = '0.7';
            
            const originalText = element.textContent;
            element.setAttribute('data-original-text', originalText);
            element.innerHTML = '<span class="spinner"></span> Carregando...';
        }
    }

    // Esconder loading
    hideLoading(element) {
        if (!element) {
            element = document.querySelector('.btn-entrar, .btn-cadastrar, .btn-primary');
        }
        
        if (element) {
            element.disabled = false;
            element.style.opacity = '1';
            
            const originalText = element.getAttribute('data-original-text');
            if (originalText) {
                element.textContent = originalText;
                element.removeAttribute('data-original-text');
            }
        }
    }

    // Formatar moeda
    formatCurrency(value) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    }

    // Formatar data
    formatDate(date) {
        if (typeof date === 'string') {
            date = new Date(date);
        }
        
        return new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        }).format(date);
    }

    // Formatar telefone
    formatPhone(phone) {
        const numbers = phone.replace(/\D/g, '');
        
        if (numbers.length === 11) {
            return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (numbers.length === 10) {
            return numbers.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        
        return phone;
    }

    // Aplicar máscaras automaticamente
    applyMasks() {
        // Máscara de telefone
        const phoneInputs = document.querySelectorAll('input[type="tel"], input[data-mask="phone"]');
        phoneInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                e.target.value = this.formatPhone(e.target.value);
            });
        });

        // Máscara de CPF
        const cpfInputs = document.querySelectorAll('input[data-mask="cpf"]');
        cpfInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d)/, '$1.$2');
                value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
                e.target.value = value;
            });
        });

        // Máscara de CEP
        const cepInputs = document.querySelectorAll('input[data-mask="cep"]');
        cepInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                let value = e.target.value.replace(/\D/g, '');
                value = value.replace(/(\d{5})(\d)/, '$1-$2');
                e.target.value = value;
            });
        });
    }

    // Chamada para API com tratamento de erros
    async apiCall(endpoint, options = {}) {
        const url = endpoint.startsWith('http') ? endpoint : `${this.API_BASE}${endpoint}`;
        
        // Configurações padrão
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json'
            }
        };

        // Adicionar token se disponível
        const user = JSON.parse(localStorage.getItem('droppoint_user') || 'null');
        if (user?.token) {
            defaultOptions.headers['Authorization'] = `Bearer ${user.token}`;
        }

        // Merge das opções
        const finalOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, finalOptions);
            
            // Verificar se é JSON
            const contentType = response.headers.get('content-type');
            const isJSON = contentType && contentType.includes('application/json');
            
            const data = isJSON ? await response.json() : await response.text();
            
            if (!response.ok) {
                throw new Error(data.error || data.message || `Erro ${response.status}`);
            }
            
            return data;
            
        } catch (error) {
            console.error('Erro na API:', error);
            throw error;
        }
    }

    // Verificar status do servidor
    async checkServerStatus() {
        try {
            const response = await fetch(`${this.API_BASE}/health`);
            const data = await response.json();
            
            if (data.status === 'OK') {
                console.log('✅ Backend conectado');
                this.showServerStatus(true);
            } else {
                throw new Error('Backend indisponível');
            }
        } catch (error) {
            console.warn('⚠️ Backend offline:', error.message);
            this.showServerStatus(false);
        }
    }

    // Mostrar status do servidor
    showServerStatus(isOnline) {
        // Remover status anterior
        const existingStatus = document.querySelector('.server-status');
        if (existingStatus) {
            existingStatus.remove();
        }

        // Criar novo indicador
        const statusElement = document.createElement('div');
        statusElement.className = 'server-status';
        statusElement.innerHTML = `
            <div class="status-indicator ${isOnline ? 'online' : 'offline'}">
                <span class="status-dot"></span>
                <span class="status-text">${isOnline ? 'Online' : 'Offline'}</span>
            </div>
        `;
        
        statusElement.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 1000;
            font-size: 12px;
            opacity: 0.8;
        `;
        
        document.body.appendChild(statusElement);
        
        // Auto remover após 5 segundos se online
        if (isOnline) {
            setTimeout(() => {
                if (statusElement.parentNode) {
                    statusElement.remove();
                }
            }, 5000);
        }
    }

    // Debounce function
    debounce(func, wait) {
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

    // Local Storage helpers
    setLocalData(key, data) {
        try {
            localStorage.setItem(`droppoint_${key}`, JSON.stringify(data));
        } catch (error) {
            console.error('Erro ao salvar no localStorage:', error);
        }
    }

    getLocalData(key) {
        try {
            const data = localStorage.getItem(`droppoint_${key}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Erro ao ler do localStorage:', error);
            return null;
        }
    }

    removeLocalData(key) {
        try {
            localStorage.removeItem(`droppoint_${key}`);
        } catch (error) {
            console.error('Erro ao remover do localStorage:', error);
        }
    }
}

// CSS para os estilos dos utilitários
const utilsStyles = `
    .spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #ffffff;
        border-radius: 50%;
        border-top-color: transparent;
        animation: spin 1s ease-in-out infinite;
    }

    @keyframes spin {
        to { transform: rotate(360deg); }
    }

    .server-status .status-indicator {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        border-radius: 20px;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    }

    .server-status .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #28a745;
    }

    .server-status .status-indicator.offline .status-dot {
        background: #dc3545;
    }

    .field-error-message {
        animation: fadeIn 0.3s ease;
    }

    @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-5px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

// Adicionar estilos
const utilsStyleSheet = document.createElement('style');
utilsStyleSheet.textContent = utilsStyles;
document.head.appendChild(utilsStyleSheet);

// Inicializar utilitários quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    window.DropPointUtils = new DropPointUtils();
    
    // Aplicar máscaras automaticamente
    window.DropPointUtils.applyMasks();
});