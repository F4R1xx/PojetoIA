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
};

// --- Event Handlers ---
let handleNav, handleRedo, handleDelete, handleView, handleCheck;

// f4r1xx/pojetoia/PojetoIA-bab74157b6c64eec171b8ad1b88e362d30752290/view.js

export function setupUI(navHandler, redoHandler, deleteHandler, viewHandler, checkHandler) {
    handleNav = navHandler;
    handleRedo = redoHandler;
    handleDelete = deleteHandler;
    handleView = viewHandler;
    handleCheck = checkHandler;

    elements.hamburgerBtn.addEventListener('click', toggleSidebar);
    elements.overlay.addEventListener('click', closeSidebar);
    elements.closeModalBtn.addEventListener('click', () => showLevelUpModal(null, false));

    // CORREÇÃO APLICADA AQUI
    elements.navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            let viewId;
            // Mapeia corretamente os IDs dos links para as views
            switch (link.id) {
                case 'nav-create':
                    viewId = 'create-deck-view';
                    break;
                case 'nav-decks':
                    viewId = 'my-decks-view';
                    break;
                case 'nav-achievements':
                    viewId = 'achievements-view';
                    break;
                case 'nav-analytics':
                    viewId = 'analytics-view';
                    break;
                default:
                    // Mantém um fallback, embora o switch cubra todos os casos
                    viewId = `${link.id.split('-')[1]}-view`;
                    break;
            }
            handleNav(viewId);
        });
    });

    elements.checkAnswersBtn.addEventListener('click', () => handleCheck());

    window.viewDeck = (deckId) => handleView(deckId);
    window.redoDeck = (deckId) => handleRedo(deckId);
    window.deleteDeck = (deckId) => handleDelete(deckId);
}

// --- View Management ---
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

// --- Display Functions ---
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

export function displayQuiz(deckData, isCorrecting) {
    elements.quizTopic.textContent = `${deckData.name} (${deckData.course})`;
    elements.questionsWrapper.innerHTML = '';
    elements.quizResults.classList.add('hidden');
    showTimeUpMessage(false); // Garante que a mensagem de tempo esgotado está escondida

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

export function displayAnalytics(decks) {
    elements.analyticsContainer.innerHTML = '';
    const completedDecks = decks.filter(deck => deck.score !== null);

    if (completedDecks.length === 0) {
        elements.noAnalytics.classList.remove('hidden');
        return;
    }
    elements.noAnalytics.classList.add('hidden');

    const totalScore = completedDecks.reduce((sum, deck) => sum + deck.score, 0);
    const avgScore = (totalScore / completedDecks.length).toFixed(1);
    elements.analyticsContainer.innerHTML += `
        <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="font-bold text-lg text-white">Desempenho Geral</h3>
            <p class="text-3xl font-bold text-indigo-400 mt-2">${avgScore} <span class="text-lg text-gray-400">/ 10</span></p>
            <p class="text-sm text-gray-400 mt-1">Média de todos os decks</p>
        </div>
        <div class="bg-gray-800 p-6 rounded-lg">
            <h3 class="font-bold text-lg text-white">Decks Completos</h3>
            <p class="text-3xl font-bold text-indigo-400 mt-2">${completedDecks.length}</p>
            <p class="text-sm text-gray-400 mt-1">Total de decks estudados</p>
        </div>
    `;

    const scoresByCourse = completedDecks.reduce((acc, deck) => {
        if (!acc[deck.course]) {
            acc[deck.course] = { totalScore: 0, count: 0 };
        }
        acc[deck.course].totalScore += deck.score;
        acc[deck.course].count++;
        return acc;
    }, {});

    const courseAnalyticsEl = document.createElement('div');
    courseAnalyticsEl.className = "bg-gray-800 p-6 rounded-lg md:col-span-2 lg:col-span-1";
    courseAnalyticsEl.innerHTML = `<h3 class="font-bold text-lg text-white mb-3">Média por Curso</h3>`;
    const courseList = document.createElement('div');
    courseList.className = 'space-y-2';

    Object.keys(scoresByCourse).forEach(course => {
        const avg = (scoresByCourse[course].totalScore / scoresByCourse[course].count).toFixed(1);
        courseList.innerHTML += `<div class="flex justify-between items-center text-sm">
                <span class="text-gray-300">${course}</span>
                <span class="font-bold ${avg >= 6 ? 'text-green-400' : 'text-red-400'}">${avg} / 10</span>
            </div>`;
    });
    courseAnalyticsEl.appendChild(courseList);
    elements.analyticsContainer.appendChild(courseAnalyticsEl);
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

