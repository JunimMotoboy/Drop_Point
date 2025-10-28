// Configuração e validação do formulário de login
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const senhaInput = document.getElementById('senha');
    const loginBtn = document.getElementById('loginBtn');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const btnText = document.querySelector('.btn-text');

    // Validação em tempo real
    emailInput.addEventListener('blur', validateEmail);
    senhaInput.addEventListener('blur', validatePassword);
    
    // Submit do formulário
    loginForm.addEventListener('submit', handleLogin);

    function validateEmail() {
        const email = emailInput.value.trim();
        const emailError = document.getElementById('email-error');
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

        if (!email) {
            showError(emailError, 'E-mail é obrigatório');
            return false;
        } else if (!emailRegex.test(email)) {
            showError(emailError, 'Digite um e-mail válido');
            return false;
        } else {
            hideError(emailError);
            return true;
        }
    }

    function validatePassword() {
        const senha = senhaInput.value.trim();
        const senhaError = document.getElementById('senha-error');

        if (!senha) {
            showError(senhaError, 'Senha é obrigatória');
            return false;
        } else if (senha.length < 6) {
            showError(senhaError, 'Senha deve ter pelo menos 6 caracteres');
            return false;
        } else {
            hideError(senhaError);
            return true;
        }
    }

    function showError(errorElement, message) {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        errorElement.parentElement.querySelector('.input-field').style.borderColor = '#e74c3c';
    }

    function hideError(errorElement) {
        errorElement.style.display = 'none';
        errorElement.parentElement.querySelector('.input-field').style.borderColor = '#ddd';
    }

    async function handleLogin(e) {
        e.preventDefault();
        
        // Validar campos
        const isEmailValid = validateEmail();
        const isPasswordValid = validatePassword();
        
        if (!isEmailValid || !isPasswordValid) {
            return;
        }

        // Mostrar loading
        showLoading();

        try {
            // Simular chamada à API (substitua pela sua lógica de autenticação)
            const loginData = {
                email: emailInput.value.trim(),
                senha: senhaInput.value.trim()
            };

            // Simulação de login (substitua pela chamada real à API)
            const loginResult = await simulateLogin(loginData);
            
            if (loginResult.success) {
                // Salvar dados do usuário no localStorage
                localStorage.setItem('user', JSON.stringify(loginResult.user));
                localStorage.setItem('isLoggedIn', 'true');
                
                // Mostrar sucesso
                showSuccess('Login realizado com sucesso!');
                
                // Redirecionar após 1 segundo
                setTimeout(() => {
                    window.location.href = 'dashboardUsuario.html';
                }, 1000);
                
            } else {
                throw new Error(loginResult.message || 'Credenciais inválidas');
            }
            
        } catch (error) {
            showAlert('Erro no login: ' + error.message, 'error');
        } finally {
            hideLoading();
        }
    }

    function showLoading() {
        loginBtn.disabled = true;
        btnText.style.display = 'none';
        loadingSpinner.style.display = 'block';
    }

    function hideLoading() {
        loginBtn.disabled = false;
        btnText.style.display = 'block';
        loadingSpinner.style.display = 'none';
    }

    function showSuccess(message) {
        showAlert(message, 'success');
    }

    function showAlert(message, type = 'error') {
        // Remover alertas existentes
        const existingAlert = document.querySelector('.alert-message');
        if (existingAlert) {
            existingAlert.remove();
        }

        // Criar novo alerta
        const alert = document.createElement('div');
        alert.className = `alert-message alert-${type}`;
        alert.textContent = message;
        
        // Inserir no formulário
        loginForm.insertBefore(alert, loginForm.firstChild);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, 5000);
    }

    // Simulação de login (substitua pela sua lógica real)
    async function simulateLogin(loginData) {
        // Simular delay da rede
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Simulação de usuários válidos (substitua pela validação real)
        const validUsers = [
            { email: 'user@teste.com', senha: '123456', nome: 'Usuário Teste', id: 1 },
            { email: 'admin@droppoint.com', senha: 'admin123', nome: 'Administrador', id: 2 }
        ];
        
        const user = validUsers.find(u => 
            u.email === loginData.email && u.senha === loginData.senha
        );
        
        if (user) {
            return {
                success: true,
                user: {
                    id: user.id,
                    nome: user.nome,
                    email: user.email
                }
            };
        } else {
            return {
                success: false,
                message: 'E-mail ou senha incorretos'
            };
        }
    }
});

// Função para alternar visibilidade da senha
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.parentElement.querySelector('.toggle-password');
    
    if (input.type === 'password') {
        input.type = 'text';
        button.textContent = '🙈';
    } else {
        input.type = 'password';
        button.textContent = '👁️';
    }
}

// Verificar se já está logado
document.addEventListener('DOMContentLoaded', function() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    if (isLoggedIn === 'true') {
        // Já está logado, redirecionar para dashboard
        window.location.href = '../public/dashboardUsuario.html';
    }
});