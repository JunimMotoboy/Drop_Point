/**
 * Responsive Test Utility
 * Testa e valida a responsividade do site
 */

class ResponsiveTest {
    constructor() {
        this.breakpoints = {
            mobile: { min: 0, max: 767 },
            tablet: { min: 768, max: 1023 },
            desktop: { min: 1024, max: Infinity }
        };
        
        this.tests = [];
        this.results = [];
        
        this.init();
    }
    
    init() {
        this.setupTests();
        this.createTestUI();
        this.runTests();
    }
    
    setupTests() {
        // Teste de navegação mobile
        this.addTest('Navigation Mobile', () => {
            return this.testMobileNavigation();
        });
        
        // Teste de layout de cards
        this.addTest('Cards Layout', () => {
            return this.testCardsLayout();
        });
        
        // Teste de formulários
        this.addTest('Forms Responsive', () => {
            return this.testFormsResponsive();
        });
        
        // Teste de texto
        this.addTest('Text Readability', () => {
            return this.testTextReadability();
        });
        
        // Teste de imagens
        this.addTest('Images Responsive', () => {
            return this.testImagesResponsive();
        });
        
        // Teste de touch targets
        this.addTest('Touch Targets', () => {
            return this.testTouchTargets();
        });
    }
    
    addTest(name, testFunction) {
        this.tests.push({ name, testFunction });
    }
    
    runTests() {
        this.results = [];
        
        this.tests.forEach(test => {
            try {
                const result = test.testFunction();
                this.results.push({
                    name: test.name,
                    passed: result.passed,
                    message: result.message,
                    details: result.details || []
                });
            } catch (error) {
                this.results.push({
                    name: test.name,
                    passed: false,
                    message: `Erro no teste: ${error.message}`,
                    details: []
                });
            }
        });
        
        this.displayResults();
    }
    
    testMobileNavigation() {
        const mobileToggle = document.querySelector('.mobile-menu-toggle');
        const mobileMenu = document.querySelector('.mobile-menu');
        const mainNav = document.querySelector('.main-nav');
        
        const issues = [];
        
        if (!mobileToggle) {
            issues.push('Menu toggle mobile não encontrado');
        }
        
        if (!mobileMenu) {
            issues.push('Menu mobile não encontrado');
        }
        
        if (window.innerWidth <= 768) {
            const mainNavVisible = mainNav && window.getComputedStyle(mainNav).display !== 'none';
            if (mainNavVisible) {
                issues.push('Menu principal ainda visível em tela mobile');
            }
        }
        
        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Navegação mobile OK' : 'Problemas na navegação mobile',
            details: issues
        };
    }
    
    testCardsLayout() {
        const cards = document.querySelectorAll('.feature-card, .pricing-card, .testimonial-card');
        const issues = [];
        
        if (window.innerWidth <= 768) {
            cards.forEach((card, index) => {
                const rect = card.getBoundingClientRect();
                
                // Verifica se o card não está saindo da tela
                if (rect.right > window.innerWidth) {
                    issues.push(`Card ${index + 1} saindo da tela (overflow horizontal)`);
                }
                
                // Verifica padding mínimo
                const styles = window.getComputedStyle(card);
                const padding = parseInt(styles.paddingLeft) + parseInt(styles.paddingRight);
                
                if (padding < 16) {
                    issues.push(`Card ${index + 1} com padding muito pequeno para mobile`);
                }
            });
        }
        
        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Layout de cards OK' : 'Problemas no layout de cards',
            details: issues
        };
    }
    
    testFormsResponsive() {
        const forms = document.querySelectorAll('form');
        const inputs = document.querySelectorAll('input, select, textarea');
        const issues = [];
        
        inputs.forEach((input, index) => {
            const rect = input.getBoundingClientRect();
            
            // Verifica se o input é grande o suficiente para touch
            if (rect.height < 44) {
                issues.push(`Input ${index + 1} muito pequeno para toque (${Math.round(rect.height)}px)`);
            }
            
            // Verifica se o input não está saindo da tela
            if (rect.right > window.innerWidth) {
                issues.push(`Input ${index + 1} saindo da tela`);
            }
        });
        
        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Formulários responsivos OK' : 'Problemas nos formulários',
            details: issues
        };
    }
    
    testTextReadability() {
        const textElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div');
        const issues = [];
        
        textElements.forEach((element, index) => {
            const styles = window.getComputedStyle(element);
            const fontSize = parseInt(styles.fontSize);
            const lineHeight = parseFloat(styles.lineHeight);
            
            // Verifica tamanho mínimo de fonte para mobile
            if (window.innerWidth <= 768 && fontSize < 14) {
                const tagName = element.tagName.toLowerCase();
                if (tagName === 'p' || tagName.startsWith('h')) {
                    issues.push(`Texto ${tagName} muito pequeno para mobile (${fontSize}px)`);
                }
            }
            
            // Verifica line-height adequado
            if (lineHeight && lineHeight < 1.2) {
                issues.push(`Line-height muito pequeno no elemento ${element.tagName}`);
            }
        });
        
        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Legibilidade do texto OK' : 'Problemas na legibilidade',
            details: issues.slice(0, 10) // Limita para não ficar muito verboso
        };
    }
    
    testImagesResponsive() {
        const images = document.querySelectorAll('img');
        const issues = [];
        
        images.forEach((img, index) => {
            const rect = img.getBoundingClientRect();
            
            // Verifica se a imagem não está saindo da tela
            if (rect.right > window.innerWidth) {
                issues.push(`Imagem ${index + 1} saindo da tela`);
            }
            
            // Verifica se tem max-width
            const styles = window.getComputedStyle(img);
            if (styles.maxWidth === 'none' && !img.style.maxWidth) {
                issues.push(`Imagem ${index + 1} sem max-width definido`);
            }
        });
        
        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Imagens responsivas OK' : 'Problemas nas imagens',
            details: issues
        };
    }
    
    testTouchTargets() {
        const touchElements = document.querySelectorAll('button, a, input[type="button"], input[type="submit"], .btn');
        const issues = [];
        
        touchElements.forEach((element, index) => {
            const rect = element.getBoundingClientRect();
            const minSize = 44; // Tamanho mínimo recomendado para touch
            
            if (rect.width < minSize || rect.height < minSize) {
                const tagName = element.tagName.toLowerCase();
                const className = element.className || 'sem-classe';
                issues.push(`Elemento ${tagName}.${className} muito pequeno para toque (${Math.round(rect.width)}x${Math.round(rect.height)}px)`);
            }
        });
        
        return {
            passed: issues.length === 0,
            message: issues.length === 0 ? 'Touch targets OK' : 'Problemas nos touch targets',
            details: issues
        };
    }
    
    getCurrentBreakpoint() {
        const width = window.innerWidth;
        
        if (width <= this.breakpoints.mobile.max) return 'mobile';
        if (width <= this.breakpoints.tablet.max) return 'tablet';
        return 'desktop';
    }
    
    createTestUI() {
        // Cria overlay para resultados dos testes
        const overlay = document.createElement('div');
        overlay.id = 'responsive-test-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 10000;
            display: none;
            padding: 20px;
            box-sizing: border-box;
            overflow-y: auto;
        `;
        
        const container = document.createElement('div');
        container.style.cssText = `
            background: white;
            border-radius: 8px;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
            position: relative;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.style.cssText = `
            position: absolute;
            top: 10px;
            right: 15px;
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            color: #999;
        `;
        
        closeBtn.onclick = () => {
            overlay.style.display = 'none';
        };
        
        const content = document.createElement('div');
        content.id = 'test-results-content';
        
        container.appendChild(closeBtn);
        container.appendChild(content);
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        // Cria botão flutuante para abrir testes
        const testBtn = document.createElement('button');
        testBtn.id = 'responsive-test-btn';
        testBtn.innerHTML = '📱';
        testBtn.title = 'Testar Responsividade';
        testBtn.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #3498db;
            color: white;
            border: none;
            font-size: 20px;
            cursor: pointer;
            z-index: 9999;
            box-shadow: 0 2px 10px rgba(0,0,0,0.3);
            transition: all 0.3s ease;
        `;
        
        testBtn.onmouseover = () => {
            testBtn.style.transform = 'scale(1.1)';
        };
        
        testBtn.onmouseout = () => {
            testBtn.style.transform = 'scale(1)';
        };
        
        testBtn.onclick = () => {
            this.runTests();
            overlay.style.display = 'block';
        };
        
        document.body.appendChild(testBtn);
    }
    
    displayResults() {
        const content = document.getElementById('test-results-content');
        if (!content) return;
        
        const breakpoint = this.getCurrentBreakpoint();
        const passed = this.results.filter(r => r.passed).length;
        const total = this.results.length;
        
        let html = `
            <h2>Resultados dos Testes de Responsividade</h2>
            <div style="margin-bottom: 20px;">
                <strong>Breakpoint atual:</strong> ${breakpoint} (${window.innerWidth}px)<br>
                <strong>Testes passaram:</strong> ${passed}/${total}
            </div>
        `;
        
        this.results.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            const statusColor = result.passed ? '#27ae60' : '#e74c3c';
            
            html += `
                <div style="margin-bottom: 15px; padding: 10px; border-left: 4px solid ${statusColor}; background: #f8f9fa;">
                    <h4 style="margin: 0 0 5px 0;">${status} ${result.name}</h4>
                    <p style="margin: 0 0 5px 0; color: #666;">${result.message}</p>
            `;
            
            if (result.details.length > 0) {
                html += '<ul style="margin: 5px 0 0 20px; color: #999; font-size: 14px;">';
                result.details.forEach(detail => {
                    html += `<li>${detail}</li>`;
                });
                html += '</ul>';
            }
            
            html += '</div>';
        });
        
        html += `
            <div style="margin-top: 20px; padding: 15px; background: #f1f2f6; border-radius: 5px;">
                <h4>Dicas para melhorar a responsividade:</h4>
                <ul>
                    <li>Use unidades relativas (rem, em, %) em vez de pixels fixos</li>
                    <li>Implemente breakpoints consistentes</li>
                    <li>Teste em dispositivos reais, não apenas no DevTools</li>
                    <li>Garanta que todos os elementos interativos tenham pelo menos 44px</li>
                    <li>Use font-size mínimo de 16px para evitar zoom automático no iOS</li>
                </ul>
            </div>
        `;
        
        content.innerHTML = html;
    }
}

// Inicializa o teste quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ResponsiveTest();
    });
} else {
    new ResponsiveTest();
}

// Exporta para uso global
window.ResponsiveTest = ResponsiveTest;