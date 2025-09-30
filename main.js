import { setupAuth } from './auth.js';
import { loadUserProfile, loadUserDecks, pushFlashcardSet, updateFlashcardSet, deleteFlashcardSet, saveUserProfile } from './database.js';
import { awardXp, checkAndUnlockAchievements, getXpProgress } from './game.js';
import { setupUI, showView, displayUserProfile, displayUserDecks, displayQuiz, displayAnalytics, displayAchievements, setLoading, showLevelUpModal } from './view.js';
import { generateFlashcards } from './api.js';
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";

// --- Global State ---
let currentUser = null;
let userProfile = null;
let userDecks = [];
let currentQuizData = null;

// --- DOM Elements ---
const flashcardForm = document.getElementById('flashcard-form');
const deckNameInput = document.getElementById('deck-name');
const courseSelect = document.getElementById('course-select');
const generateError = document.getElementById('generate-error');
const checkAnswersBtn = document.getElementById('check-answers-btn');

// --- Initialization ---
setupUI(handleNavigation, handleRedoDeck, handleDeleteDeck, handleViewDeck, handleCheckAnswers);
setupAuth(onLogin, onLogout);

// --- Auth Handlers ---
function onLogin(user) {
    currentUser = user;
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
}

function onLogout() {
    currentUser = null;
    userProfile = null;
    userDecks = [];
}

// --- UI Event Handlers ---
function handleNavigation(view) {
    if (view === 'analytics-view') {
        displayAnalytics(userDecks);
    } else if (view === 'achievements-view') {
        displayAchievements(userProfile);
    }
    showView(view);
}

function handleRedoDeck(deckId) {
    const deckToRedo = userDecks.find(d => d.id === deckId);
    if (deckToRedo) {
        currentQuizData = JSON.parse(JSON.stringify(deckToRedo)); // Deep copy
        currentQuizData.questions.forEach(q => {
            currentQuizData.questions.forEach(q => q.options.sort(() => Math.random() - 0.5));
            q.userAnswer = null;
        });
        currentQuizData.score = null;
        currentQuizData.isRedo = true; // Flag to indicate that it's a 'redo'
        displayQuiz(currentQuizData, false);
        showView('quiz-view');
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
    }
}

async function handleCheckAnswers() {
    if (!currentQuizData || !currentQuizData.id || !currentUser) return;
    
    let correctAnswers = 0, wrongAnswers = 0;
    currentQuizData.questions.forEach((q, index) => {
        const selected = document.querySelector(`input[name="question-${index}"]:checked`);
        q.userAnswer = selected ? selected.value : null;
        if (q.userAnswer === q.answer) correctAnswers++;
        else if (q.userAnswer !== null) wrongAnswers++;
    });

    const finalScore = Math.max(0, correctAnswers - wrongAnswers);
    currentQuizData.score = finalScore;
    
    const leveledUp = await awardXp(userProfile, correctAnswers, currentQuizData.questions.length);
    if(leveledUp) showLevelUpModal(userProfile.level);

    await checkAndUnlockAchievements(currentUser.uid, userProfile, userDecks);
    await saveUserProfile(currentUser.uid, userProfile);
    
    const deckToUpdate = { ...currentQuizData };
    if (deckToUpdate.isRedo) deckToUpdate.status = 'refeito';
    delete deckToUpdate.id;
    delete deckToUpdate.isRedo;

    updateFlashcardSet(currentUser.uid, currentQuizData.id, deckToUpdate);
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
        deckNameInput.value = '';
        courseSelect.value = '';

    } catch (error) {
        console.error("Erro ao gerar flashcards:", error);
        generateError.textContent = "Não foi possível gerar os flashcards. Verifique sua chave de API e a consola para mais detalhes.";
    } finally {
        setLoading(false);
    }
});

