import { setupAuth } from './auth.js';
import { loadUserProfile, loadUserDecks, pushFlashcardSet, updateFlashcardSet, deleteFlashcardSet, saveUserProfile, createDuel, listenToDuels, updateDuelScore } from './database.js';
import { awardXp, checkAndUnlockAchievements, getXpProgress } from './game.js';
import { setupUI, showView, displayUserProfile, displayUserDecks, displayQuiz, displayAnalytics, displayAchievements, setLoading, showLevelUpModal, displayTimer, showTimeUpMessage, displayDuels, setAIReportLoading, displayAIReportText, setDuelLoading, resetDuelForm } from './view.js';
import { generateFlashcards, analyzePerformance } from './api.js';
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- Global State ---
let currentUser = null;
let userProfile = null;
let userDecks = [];
let currentQuizData = null;
let quizTimer = null;
let userDuels = []; // Armazena duelos carregados


// --- DOM Elements ---
const flashcardForm = document.getElementById('flashcard-form');
const deckNameInput = document.getElementById('deck-name');
const courseSelect = document.getElementById('course-select');
const generateError = document.getElementById('generate-error');
const checkAnswersBtn = document.getElementById('check-answers-btn');

// --- Initialization ---
setupUI(handleNavigation, handleRedoDeck, handleDeleteDeck, handleViewDeck, handleCheckAnswers, handleCreateDuel, handlePlayDuel, handleAnalyzePerformance);
setupAuth(onLogin, onLogout);

// --- Auth Handlers ---
function onLogin(user) {
    currentUser = user;
    showView('welcome-view');
    
    loadUserProfile(user.uid, (profile) => {
        userProfile = profile;
        displayUserProfile(userProfile, user.email);
        checkAndUnlockAchievements(user.uid, userProfile, userDecks);
    });
    
    loadUserDecks(user.uid, (decks) => {
        userDecks = decks;
        displayUserDecks(userDecks);
        checkAndUnlockAchievements(user.uid, userProfile, userDecks);
    });

    // Inicializa listener de Duelos
    listenToDuels(user.email, (duels) => {
        userDuels = duels;
        // Se a tela de duelos estiver ativa, atualiza
        if(!document.getElementById('duels-view').classList.contains('hidden')) {
            displayDuels(userDuels, currentUser.email);
        }
    });
}

function onLogout() {
    currentUser = null;
    userProfile = null;
    userDecks = [];
    userDuels = [];
    showView('auth-view');
}

// --- Timer Controls ---
function startQuizTimer() {
    stopQuizTimer(); // Garante que não haja timers duplicados
    let timeLeft = 900; // 15 minutos em segundos

    quizTimer = setInterval(() => {
        timeLeft--;
        displayTimer(timeLeft);
        if (timeLeft <= 0) {
            stopQuizTimer();
            // Apenas exibe a mensagem de tempo esgotado e aguarda a ação do usuário
            showTimeUpMessage(true);
        }
    }, 1000);

    displayTimer(timeLeft);
}

function stopQuizTimer() {
    clearInterval(quizTimer);
    quizTimer = null;
}

// --- UI Event Handlers ---
function handleNavigation(view) {
    if (view !== 'quiz-view') {
        stopQuizTimer();
    }
    if (view === 'analytics-view') {
        displayAnalytics(userDecks);
    } else if (view === 'achievements-view') {
        displayAchievements(userProfile);
    } else if (view === 'duels-view') {
        displayDuels(userDuels, currentUser.email);
    }
    showView(view);
}

function handleRedoDeck(deckId) {
    const deckToRedo = userDecks.find(d => d.id === deckId);
    if (deckToRedo) {
        currentQuizData = JSON.parse(JSON.stringify(deckToRedo)); // Deep copy
        currentQuizData.questions.forEach(q => {
            q.options.sort(() => Math.random() - 0.5);
            q.userAnswer = null;
        });
        currentQuizData.score = null;
        currentQuizData.isRedo = true;
        displayQuiz(currentQuizData, false);
        showView('quiz-view');
        startQuizTimer();
    }
}

function handleDeleteDeck(deckId) {
    if (currentUser) {
        deleteFlashcardSet(currentUser.uid, deckId)
            .then(() => showView('my-decks-view'))
            .catch(error => console.error("Erro ao excluir deck:", error));
    }
}

function handleViewDeck(deckId) {
    const deck = userDecks.find(d => d.id === deckId);
    if (deck) {
        currentQuizData = deck;
        const isCompleted = deck.score !== null;
        displayQuiz(deck, isCompleted);
        showView('quiz-view');
        stopQuizTimer();
    }
}

// MODIFICADO: Handler para análise por IA com CUSTO e JSON (migração para Gemini)
async function handleAnalyzePerformance() {
    const AI_COACH_COST = 5;
    
    // 1. Verifica Saldo
    if (userProfile.credits < AI_COACH_COST) {
        alert(`Créditos insuficientes! O AI Coach custa ${AI_COACH_COST} créditos.`);
        return;
    }

    const completedDecks = userDecks.filter(d => d.score !== null);
    
    if (completedDecks.length < 3) {
        alert("Você precisa completar pelo menos 3 decks para gerar um relatório.");
        return;
    }

    if(!confirm(`Gerar este relatório detalhado custará ${AI_COACH_COST} créditos. Deseja continuar?`)) {
        return;
    }

    setAIReportLoading(true);

    try {
        // 2. Desconta Créditos e Salva
        userProfile.credits -= AI_COACH_COST;
        await saveUserProfile(currentUser.uid, userProfile);
        displayUserProfile(userProfile, currentUser.email); // Atualiza visualmente o saldo

        // 3. Gera Relatório (Retorna JSON do Gemini)
        const reportData = await analyzePerformance(completedDecks);

        // 4. Renderiza o JSON
        displayAIReportText(reportData);

    } catch (error) {
        console.error("Erro na análise da IA:", error);
        
        // Rollback de Créditos se a IA falhar
        userProfile.credits += AI_COACH_COST;
        await saveUserProfile(currentUser.uid, userProfile);
        displayUserProfile(userProfile, currentUser.email);

        // Se a IA não conseguir retornar o JSON, mostra erro
        displayAIReportText({
            resumo_motivacional: `❌ Ocorreu um erro ao conectar com a IA (${error.message}). Seus ${AI_COACH_COST} créditos foram devolvidos.`,
            pontos_fortes: [],
            pontos_fracos: [],
            sugestoes_estudo: []
        });
        
    } finally {
        setAIReportLoading(false);
    }
}

// ATUALIZADO: Handler para criar duelo com CUSTO, LOADING e ROLLBACK
async function handleCreateDuel(opponentEmail, course) {
    if (!currentUser) return;
    
    const DUEL_COST = 20;

    // 1. Verifica Saldo
    if (userProfile.credits < DUEL_COST) {
        alert(`Créditos insuficientes! Iniciar um duelo custa ${DUEL_COST} créditos.`);
        return;
    }

    setDuelLoading(true);
    
    try {
        // 2. Desconta Créditos (Otimista)
        userProfile.credits -= DUEL_COST;
        await saveUserProfile(currentUser.uid, userProfile);
        displayUserProfile(userProfile, currentUser.email);

        // 3. Gera as perguntas para o duelo (Pode demorar ~5-10s)
        const deckName = `Duelo vs ${opponentEmail}`;
        const questions = await generateFlashcards(deckName, course);
        
        // 4. Salva no banco
        await createDuel(
            { uid: currentUser.uid, email: currentUser.email },
            opponentEmail,
            course,
            questions
        );
        
        alert('Desafio enviado com sucesso!');
        resetDuelForm();
        
    } catch (error) {
        console.error("Erro ao criar duelo:", error);
        
        // ROLLBACK: Devolve os créditos em caso de erro
        userProfile.credits += DUEL_COST;
        await saveUserProfile(currentUser.uid, userProfile);
        displayUserProfile(userProfile, currentUser.email);

        let msg = "Erro ao criar duelo. Tente novamente.";
        if (error.message && error.message.includes("PERMISSION_DENIED")) {
            msg = "Erro de Permissão: O banco de dados recusou a gravação. Verifique as Regras de Segurança do Firebase para permitir escrita em '/duels'.";
        }
        alert(msg);
    } finally {
        setDuelLoading(false);
    }
}

// NOVO: Handler para jogar duelo
function handlePlayDuel(duelId) {
    const duel = userDuels.find(d => d.id === duelId);
    if (!duel) return;

    // Prepara dados para o quiz (formato compatível com o displayQuiz)
    currentQuizData = {
        id: duel.id,
        name: `Duelo vs ${duel.challenger.email === currentUser.email ? duel.opponent.email : duel.challenger.email}`,
        course: duel.course,
        questions: JSON.parse(JSON.stringify(duel.questions)), // Deep copy
        score: null,
        isDuel: true, // Flag importante
        duelRole: duel.challenger.email === currentUser.email ? 'challenger' : 'opponent'
    };

    // Embaralha opções para garantir justiça/dificuldade, mas mantém as perguntas iguais
    currentQuizData.questions.forEach(q => {
       q.options.sort(() => Math.random() - 0.5);
       q.userAnswer = null;
    });

    displayQuiz(currentQuizData, false);
    showView('quiz-view');
    startQuizTimer();
}


async function handleCheckAnswers() {
    if (!currentQuizData || !currentQuizData.id || !currentUser) return;

    const timeUpMessageIsVisible = !document.getElementById('time-up-message').classList.contains('hidden');
    stopQuizTimer();

    let correctAnswers = 0, wrongAnswers = 0;
    currentQuizData.questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="question-${index}"]:checked`);
        q.userAnswer = selected ? selected.value : null;
        if (q.userAnswer === q.answer) correctAnswers++;
        else if (q.userAnswer !== null) wrongAnswers++;
    });

    const finalScore = correctAnswers;
    currentQuizData.score = finalScore;

    // Logica de XP (igual ao normal)
    const leveledUp = await awardXp(userProfile, correctAnswers, currentQuizData.questions.length);
    if (leveledUp && !timeUpMessageIsVisible) {
        showLevelUpModal(userProfile.level);
    }

    await checkAndUnlockAchievements(currentUser.uid, userProfile, userDecks);
    await saveUserProfile(currentUser.uid, userProfile);

    // SE FOR DUELO:
    if (currentQuizData.isDuel) {
        await updateDuelScore(currentQuizData.id, currentQuizData.duelRole, finalScore);
        // Não salvamos como deck normal no histórico para não duplicar, mas fica a critério
    } else {
        // FLUXO NORMAL (Deck pessoal)
        const deckToUpdate = { ...currentQuizData };
        if (deckToUpdate.isRedo) deckToUpdate.status = 'refeito';
        delete deckToUpdate.id;
        delete deckToUpdate.isRedo;
        updateFlashcardSet(currentUser.uid, currentQuizData.id, deckToUpdate);
    }

    // Exibe a tela de correção
    displayQuiz(currentQuizData, true);
}


flashcardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const deckName = deckNameInput.value.trim();
    const course = courseSelect.value;
    if (!deckName || !course || !currentUser) return;

    const DECK_CREATION_COST = 10;
    if (userProfile.credits < DECK_CREATION_COST) {
        generateError.textContent = `Créditos insuficientes. Você precisa de ${DECK_CREATION_COST} créditos.`;
        return;
    }

    setLoading(true);
    generateError.textContent = '';

    try {
        const questions = await generateFlashcards(deckName, course);
        
        userProfile.credits -= DECK_CREATION_COST;
        await saveUserProfile(currentUser.uid, userProfile);

        const flashcardSet = {
            name: deckName,
            course: course,
            questions: questions,
            createdAt: serverTimestamp(),
            score: null
        };

        const newDeckId = await pushFlashcardSet(currentUser.uid, flashcardSet);
        currentQuizData = { id: newDeckId, ...flashcardSet };

        displayQuiz(currentQuizData, false);
        showView('quiz-view');
        startQuizTimer();
        deckNameInput.value = '';
        courseSelect.value = '';

    } catch (error) {
        console.error("Erro ao gerar flashcards:", error);
        generateError.textContent = "Não foi possível gerar os flashcards. Verifique sua chave de API e a consola para mais detalhes.";
    } finally {
        setLoading(false);
    }
});