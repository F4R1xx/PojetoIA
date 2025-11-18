import { achievementsList, getXpProgress } from './game.js';

// --- DOM Element Cache ---
const elements = {
    authContainer: document.getElementById('auth-container'),
    mainContainer: document.getElementById('main-container'),
    userEmail: document.getElementById('user-email'),
    mainViews: document.querySelectorAll('.main-view'),
    sidebarMenu: document.getElementById('sidebar-menu'),
    overlay: document.getElementById('overlay'),
    hamburgerBtn: document.getElementById('hamburger-btn'),
    navLinks: document.querySelectorAll('.nav-link'),
    userLevel: document.getElementById('user-level'),
    userXp: document.getElementById('user-xp'),
    xpToNextLevel: document.getElementById('xp-to-next-level'),
    xpBar: document.getElementById('xp-bar'),
    userCredits: document.getElementById('user-credits'),
    historyContainer: document.getElementById('history-container'),
    noHistory: document.getElementById('no-history'),
    quizTopic: document.getElementById('quiz-topic'),
    questionsWrapper: document.getElementById('questions-wrapper'),
    quizResults: document.getElementById('quiz-results'),
    finalScore: document.getElementById('final-score'),
    scoreDetails: document.getElementById('score-details'),
    checkAnswersBtn: document.getElementById('check-answers-btn'),
    analyticsContainer: document.getElementById('analytics-container'),
    noAnalytics: document.getElementById('no-analytics'),
    achievementsContainer: document.getElementById('achievements-container'),
    levelUpModal: document.getElementById('level-up-modal'),
    newLevelSpan: document.getElementById('new-level-span'),
    closeModalBtn: document.getElementById('close-modal-btn'),
    generateBtnText: document.getElementById('generate-btn-text'),
    generateLoader: document.getElementById('generate-loader'),
    deckNameInput: document.getElementById('deck-name'),
    courseSelect: document.getElementById('course-select'),
    timer: document.getElementById('timer'),
    timeUpMessage: document.getElementById('time-up-message'),
    timerContainer: document.getElementById('timer-container'),
    // Elementos de Duelo
    btnNewDuel: document.getElementById('btn-new-duel'),
    newDuelFormContainer: document.getElementById('new-duel-form-container'),
    btnCancelDuel: document.getElementById('btn-cancel-duel'),
    createDuelForm: document.getElementById('create-duel-form'),
    duelsList: document.getElementById('duels-list'),
    noDuels: document.getElementById('no-duels'),
    duelOpponentEmail: document.getElementById('duel-opponent-email'),
    duelCourseSelect: document.getElementById('duel-course-select'),
    btnSubmitDuel: document.getElementById('btn-submit-duel'),
    duelLoader: document.getElementById('duel-loader'),
    // Elementos de IA Report
    btnGenerateReport: document.getElementById('btn-generate-report'),
    aiReportContainer: document.getElementById('ai-report-container'),
    aiReportLoader: document.getElementById('ai-report-loader'),
    aiReportContent: document.getElementById('ai-report-content')
};

// Variáveis para guardar as instâncias dos gráficos (necessário para destruir antes de recriar)
let evolutionChartInstance = null;
let radarChartInstance = null;

// --- Event Handlers ---
let handleNav, handleRedo, handleDelete, handleView, handleCheck, handleCreateDuel, handlePlayDuel, handleAnalyze;

export function setupUI(navHandler, redoHandler, deleteHandler, viewHandler, checkHandler, createDuelHandler, playDuelHandler, analyzeHandler) {
    handleNav = navHandler;
    handleRedo = redoHandler;
    handleDelete = deleteHandler;
    handleView = viewHandler;
    handleCheck = checkHandler;
    handleCreateDuel = createDuelHandler;
    handlePlayDuel = playDuelHandler;
    handleAnalyze = analyzeHandler;

    elements.hamburgerBtn.addEventListener('click', toggleSidebar);
    elements.overlay.addEventListener('click', closeSidebar);
    elements.closeModalBtn.addEventListener('click', () => showLevelUpModal(null, false));

    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            let viewId;
            switch (link.id) {
                case 'nav-create': viewId = 'create-deck-view'; break;
                case 'nav-decks': viewId = 'my-decks-view'; break;
                case 'nav-achievements': viewId = 'achievements-view'; break;
                case 'nav-analytics': viewId = 'analytics-view'; break;
                case 'nav-duels': viewId = 'duels-view'; break;
                default: viewId = `${link.id.split('-')[1]}-view`; break;
            }
            handleNav(viewId);
        });
    });

    elements.checkAnswersBtn.addEventListener('click', () => handleCheck());

    window.viewDeck = (deckId) => handleView(deckId);
    window.redoDeck = (deckId) => handleRedo(deckId);
    window.deleteDeck = (deckId) => handleDelete(deckId);
    
    window.playDuel = (duelId) => handlePlayDuel(duelId);
    
    if(elements.btnNewDuel) {
        elements.btnNewDuel.addEventListener('click', () => {
            elements.newDuelFormContainer.classList.remove('hidden');
            elements.btnNewDuel.classList.add('hidden');
        });
    }
    
    if(elements.btnCancelDuel) {
        elements.btnCancelDuel.addEventListener('click', () => {
            elements.newDuelFormContainer.classList.add('hidden');
            elements.btnNewDuel.classList.remove('hidden');
        });
    }

    if(elements.createDuelForm) {
        elements.createDuelForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = elements.duelOpponentEmail.value;
            const course = elements.duelCourseSelect.value;
            handleCreateDuel(email, course);
            // Não limpamos imediatamente aqui, deixamos o handler controlar sucesso/falha
        });
    }

    if (elements.btnGenerateReport) {
        elements.btnGenerateReport.addEventListener('click', () => handleAnalyze());
    }
}

export function showView(viewId) {
    if (viewId === 'auth-view') {
        elements.authContainer.classList.remove('hidden');
        elements.mainContainer.classList.add('hidden');
    } else {
        elements.authContainer.classList.add('hidden');
        elements.mainContainer.classList.remove('hidden');
        elements.mainViews.forEach(view => view.classList.add('hidden'));
        const viewToShow = document.getElementById(viewId);
        if (viewToShow) {
            viewToShow.classList.remove('hidden');
        }
    }
    updateActiveNavLink(viewId);
    closeSidebar();
}

function updateActiveNavLink(viewId) {
    elements.navLinks.forEach(link => link.classList.remove('active'));
    const activeLink = document.getElementById(`nav-${viewId.split('-')[0]}`);
    if (activeLink) {
        activeLink.classList.add('active');
    }
}

function toggleSidebar() {
    elements.sidebarMenu.classList.toggle('-translate-x-full');
    elements.overlay.classList.toggle('hidden');
}

function closeSidebar() {
    if (window.innerWidth < 768) {
        elements.sidebarMenu.classList.add('-translate-x-full');
        elements.overlay.classList.add('hidden');
    }
}

export function displayUserProfile(profile, email) {
    if (!profile) return;
    elements.userEmail.textContent = email;
    elements.userLevel.textContent = profile.level;
    elements.userXp.textContent = Math.floor(profile.xp);
    elements.userCredits.textContent = profile.credits;
    const { xpNext, progress } = getXpProgress(profile.level, profile.xp);
    elements.xpToNextLevel.textContent = xpNext;
    elements.xpBar.style.width = `${progress}%`;
}

export function displayUserDecks(decks) {
    elements.historyContainer.innerHTML = '';
    if (decks && decks.length > 0) {
        elements.noHistory.style.display = 'none';
        decks.forEach(deck => {
            const deckEl = document.createElement('div');
            deckEl.className = 'bg-gray-800 p-4 rounded-lg shadow-md';
            const scoreText = deck.score !== null ? `${deck.score} / 10` : 'Pendente';
            const scoreColorClass = deck.score !== null ? (deck.score >= 6 ? 'text-green-400' : 'text-red-400') : 'text-gray-300';
            const isRedone = deck.status === 'refeito';

            deckEl.innerHTML = `
                <div class="cursor-pointer" onclick="viewDeck('${deck.id}')">
                    <div class="flex justify-between items-center">
                        <span class="font-semibold text-white truncate pr-2">${deck.name}</span>
                        <div class="flex items-center space-x-2 flex-shrink-0">
                             ${isRedone ? '<span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-yellow-500 text-gray-900">Refeito</span>' : ''}
                            <span class="text-xs font-bold px-2 py-1 rounded-full bg-indigo-600 text-white">${deck.course}</span>
                        </div>
                    </div>
                    <div class="flex justify-between items-center mt-2 text-sm text-gray-400">
                        <span>${new Date(deck.createdAt).toLocaleDateString()}</span>
                        <span class="font-bold ${scoreColorClass}">${scoreText}</span>
                    </div>
                </div>
                <div class="flex justify-end items-center mt-3 pt-3 border-t border-gray-700 space-x-2">
                    <button onclick="redoDeck('${deck.id}')" class="text-sm bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1 px-3 rounded-md transition-colors">Refazer</button>
                    <button onclick="deleteDeck('${deck.id}')" class="text-sm bg-red-600 hover:bg-red-700 text-white font-semibold py-1 px-3 rounded-md transition-colors">Excluir</button>
                </div>`;
            elements.historyContainer.appendChild(deckEl);
        });
    } else {
        elements.noHistory.style.display = 'block';
    }
}

export function displayDuels(duels, currentUserEmail) {
    elements.duelsList.innerHTML = '';
    
    if (!duels || duels.length === 0) {
        elements.noDuels.classList.remove('hidden');
        return;
    }
    elements.noDuels.classList.add('hidden');

    duels.forEach(duel => {
        const isChallenger = duel.challenger.email === currentUserEmail;
        const myData = isChallenger ? duel.challenger : duel.opponent;
        const enemyData = isChallenger ? duel.opponent : duel.challenger;
        
        const myScore = myData.score !== undefined && myData.score !== null ? myData.score : '-';
        const enemyScore = enemyData.score !== undefined && enemyData.score !== null ? enemyData.score : '-';
        
        const isCompleted = myData.status === 'completed';
        const isEnemyCompleted = enemyData.status === 'completed';
        
        let statusMsg = '';
        let actionBtn = '';
        let cardClass = 'duel-card p-5 rounded-lg relative overflow-hidden';

        if (isCompleted && isEnemyCompleted) {
            if (myScore > enemyScore) {
                statusMsg = '<span class="text-green-400 font-bold">Vitória!</span>';
                cardClass += ' winner-glow';
            } else if (myScore < enemyScore) {
                statusMsg = '<span class="text-red-400 font-bold">Derrota</span>';
            } else {
                statusMsg = '<span class="text-yellow-400 font-bold">Empate</span>';
            }
            actionBtn = `<span class="text-gray-500 text-sm italic">Duelo Finalizado</span>`;
        } else if (!isCompleted) {
            statusMsg = '<span class="text-indigo-400">Sua vez!</span>';
            actionBtn = `<button onclick="playDuel('${duel.id}')" class="w-full mt-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 rounded transition-colors">JOGAR AGORA</button>`;
        } else {
            statusMsg = '<span class="text-gray-400">Aguardando oponente...</span>';
            actionBtn = `<button disabled class="w-full mt-3 bg-gray-700 text-gray-500 cursor-not-allowed font-bold py-2 rounded">Aguardando...</button>`;
        }

        const html = `
            <div class="${cardClass}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-xl font-bold text-white">${duel.course}</h4>
                        <p class="text-xs text-gray-400 mt-1">VS: ${enemyData.email}</p>
                    </div>
                    <span class="vs-badge text-xs">VS</span>
                </div>
                
                <div class="flex justify-between items-center bg-gray-900/50 p-3 rounded-md mb-4">
                    <div class="text-center">
                        <p class="text-xs text-gray-400 uppercase">Você</p>
                        <p class="player-score text-2xl font-bold ${myScore !== '-' && myScore >= 6 ? 'text-green-400' : 'text-white'}">${myScore}</p>
                    </div>
                    <div class="text-gray-600 font-bold">X</div>
                    <div class="text-center">
                        <p class="text-xs text-gray-400 uppercase">Oponente</p>
                        <p class="player-score text-2xl font-bold ${enemyScore !== '-' && enemyScore >= 6 ? 'text-green-400' : 'text-white'}">${enemyScore}</p>
                    </div>
                </div>
                
                <div class="text-center">
                    <p class="text-sm mb-2">${statusMsg}</p>
                    ${actionBtn}
                </div>
            </div>
        `;
        elements.duelsList.innerHTML += html;
    });
}

// NOVA: Controle de Loading para Duelo
export function setDuelLoading(isLoading) {
    if (elements.btnSubmitDuel && elements.duelLoader) {
        if (isLoading) {
            elements.btnSubmitDuel.disabled = true;
            elements.btnSubmitDuel.classList.add('opacity-70', 'cursor-not-allowed');
            elements.duelLoader.classList.remove('hidden');
        } else {
            elements.btnSubmitDuel.disabled = false;
            elements.btnSubmitDuel.classList.remove('opacity-70', 'cursor-not-allowed');
            elements.duelLoader.classList.add('hidden');
        }
    }
    if (elements.duelOpponentEmail) elements.duelOpponentEmail.disabled = isLoading;
    if (elements.duelCourseSelect) elements.duelCourseSelect.disabled = isLoading;
}

export function resetDuelForm() {
    elements.duelOpponentEmail.value = '';
    elements.newDuelFormContainer.classList.add('hidden');
    elements.btnNewDuel.classList.remove('hidden');
}

export function displayQuiz(deckData, isCorrecting) {
    elements.quizTopic.textContent = `${deckData.name} (${deckData.course})`;
    elements.questionsWrapper.innerHTML = '';
    elements.quizResults.classList.add('hidden');
    showTimeUpMessage(false);

    deckData.questions.forEach((q, index) => {
        const questionEl = document.createElement('div');
        questionEl.className = 'bg-gray-800 p-4 rounded-lg';
        questionEl.innerHTML = `<p class="font-semibold mb-3 text-left">${index + 1}. ${q.question}</p>`;
        const optionsList = document.createElement('div');
        optionsList.className = 'space-y-2 text-left';

        q.options.forEach((option) => {
            const optionId = `q${index}-opt-${option.replace(/\s+/g, '-')}`;
            const isChecked = q.userAnswer === option;
            let labelClasses = "flex items-center p-3 rounded-md cursor-pointer transition-colors duration-200 ";
            if (isCorrecting) {
                const isCorrect = option === q.answer;
                if (isCorrect) labelClasses += "bg-green-500/30 text-green-300 border border-green-500";
                else if (isChecked && !isCorrect) labelClasses += "bg-red-500/30 text-red-300 border border-red-500";
                else labelClasses += "bg-gray-700 opacity-70";
            } else {
                labelClasses += "bg-gray-700 hover:bg-gray-600";
            }
            optionsList.innerHTML += `
                <div>
                    <input type="radio" id="${optionId}" name="question-${index}" value="${option}" class="hidden" ${isChecked ? 'checked' : ''} ${isCorrecting ? 'disabled' : ''}>
                    <label for="${optionId}" class="${labelClasses}">
                        <span class="w-4 h-4 mr-3 inline-block rounded-full border-2 border-gray-400 flex-shrink-0"></span>
                        ${option}
                    </label>
                </div>`;
        });
        questionEl.appendChild(optionsList);
        elements.questionsWrapper.appendChild(questionEl);
    });

    if (isCorrecting) {
        elements.checkAnswersBtn.style.display = 'none';
        displayQuizResults(deckData);
    } else {
        elements.checkAnswersBtn.style.display = 'block';
    }
}

function displayQuizResults(deckData) {
    let correct = 0, wrong = 0;
    deckData.questions.forEach(q => {
        if (q.userAnswer === q.answer) correct++;
        else if (q.userAnswer !== null) wrong++;
    });
    elements.finalScore.textContent = `${deckData.score} / 10`;
    elements.scoreDetails.textContent = `${correct} acertos, ${wrong} erros`;
    elements.finalScore.className = `text-5xl font-bold my-4 ${deckData.score >= 6 ? 'text-green-400' : 'text-red-400'}`;
    elements.quizResults.classList.remove('hidden');
}

// Função Melhorada de Analytics com Gráficos Chart.js
export function displayAnalytics(decks) {
    elements.analyticsContainer.innerHTML = '';
    
    // Filtra decks completos
    const completedDecks = decks.filter(deck => deck.score !== null);

    if (completedDecks.length === 0) {
        elements.noAnalytics.classList.remove('hidden');
        // Esconde os containers de gráficos se não houver dados
        document.getElementById('evolutionChart').parentElement.parentElement.classList.add('hidden');
        document.getElementById('radarChart').parentElement.parentElement.classList.add('hidden');
        return;
    }
    
    elements.noAnalytics.classList.add('hidden');
    // Mostra os containers
    document.getElementById('evolutionChart').parentElement.parentElement.classList.remove('hidden');
    document.getElementById('radarChart').parentElement.parentElement.classList.remove('hidden');

    // KPIS Numéricos
    const totalScore = completedDecks.reduce((sum, deck) => sum + deck.score, 0);
    const avgScore = (totalScore / completedDecks.length).toFixed(1);
    
    elements.analyticsContainer.innerHTML += `
        <div class="bg-gray-800 p-6 rounded-lg border-l-4 border-indigo-500 shadow-lg">
            <h3 class="font-bold text-lg text-gray-300">Desempenho Geral</h3>
            <p class="text-4xl font-bold text-white mt-2">${avgScore} <span class="text-lg text-gray-500">/ 10</span></p>
        </div>
        <div class="bg-gray-800 p-6 rounded-lg border-l-4 border-green-500 shadow-lg">
            <h3 class="font-bold text-lg text-gray-300">Decks Completados</h3>
            <p class="text-4xl font-bold text-white mt-2">${completedDecks.length}</p>
        </div>
        <div class="bg-gray-800 p-6 rounded-lg border-l-4 border-purple-500 shadow-lg">
            <h3 class="font-bold text-lg text-gray-300">XP Total</h3>
            <p class="text-4xl font-bold text-white mt-2">${elements.userXp.textContent}</p>
        </div>
    `;

    // --- PREPARAÇÃO DE DADOS PARA GRÁFICOS ---
    
    // Dados para Evolução (Últimos 10 decks)
    const recentDecks = completedDecks.slice(0, 10).reverse(); // Reverte para ficar cronológico (Antigo -> Novo)
    const labelsEvolution = recentDecks.map(d => {
        const date = new Date(d.createdAt);
        return `${date.getDate()}/${date.getMonth()+1}`;
    });
    const dataEvolution = recentDecks.map(d => d.score);

    // Dados para Radar (Média por Curso)
    const scoresByCourse = completedDecks.reduce((acc, deck) => {
        if (!acc[deck.course]) {
            acc[deck.course] = { totalScore: 0, count: 0 };
        }
        acc[deck.course].totalScore += deck.score;
        acc[deck.course].count++;
        return acc;
    }, {});

    const labelsRadar = Object.keys(scoresByCourse);
    const dataRadar = labelsRadar.map(course => (scoresByCourse[course].totalScore / scoresByCourse[course].count).toFixed(1));

    // --- RENDERIZAÇÃO DOS GRÁFICOS ---

    // Destroi gráficos anteriores se existirem
    if (evolutionChartInstance) evolutionChartInstance.destroy();
    if (radarChartInstance) radarChartInstance.destroy();

    // Gráfico de Linha (Evolução)
    const ctxEvolution = document.getElementById('evolutionChart').getContext('2d');
    evolutionChartInstance = new Chart(ctxEvolution, {
        type: 'line',
        data: {
            labels: labelsEvolution,
            datasets: [{
                label: 'Nota',
                data: dataEvolution,
                borderColor: '#6366f1', // Indigo 500
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderWidth: 2,
                tension: 0.3,
                fill: true,
                pointBackgroundColor: '#fff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 10,
                    grid: { color: '#374151' },
                    ticks: { color: '#9ca3af' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#9ca3af' }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Gráfico de Radar (Por Matéria)
    const ctxRadar = document.getElementById('radarChart').getContext('2d');
    radarChartInstance = new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: labelsRadar,
            datasets: [{
                label: 'Média por Matéria',
                data: dataRadar,
                backgroundColor: 'rgba(34, 197, 94, 0.2)', // Green
                borderColor: '#22c55e',
                pointBackgroundColor: '#fff',
                pointBorderColor: '#fff',
                pointHoverBackgroundColor: '#fff',
                pointHoverBorderColor: 'rgb(34, 197, 94)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    angleLines: { color: '#374151' },
                    grid: { color: '#374151' },
                    pointLabels: { color: '#e5e7eb', font: { size: 12 } },
                    ticks: { display: false, backdropColor: 'transparent' },
                    suggestedMin: 0,
                    suggestedMax: 10
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

export function displayAchievements(profile) {
    elements.achievementsContainer.innerHTML = '';
    for (const key in achievementsList) {
        const achievement = achievementsList[key];
        const isUnlocked = profile.achievements && profile.achievements[key];
        const card = document.createElement('div');
        card.className = `achievement-card bg-gray-800 p-4 rounded-lg flex flex-col items-center text-center border-2 border-gray-700 ${isUnlocked ? 'unlocked' : 'opacity-60'}`;
        card.innerHTML = `
            <div class="icon-container w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 ${isUnlocked ? '' : 'bg-gray-700'}">
                ${achievement.icon}
            </div>
            <h3 class="font-bold text-md ${isUnlocked ? 'text-white' : 'text-gray-400'}">${achievement.name}</h3>
            <p class="text-xs text-gray-500 mt-1">${achievement.description}</p>`;
        elements.achievementsContainer.appendChild(card);
    }
}

export function showLevelUpModal(newLevel, show = true) {
    if (show) {
        elements.newLevelSpan.textContent = newLevel;
        elements.levelUpModal.classList.remove('hidden');
        elements.levelUpModal.classList.add('show');
    } else {
        elements.levelUpModal.classList.add('hidden');
        elements.levelUpModal.classList.remove('show');
    }
}

export function setLoading(isLoading) {
    elements.generateBtnText.style.display = isLoading ? 'none' : 'block';
    elements.generateLoader.style.display = isLoading ? 'block' : 'none';
    elements.deckNameInput.disabled = isLoading;
    elements.courseSelect.disabled = isLoading;
}

// Controle de loading do relatório de IA
export function setAIReportLoading(isLoading) {
    if (isLoading) {
        elements.aiReportContainer.classList.remove('hidden');
        elements.aiReportLoader.classList.remove('hidden');
        elements.aiReportContent.innerHTML = '';
    } else {
        elements.aiReportLoader.classList.add('hidden');
    }
}

// NOVO: Renderiza o relatório da IA com base no JSON complexo
export function displayAIReportText(reportData) {
    if (!reportData || !reportData.pontos_fortes) {
        elements.aiReportContent.innerHTML = "<span class='text-red-400'>Não foi possível gerar um relatório detalhado. Tente mais tarde ou complete mais decks.</span>";
        return;
    }

    let html = '';

    // 1. Resumo Motivacional
    html += `<div class="p-4 rounded-lg bg-indigo-900/40 mb-6 border-l-4 border-indigo-500">
                <p class="text-md font-semibold text-white">Coach Message 💬</p>
                <p class="mt-2 text-gray-300">${reportData.resumo_motivacional}</p>
            </div>`;

    html += `<div class="grid md:grid-cols-2 gap-6 mb-6">`;

    // 2. Pontos Fortes
    html += `<div class="bg-gray-700/50 p-4 rounded-lg border-l-4 border-green-500">
                <p class="text-lg font-bold text-green-400 mb-2">✅ Pontos Fortes</p>
                <ul class="space-y-1 text-gray-200 list-disc list-inside">`;
    reportData.pontos_fortes.forEach(p => {
        // Exibe o TÓPICO detalhado, e não o nome do deck
        html += `<li><strong>${p.topico}</strong> (Curso: ${p.curso})</li>`;
    });
    html += `</ul></div>`;

    // 3. Pontos Fracos
    html += `<div class="bg-gray-700/50 p-4 rounded-lg border-l-4 border-red-500">
                <p class="text-lg font-bold text-red-400 mb-2">❌ Pontos Fracos</p>
                <ul class="space-y-1 text-gray-200 list-disc list-inside">`;
    reportData.pontos_fracos.forEach(p => {
         // Exibe o TÓPICO detalhado, e não o nome do deck
        html += `<li><strong>${p.topico}</strong> (Curso: ${p.curso})</li>`;
    });
    html += `</ul></div>`;
    html += `</div>`; // Fim do grid

    // 4. Sugestões de Estudo Detalhadas
    html += `<div class="bg-gray-800 p-5 rounded-lg border border-gray-700">
                <p class="text-lg font-bold text-yellow-400 mb-3">🛠️ Plano de Ação e Materiais de Apoio</p>
                <div class="space-y-4">`;
    reportData.sugestoes_estudo.forEach(s => {
        html += `<div class="border-b border-gray-700 pb-3">
                    <p class="font-semibold text-gray-200">${s.topico}:</p>
                    <p class="text-sm text-gray-400 mt-1">${s.sugestao}</p>`;
        
        if (s.link_exemplo && s.link_exemplo !== "N/A") {
            // Garante que o link seja real, assumindo que a IA o encontrou via Google Search
            html += `<a href="${s.link_exemplo}" target="_blank" class="text-indigo-400 hover:text-indigo-300 text-sm mt-1 inline-block truncate max-w-full">🔗 Material de Apoio (Clique aqui)</a>`;
        }
        html += `</div>`;
    });
    html += `</div></div>`;

    elements.aiReportContent.innerHTML = html;
}

export function displayTimer(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    elements.timer.textContent = `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function showTimeUpMessage(show) {
    if (show) {
        elements.timeUpMessage.classList.remove('hidden');
        elements.timerContainer.classList.add('hidden');
        elements.questionsWrapper.classList.add('opacity-20', 'pointer-events-none');
        elements.checkAnswersBtn.classList.remove('hidden');
        elements.checkAnswersBtn.style.display = 'block';
    } else {
        elements.timeUpMessage.classList.add('hidden');
        elements.timerContainer.classList.remove('hidden');
        elements.questionsWrapper.classList.remove('opacity-20', 'pointer-events-none');
    }
}