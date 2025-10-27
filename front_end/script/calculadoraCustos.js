// Dados simulados de avaliações
let evaluationsData = {
    pending: [
        {
            id: 'p1',
            type: 'delivery',
            orderId: 'DP2024001',
            date: '2024-01-15T14:30:00',
            title: 'Entrega de Documentos',
            details: 'Rua das Flores, 123 → Av. Paulista, 1578',
            motoboyName: 'Carlos Silva',
            estimatedTime: '30 min',
            actualTime: '25 min'
        },
        {
            id: 'p2',
            type: 'motoboy',
            orderId: 'DP2024002',
            date: '2024-01-14T16:45:00',
            title: 'Atendimento do Motoboy',
            details: 'Entrega de encomenda - Maria Santos',
            motoboyName: 'Maria Santos',
            rating: null
        }
    ],
    completed: [
        {
            id: 'e1',
            type: 'delivery',
            orderId: 'DP2024000',
            date: '2024-01-10T12:00:00',
            title: 'Entrega de Encomenda',
            details: 'Centro → Zona Sul',
            rating: {
                overall: 5,
                aspects: {
                    speed: 5,
                    communication: 4,
                    care: 5,
                    professionalism: 5
                }
            },
            comment: 'Excelente serviço! O motoboy foi muito profissional e a entrega foi super rápida.',
            tags: ['Pontual', 'Profissional', 'Cuidadoso'],
            recommend: 'yes',
            motoboyName: 'João Pedro',
            helpful: 12,
            response: 'Obrigado pelo feedback! Continuaremos mantendo este padrão de qualidade.'
        },
        {
            id: 'e2',
            type: 'app',
            date: '2024-01-08T09:30:00',
            title: 'Experiência com o App',
            rating: {
                overall: 4,
                aspects: {
                    usability: 4,
                    performance: 4,
                    features: 3,
                    design: 5
                }
            },
            comment: 'App muito bem feito, mas poderia ter mais opções de pagamento.',
            tags: ['Fácil de usar', 'Design bonito'],
            recommend: 'yes',
            suggestions: 'Adicionar PIX como forma de pagamento',
            helpful: 8
        }
    ],
    stats: {
        total: 15,
        average: 4.6,
        helpful: 45,
        improvements: 8
    }
};

// Configurações de avaliação por tipo
const evaluationTypes = {
    delivery: {
        title: 'Avaliar Entrega',
        aspects: [
            { key: 'speed', label: 'Velocidade' },
            { key: 'communication', label: 'Comunicação' },
            { key: 'care', label: 'Cuidado com item' },
            { key: 'professionalism', label: 'Profissionalismo' }
        ],
        tags: [
            'Pontual', 'Rápido', 'Cuidadoso', 'Profissional', 'Comunicativo',
            'Atencioso', 'Confiável', 'Eficiente', 'Cortês', 'Responsável'
        ]
    },
    motoboy: {
        title: 'Avaliar Motoboy',
        aspects: [
            { key: 'communication', label: 'Comunicação' },
            { key: 'professionalism', label: 'Profissionalismo' },
            { key: 'punctuality', label: 'Pontualidade' },
            { key: 'friendliness', label: 'Simpatia' }
        ],
        tags: [
            'Simpático', 'Profissional', 'Pontual', 'Comunicativo', 'Educado',
            'Atencioso', 'Confiável', 'Prestativo', 'Organizado', 'Eficiente'
        ]
    },
    app: {
        title: 'Avaliar Aplicativo',
        aspects: [
            { key: 'usability', label: 'Facilidade de uso' },
            { key: 'performance', label: 'Performance' },
            { key: 'features', label: 'Funcionalidades' },
            { key: 'design', label: 'Design' }
        ],
        tags: [
            'Intuitivo', 'Rápido', 'Bonito', 'Funcional', 'Estável',
            'Útil', 'Moderno', 'Prático', 'Completo', 'Responsivo'
        ]
    }
};

// Estado atual
let currentEvaluation = null;
let currentRatings = {};

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    loadEvaluationsData();
    renderPendingEvaluations();
    renderCompletedEvaluations();
    renderStats();
    renderInsights();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Filtros
    document.getElementById('filterType').addEventListener('change', filterEvaluations);
    document.getElementById('filterRating').addEventListener('change', filterEvaluations);
    
    // Modal de avaliação
    setupEvaluationModal();
}

// Carregar dados (simulado)
function loadEvaluationsData() {
    const savedData = localStorage.getItem('evaluationsData');
    if (savedData) {
        evaluationsData = { ...evaluationsData, ...JSON.parse(savedData) };
    }
    
    // Atualizar badge de rating no header
    const userRating = document.getElementById('userRating');
    userRating.textContent = `⭐ ${evaluationsData.stats.average.toFixed(1)}`;
}

// Renderizar avaliações pendentes
function renderPendingEvaluations() {
    const container = document.getElementById('pendingCards');
    const pendingSection = document.querySelector('.pending-evaluations');
    
    if (evaluationsData.pending.length === 0) {
        pendingSection.style.display = 'none';
        return;
    }
    
    pendingSection.style.display = 'block';
    
    container.innerHTML = evaluationsData.pending.map(evaluation => {
        const date = new Date(evaluation.date);
        const timeAgo = getTimeAgo(date);
        
        return `
            <div class="pending-card" data-id="${evaluation.id}">
                <div class="pending-header">
                    <span class="pending-type">${getTypeLabel(evaluation.type)}</span>
                    <span class="pending-date">${timeAgo}</span>
                </div>
                <div class="pending-info">
                    <h3>${evaluation.title}</h3>
                    <div class="pending-details">
                        <p>${evaluation.details}</p>
                        ${evaluation.motoboyName ? `<p><strong>Motoboy:</strong> ${evaluation.motoboyName}</p>` : ''}
                        ${evaluation.orderId ? `<p><strong>Pedido:</strong> ${evaluation.orderId}</p>` : ''}
                    </div>
                </div>
                <div class="pending-actions">
                    <button class="evaluate-btn" onclick="openEvaluationModal('${evaluation.id}')">
                        ⭐ Avaliar
                    </button>
                    <button class="skip-btn" onclick="skipEvaluation('${evaluation.id}')">
                        Depois
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar avaliações completas
function renderCompletedEvaluations() {
    const container = document.getElementById('evaluationsList');
    
    if (evaluationsData.completed.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⭐</div>
                <h3>Nenhuma avaliação ainda</h3>
                <p>Suas avaliações aparecerão aqui após serem enviadas</p>
                <button class="action-btn" onclick="openGeneralReviewModal()">
                    Fazer primeira avaliação
                </button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = evaluationsData.completed.map(evaluation => {
        const date = new Date(evaluation.date);
        const stars = '⭐'.repeat(evaluation.rating.overall);
        
        return `
            <div class="evaluation-item" onclick="openEvaluationDetails('${evaluation.id}')">
                <div class="evaluation-header">
                    <div class="evaluation-meta">
                        <div class="evaluation-title">${evaluation.title}</div>
                        <div class="evaluation-subtitle">${evaluation.details || ''}</div>
                        <div class="evaluation-date">${formatDate(date)}</div>
                    </div>
                    <div class="evaluation-rating">
                        <div class="stars">${stars}</div>
                        <div class="rating-number">${evaluation.rating.overall}.0</div>
                    </div>
                </div>
                <div class="evaluation-content">
                    ${evaluation.comment ? `<div class="evaluation-comment">"${evaluation.comment}"</div>` : ''}
                    ${evaluation.tags ? `
                        <div class="evaluation-tags">
                            ${evaluation.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
                <div class="evaluation-footer">
                    <span class="evaluation-type">${getTypeLabel(evaluation.type)}</span>
                    <div class="evaluation-actions">
                        ${evaluation.helpful ? `<span class="action-btn">👍 ${evaluation.helpful} úteis</span>` : ''}
                        <button class="action-btn" onclick="event.stopPropagation(); editEvaluation('${evaluation.id}')">
                            ✏️ Editar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Renderizar estatísticas
function renderStats() {
    document.getElementById('totalEvaluations').textContent = evaluationsData.stats.total;
    document.getElementById('averageRating').textContent = evaluationsData.stats.average.toFixed(1);
    document.getElementById('helpfulReviews').textContent = evaluationsData.stats.helpful;
    document.getElementById('improvementImpact').textContent = evaluationsData.stats.improvements;
}

// Renderizar insights
function renderInsights() {
    const container = document.getElementById('insightsGrid');
    
    const insights = [
        {
            icon: '🎯',
            title: 'Seus Pontos Fortes',
            content: 'Você avalia de forma construtiva e balanceada. Suas avaliações têm nota média de 4.6.',
            action: 'Ver Padrões'
        },
        {
            icon: '📈',
            title: 'Impacto das Suas Avaliações',
            content: '8 melhorias foram implementadas baseadas em seus feedbacks. Continue contribuindo!',
            action: 'Ver Melhorias'
        },
        {
            icon: '⏰',
            title: 'Lembrete de Avaliação',
            content: 'Você tem 2 entregas aguardando avaliação. Que tal avaliar agora?',
            action: 'Avaliar Agora'
        },
        {
            icon: '🏆',
            title: 'Conquista Desbloqueada',
            content: 'Parabéns! Você se tornou um "Avaliador Confiável" com 15+ avaliações úteis.',
            action: 'Ver Conquistas'
        }
    ];
    
    container.innerHTML = insights.map(insight => `
        <div class="insight-card">
            <div class="insight-header">
                <span class="insight-icon">${insight.icon}</span>
                <span class="insight-title">${insight.title}</span>
            </div>
            <div class="insight-content">${insight.content}</div>
            <button class="insight-action" onclick="handleInsightAction('${insight.action.toLowerCase().replace(' ', '-')}')">${insight.action}</button>
        </div>
    `).join('');
}

// Configurar modal de avaliação
function setupEvaluationModal() {
    const modal = document.getElementById('evaluationModal');
    const closeBtn = document.querySelector('.modal-close');
    
    closeBtn.addEventListener('click', closeEvaluationModal);
    
    // Fechar modal clicando fora
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeEvaluationModal();
        }
    });
}

// Abrir modal de avaliação
function openEvaluationModal(evaluationId, type = null) {
    const modal = document.getElementById('evaluationModal');
    
    if (evaluationId) {
        currentEvaluation = evaluationsData.pending.find(e => e.id === evaluationId);
    } else {
        // Nova avaliação geral
        currentEvaluation = {
            id: 'new',
            type: type || 'app',
            title: 'Nova Avaliação'
        };
    }
    
    setupEvaluationForm();
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function openGeneralReviewModal() {
    openEvaluationModal(null, 'app');
}

// Configurar formulário de avaliação
function setupEvaluationForm() {
    const typeConfig = evaluationTypes[currentEvaluation.type];
    
    // Título do modal
    document.getElementById('modalTitle').textContent = typeConfig.title;
    
    // Informações do item sendo avaliado
    setupEvaluationItemInfo();
    
    // Sistema de rating principal
    setupStarRating();
    
    // Aspectos específicos
    setupAspectsRating(typeConfig.aspects);
    
    // Tags de feedback
    setupFeedbackTags(typeConfig.tags);
    
    // Resetar ratings
    currentRatings = { overall: 0 };
}

function setupEvaluationItemInfo() {
    const container = document.getElementById('evaluationItemInfo');
    
    if (currentEvaluation.id === 'new') {
        container.innerHTML = `
            <div class="item-header">
                <span class="item-title">Avaliação Geral</span>
                <span class="item-id">Experiência Geral</span>
            </div>
            <div class="item-details">
                Conte-nos sobre sua experiência geral com nossos serviços
            </div>
        `;
    } else {
        container.innerHTML = `
            <div class="item-header">
                <span class="item-title">${currentEvaluation.title}</span>
                <span class="item-id">${currentEvaluation.orderId || 'ID: ' + currentEvaluation.id}</span>
            </div>
            <div class="item-details">
                ${currentEvaluation.details}<br>
                ${currentEvaluation.motoboyName ? `<strong>Motoboy:</strong> ${currentEvaluation.motoboyName}<br>` : ''}
                <strong>Data:</strong> ${formatDate(new Date(currentEvaluation.date))}
            </div>
        `;
    }
}

function setupStarRating() {
    const starRating = document.querySelector('[data-rating="overall"]');
    const stars = starRating.querySelectorAll('.star');
    const ratingText = document.getElementById('overallRatingText');
    
    stars.forEach((star, index) => {
        star.addEventListener('click', () => {
            const rating = index + 1;
            currentRatings.overall = rating;
            updateStars(starRating, rating);
            updateRatingText(ratingText, rating);
        });
        
        star.addEventListener('mouseenter', () => {
            updateStars(starRating, index + 1);
        });
    });
    
    starRating.addEventListener('mouseleave', () => {
        updateStars(starRating, currentRatings.overall);
    });
}

function setupAspectsRating(aspects) {
    const container = document.getElementById('aspectsRating');
    
    if (!aspects || aspects.length === 0) {
        container.style.display = 'none';
        return;
    }
    
    container.style.display = 'block';
    container.innerHTML = `
        <h4 style="color: #fff; margin-bottom: 15px;">Avalie aspectos específicos:</h4>
        ${aspects.map(aspect => `
            <div class="aspect-item">
                <span class="aspect-label">${aspect.label}</span>
                <div class="aspect-stars" data-aspect="${aspect.key}">
                    ${Array.from({ length: 5 }, (_, i) => `
                        <span class="star" data-value="${i + 1}">⭐</span>
                    `).join('')}
                </div>
            </div>
        `).join('')}
    `;
    
    // Configurar event listeners para aspectos
    aspects.forEach(aspect => {
        const aspectRating = container.querySelector(`[data-aspect="${aspect.key}"]`);
        const stars = aspectRating.querySelectorAll('.star');
        
        stars.forEach((star, index) => {
            star.addEventListener('click', () => {
                const rating = index + 1;
                currentRatings[aspect.key] = rating;
                updateStars(aspectRating, rating);
            });
            
            star.addEventListener('mouseenter', () => {
                updateStars(aspectRating, index + 1);
            });
        });
        
        aspectRating.addEventListener('mouseleave', () => {
            updateStars(aspectRating, currentRatings[aspect.key] || 0);
        });
    });
}

function setupFeedbackTags(tags) {
    const container = document.getElementById('feedbackTags');
    
    container.innerHTML = tags.map((tag, index) => `
        <div class="feedback-tag">
            <input type="checkbox" id="tag-${index}" name="tags" value="${tag}">
            <label for="tag-${index}">${tag}</label>
        </div>
    `).join('');
}

function updateStars(container, rating) {
    const stars = container.querySelectorAll('.star');
    stars.forEach((star, index) => {
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function updateRatingText(textElement, rating) {
    const texts = [
        'Clique nas estrelas para avaliar',
        'Muito ruim',
        'Ruim',
        'Regular',
        'Bom',
        'Excelente'
    ];
    
    textElement.textContent = texts[rating] || texts[0];
}

// Fechar modal
function closeEvaluationModal() {
    const modal = document.getElementById('evaluationModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    currentEvaluation = null;
    currentRatings = {};
}

// Enviar avaliação
function submitEvaluation() {
    if (!validateEvaluation()) {
        return;
    }
    
    const formData = collectFormData();
    const newEvaluation = createEvaluationObject(formData);
    
    // Adicionar às avaliações completas
    evaluationsData.completed.unshift(newEvaluation);
    
    // Remover das pendentes (se aplicável)
    if (currentEvaluation.id !== 'new') {
        evaluationsData.pending = evaluationsData.pending.filter(e => e.id !== currentEvaluation.id);
    }
    
    // Atualizar estatísticas
    updateStats();
    
    // Salvar dados
    saveEvaluationsData();
    
    // Atualizar interface
    renderPendingEvaluations();
    renderCompletedEvaluations();
    renderStats();
    renderInsights();
    
    // Fechar modal e mostrar confirmação
    closeEvaluationModal();
    showNotification('Avaliação enviada com sucesso! Obrigado pelo seu feedback.', 'success');
}

function validateEvaluation() {
    if (!currentRatings.overall || currentRatings.overall === 0) {
        showNotification('Por favor, dê uma nota geral para continuar.', 'error');
        return false;
    }
    
    return true;
}

function collectFormData() {
    const form = document.getElementById('evaluationForm');
    const formData = new FormData(form);
    
    // Coletar tags selecionadas
    const selectedTags = Array.from(form.querySelectorAll('input[name="tags"]:checked'))
        .map(input => input.value);
    
    return {
        comment: formData.get('comment'),
        suggestions: formData.get('suggestions'),
        recommend: formData.get('recommend'),
        tags: selectedTags
    };
}

function createEvaluationObject(formData) {
    return {
        id: 'e' + Date.now(),
        type: currentEvaluation.type,
        orderId: currentEvaluation.orderId,
        date: new Date().toISOString(),
        title: currentEvaluation.title,
        details: currentEvaluation.details,
        rating: {
            overall: currentRatings.overall,
            aspects: { ...currentRatings }
        },
        comment: formData.comment,
        tags: formData.tags,
        recommend: formData.recommend,
        suggestions: formData.suggestions,
        motoboyName: currentEvaluation.motoboyName,
        helpful: 0
    };
}

// Filtrar avaliações
function filterEvaluations() {
    const typeFilter = document.getElementById('filterType').value;
    const ratingFilter = document.getElementById('filterRating').value;
    
    let filtered = [...evaluationsData.completed];
    
    if (typeFilter !== 'all') {
        filtered = filtered.filter(e => e.type === typeFilter);
    }
    
    if (ratingFilter !== 'all') {
        const rating = parseInt(ratingFilter);
        filtered = filtered.filter(e => e.rating.overall === rating);
    }
    
    renderFilteredEvaluations(filtered);
}

function renderFilteredEvaluations(evaluations) {
    const container = document.getElementById('evaluationsList');
    
    if (evaluations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>Nenhuma avaliação encontrada</h3>
                <p>Tente ajustar os filtros para ver mais resultados</p>
            </div>
        `;
        return;
    }
    
    // Use a mesma lógica de renderização, mas com os dados filtrados
    evaluationsData.completed = evaluations;
    renderCompletedEvaluations();
}

// Pular avaliação
function skipEvaluation(evaluationId) {
    evaluationsData.pending = evaluationsData.pending.filter(e => e.id !== evaluationId);
    renderPendingEvaluations();
    saveEvaluationsData();
    showNotification('Avaliação adiada. Você pode avaliar depois no histórico.', 'info');
}

// Abrir detalhes da avaliação
function openEvaluationDetails(evaluationId) {
    const evaluation = evaluationsData.completed.find(e => e.id === evaluationId);
    if (!evaluation) return;
    
    const modal = document.getElementById('evaluationDetailsModal');
    const content = document.getElementById('evaluationDetailsContent');
    
    const stars = '⭐'.repeat(evaluation.rating.overall);
    const aspectsHtml = evaluation.rating.aspects ? 
        Object.entries(evaluation.rating.aspects)
            .filter(([key]) => key !== 'overall')
            .map(([key, value]) => `
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="color: #ddd;">${getAspectLabel(evaluation.type, key)}:</span>
                    <span style="color: #f39c12;">${'⭐'.repeat(value)}</span>
                </div>
            `).join('') : '';
    
    content.innerHTML = `
        <div style="margin-bottom: 20px;">
            <h3 style="color: #fff; margin-bottom: 10px;">${evaluation.title}</h3>
            <p style="color: #ddd; margin-bottom: 15px;">${evaluation.details || ''}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <span style="color: #999;">${formatDate(new Date(evaluation.date))}</span>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <span style="font-size: 1.5rem;">${stars}</span>
                    <span style="background: rgba(243, 156, 18, 0.2); color: #f39c12; padding: 4px 8px; border-radius: 12px; font-size: 0.9rem;">${evaluation.rating.overall}.0</span>
                </div>
            </div>
        </div>
        
        ${aspectsHtml ? `
            <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 10px; margin-bottom: 20px;">
                <h4 style="color: #fff; margin-bottom: 10px;">Aspectos Avaliados:</h4>
                ${aspectsHtml}
            </div>
        ` : ''}
        
        ${evaluation.comment ? `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #fff; margin-bottom: 10px;">Comentário:</h4>
                <p style="color: #ddd; font-style: italic; line-height: 1.5;">"${evaluation.comment}"</p>
            </div>
        ` : ''}
        
        ${evaluation.tags && evaluation.tags.length > 0 ? `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #fff; margin-bottom: 10px;">Tags:</h4>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                    ${evaluation.tags.map(tag => `<span style="background: rgba(52, 152, 219, 0.2); color: #3498db; padding: 4px 10px; border-radius: 12px; font-size: 0.8rem;">${tag}</span>`).join('')}
                </div>
            </div>
        ` : ''}
        
        ${evaluation.suggestions ? `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #fff; margin-bottom: 10px;">Sugestões:</h4>
                <p style="color: #ddd; line-height: 1.5;">${evaluation.suggestions}</p>
            </div>
        ` : ''}
        
        ${evaluation.recommend ? `
            <div style="margin-bottom: 20px;">
                <h4 style="color: #fff; margin-bottom: 10px;">Recomendação:</h4>
                <p style="color: #ddd;">
                    ${evaluation.recommend === 'yes' ? '👍 Sim, recomendaria' : 
                      evaluation.recommend === 'maybe' ? '🤔 Talvez' : '👎 Não recomendaria'}
                </p>
            </div>
        ` : ''}
        
        ${evaluation.response ? `
            <div style="background: rgba(52, 152, 219, 0.1); border-left: 3px solid #3498db; padding: 15px; border-radius: 0 10px 10px 0; margin-top: 20px;">
                <h4 style="color: #3498db; margin-bottom: 10px;">Resposta da Empresa:</h4>
                <p style="color: #ddd; line-height: 1.5;">${evaluation.response}</p>
            </div>
        ` : ''}
        
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1);">
            <span style="color: #999; font-size: 0.9rem;">Tipo: ${getTypeLabel(evaluation.type)}</span>
            ${evaluation.helpful ? `<span style="color: #27ae60; font-size: 0.9rem;">👍 ${evaluation.helpful} pessoas acharam útil</span>` : ''}
        </div>
    `;
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeDetailsModal() {
    const modal = document.getElementById('evaluationDetailsModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Editar avaliação
function editEvaluation(evaluationId) {
    // Para simplicidade, vamos mostrar uma mensagem
    showNotification('Funcionalidade de edição será implementada em breve!', 'info');
}

// Funções auxiliares
function getTypeLabel(type) {
    const labels = {
        delivery: 'Entrega',
        motoboy: 'Motoboy',
        app: 'Aplicativo'
    };
    return labels[type] || type;
}

function getAspectLabel(type, aspectKey) {
    const typeConfig = evaluationTypes[type];
    const aspect = typeConfig?.aspects?.find(a => a.key === aspectKey);
    return aspect?.label || aspectKey;
}

function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffDays > 0) {
        return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
        return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else if (diffMinutes > 0) {
        return `${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''} atrás`;
    } else {
        return 'Agora mesmo';
    }
}

function formatDate(date) {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function updateStats() {
    evaluationsData.stats.total = evaluationsData.completed.length;
    
    if (evaluationsData.completed.length > 0) {
        const sum = evaluationsData.completed.reduce((acc, e) => acc + e.rating.overall, 0);
        evaluationsData.stats.average = sum / evaluationsData.completed.length;
    }
    
    evaluationsData.stats.helpful = evaluationsData.completed.reduce((acc, e) => acc + (e.helpful || 0), 0);
}

function saveEvaluationsData() {
    localStorage.setItem('evaluationsData', JSON.stringify(evaluationsData));
}

function handleInsightAction(action) {
    switch (action) {
        case 'ver-padrões':
            showNotification('Análise de padrões em desenvolvimento!', 'info');
            break;
        case 'ver-melhorias':
            showNotification('Lista de melhorias implementadas em breve!', 'info');
            break;
        case 'avaliar-agora':
            if (evaluationsData.pending.length > 0) {
                openEvaluationModal(evaluationsData.pending[0].id);
            } else {
                openGeneralReviewModal();
            }
            break;
        case 'ver-conquistas':
            showNotification('Sistema de conquistas em desenvolvimento!', 'info');
            break;
        default:
            showNotification('Ação não implementada ainda.', 'info');
    }
}

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
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);