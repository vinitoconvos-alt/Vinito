/**
 * Vinito Con Vos - Sommelier Digital Engine
 * Lógica de Quiz, Motor de Scoring y Renderizado.
 */

const state = {
    step: 0,
    answers: {
        comida: null,
        tipo: null,
        intensidad: null,
        presupuesto: null,
        email: null
    },
    catalogo: []
};

const QUIZ_STEPS = [
    {
        key: 'comida',
        question: '¿Qué comida vas a acompañar?',
        options: [
            { label: '🥩 Asado / Carne Roja', value: 'asado' },
            { label: '🍝 Pastas', value: 'pasta' },
            { label: '🍕 Pizza / Empanadas', value: 'pizza' },
            { label: '🐟 Pescado / Ensalada', value: 'pescado' },
            { label: '🧀 Picada / Quesos', value: 'picada' },
            { label: '🍷 Solo el vino', value: 'solo_vino' }
        ]
    },
    {
        key: 'tipo',
        question: '¿Qué tipo de vino preferís?',
        options: [
            { label: 'Tinto', value: 'tinto' },
            { label: 'Blanco', value: 'blanco' },
            { label: 'Espumante / Rosado', value: 'espumante' }
        ]
    },
    {
        key: 'intensidad',
        question: '¿Qué intensidad buscás?',
        options: [
            { label: 'Ligero y fresco', value: 1 },
            { label: 'Equilibrado', value: 2 },
            { label: 'Con mucho cuerpo', value: 3 }
        ]
    },
    {
        key: 'presupuesto',
        question: '¿Rango de presupuesto?',
        options: [
            { label: 'Económico', value: 'economico' },
            { label: 'Medio', value: 'medio' },
            { label: 'Premium / Regalo', value: 'premium' }
        ]
    }
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetch('catalogo.json')
        .then(res => res.json())
        .then(data => {
            state.catalogo = data;
        });

    document.getElementById('start-quiz').addEventListener('click', startQuiz);
});

function startQuiz() {
    document.getElementById('step-intro').classList.add('hidden');
    document.getElementById('quiz-flow').classList.remove('hidden');
    renderStep();
}

function renderStep() {
    const quizFlow = document.getElementById('quiz-flow');
    const currentStepData = QUIZ_STEPS[state.step];

    // Update Progress
    const progress = ((state.step) / QUIZ_STEPS.length) * 100;
    document.getElementById('progress-fill').style.width = `${progress}%`;

    quizFlow.innerHTML = `
        <div class="quiz-step-content">
            <h2 class="step-question">${currentStepData.question}</h2>
            <div class="options-grid">
                ${currentStepData.options.map(opt => `
                    <button class="vinito-btn option" onclick="handleSelect('${currentStepData.key}', '${opt.value}')">
                        ${opt.label}
                    </button>
                `).join('')}
            </div>
        </div>
    `;
}

window.handleSelect = (key, value) => {
    state.answers[key] = value;
    state.step++;

    if (state.step < QUIZ_STEPS.length) {
        renderStep();
    } else {
        showEmailStep();
    }
};

function showEmailStep() {
    document.getElementById('progress-fill').style.width = `95%`;
    const quizFlow = document.getElementById('quiz-flow');
    quizFlow.innerHTML = `
        <div class="quiz-step-content">
            <h2 class="step-question">¡Casi listo!</h2>
            <p style="margin-bottom: 20px; color: #666;">Ingresá tu email para recibir tu perfil de catador y las ofertas de estas bodegas.</p>
            <input type="email" id="user-email" placeholder="tu@email.com" class="vinito-input" style="width: 100%; padding: 16px; border-radius: 12px; border: 1px solid #ddd; margin-bottom: 20px;">
            <button class="vinito-btn primary" onclick="finalizeQuiz()">Ver Recomendación</button>
        </div>
    `;
}

window.finalizeQuiz = () => {
    state.answers.email = document.getElementById('user-email').value;
    calculateRecommendations();
};

function calculateRecommendations() {
    const scores = state.catalogo.map(vino => {
        let score = 0;

        // 1. Maridaje (Crucial)
        if (vino.tags_maridaje.includes(state.answers.comida)) score += 50;

        // 2. Tipo (Filtro fuerte)
        const varietalLower = vino.varietal.toLowerCase();
        if (state.answers.tipo === 'tinto' && (varietalLower.includes('malbec') || varietalLower.includes('bonarda') || varietalLower.includes('cabernet'))) score += 30;
        if (state.answers.tipo === 'blanco' && (varietalLower.includes('blanco') || varietalLower.includes('chardonnay') || varietalLower.includes('torrontes'))) score += 30;

        // 3. Intensidad
        if (parseInt(vino.intensidad) === parseInt(state.answers.intensidad)) score += 20;

        // 4. Presupuesto
        if (vino.precio_rango === state.answers.presupuesto) score += 20;

        // 5. Priorizar Stock (Estrategia de Negocio)
        score += 10;

        return { ...vino, score };
    });

    // Ordenar por score y tomar los top 3
    const top3 = scores.sort((a, b) => b.score - a.score).slice(0, 3);
    renderResults(top3);
}

function renderResults(vinos) {
    document.getElementById('progress-fill').style.width = `100%`;
    document.getElementById('quiz-flow').classList.add('hidden');
    const resultsContainer = document.getElementById('step-results');
    resultsContainer.classList.remove('hidden');

    resultsContainer.innerHTML = `
        <h2 class="results-title">Tus Matches Perfectos</h2>
        <div class="results-grid">
            ${vinos.map(vino => renderVinoCard(vino)).join('')}
        </div>
        <button class="vinito-btn option" onclick="location.reload()" style="margin-top: 20px; text-align: center;">Volver a empezar</button>
    `;
}

function renderVinoCard(vino) {
    const isCupo = vino.disponibilidad === 'cupo';
    const percent = isCupo ? Math.round((vino.cupo_actual / vino.cupo_total) * 100) : 100;
    const missing = isCupo ? vino.cupo_total - vino.cupo_actual : 0;

    return `
        <div class="result-card">
            <div class="result-header">
                <span class="tag-badge ${vino.disponibilidad}">
                    ${isCupo ? 'Reserva Exclusiva' : 'Entrega Inmediata'}
                </span>
                <h3>${vino.nombre}</h3>
                <p class="bodega-text">${vino.bodega} - ${vino.region}</p>
            </div>
            <div class="result-body" style="padding: 16px;">
                <p class="cata-text">"${vino.notas_cata}"</p>
                
                <a href="${vino.link}" class="vinito-btn primary" style="display: block; text-decoration: none; text-align: center; margin-top: 10px;">
                    Comprar ahora
                </a>
            </div>
        </div>
    `;
}
