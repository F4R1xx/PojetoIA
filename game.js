import { saveUserProfile } from './database.js';

// --- Configurações de Gamification ---
const XP_PER_CORRECT_ANSWER = 15;
const XP_PERFECT_SCORE_BONUS = 50;
const getXpForNextLevel = (level) => 100 * Math.pow(level, 1.5);

export const achievementsList = {
    firstDeck: { name: "Iniciante", description: "Crie seu primeiro deck de estudos.", icon: "🚀" },
    firstComplete: { name: "Primeiros Passos", description: "Complete um deck pela primeira vez.", icon: "✅" },
    perfectScore: { name: "Perfeccionista", description: "Acerte todas as questões de um deck.", icon: "🎯" },
    level5: { name: "Estudante Dedicado", description: "Alcance o Level 5.", icon: "📚" },
    level10: { name: "Mestre do Conhecimento", description: "Alcance o Level 10.", icon: "🎓" },
    level20: { name: "Veterano", description: "Alcance o Level 20.", icon: "🏆" },
    deckCollector: { name: "Colecionador", description: "Crie 10 decks.", icon: "📦" },
    marathoner: { name: "Maratonista", description: "Complete 25 decks.", icon: "🏃‍♂️" },
    polymath: { name: "Polímata", description: "Crie um deck para cada curso.", icon: "🧠" },
    perfectScorePro: { name: "Racha-Cuca", description: "Consiga uma pontuação perfeita em 5 decks.", icon: "🤯" },
    serproMaster: { name: "Especialista SERPRO", description: "Complete 5 decks do SERPRO.", icon: "💻" },
    prfMaster: { name: "Especialista PRF", description: "Complete 5 decks da PRF.", icon: "🚓" },
    enemMaster: { name: "Especialista ENEM", description: "Complete 5 decks do ENEM.", icon: "✍️" },
    oabMaster: { name: "Especialista OAB", description: "Complete 5 decks da OAB.", icon: "⚖️" },
    medMaster: { name: "Especialista Medicina", description: "Complete 5 decks de Medicina.", icon: "🩺" }
};

export async function awardXp(userProfile, correctAnswers, questionCount) {
    let earnedXp = correctAnswers * XP_PER_CORRECT_ANSWER;
    if (correctAnswers === questionCount && questionCount > 0) {
        earnedXp += XP_PERFECT_SCORE_BONUS;
    }
    userProfile.xp += earnedXp;
    return checkForLevelUp(userProfile);
}

function checkForLevelUp(userProfile) {
    let xpForNext = getXpForNextLevel(userProfile.level);
    let leveledUp = false;
    while (userProfile.xp >= xpForNext) {
        userProfile.level++;
        userProfile.xp -= xpForNext;
        xpForNext = getXpForNextLevel(userProfile.level);
        leveledUp = true;
    }
    return leveledUp;
}

export async function checkAndUnlockAchievements(userId, userProfile, userDecks) {
    const completedDecks = userDecks.filter(d => d.score !== null);
    const coursesCreated = [...new Set(userDecks.map(d => d.course))];
    let newAchievements = false;

    if (!userProfile.achievements) {
        userProfile.achievements = {};
    }

    // Função auxiliar para verificar e desbloquear conquistas
    const unlock = (key) => {
        if (!userProfile.achievements[key]) {
            userProfile.achievements[key] = true;
            newAchievements = true;
        }
    };

    // Conquistas existentes
    if (userDecks.length > 0) unlock('firstDeck');
    if (completedDecks.length > 0) unlock('firstComplete');
    if (completedDecks.some(d => d.score === 10)) unlock('perfectScore');
    if (userProfile.level >= 5) unlock('level5');
    if (userProfile.level >= 10) unlock('level10');
    if (completedDecks.filter(d => d.course === 'SERPRO').length >= 5) unlock('serproMaster');

    // Novas conquistas
    if (userProfile.level >= 20) unlock('level20');
    if (userDecks.length >= 10) unlock('deckCollector');
    if (completedDecks.length >= 25) unlock('marathoner');
    // Assumindo que existem 5 cursos no total
    if (coursesCreated.length >= 5) unlock('polymath');
    if (completedDecks.filter(d => d.score === 10).length >= 5) unlock('perfectScorePro');
    if (completedDecks.filter(d => d.course === 'PRF').length >= 5) unlock('prfMaster');
    if (completedDecks.filter(d => d.course === 'ENEM').length >= 5) unlock('enemMaster');
    if (completedDecks.filter(d => d.course === 'OAB').length >= 5) unlock('oabMaster');
    if (completedDecks.filter(d => d.course === 'Medicina').length >= 5) unlock('medMaster');


    if (newAchievements) {
        await saveUserProfile(userId, userProfile);
    }
}

export function getXpProgress(level, xp) {
    const xpNext = Math.floor(getXpForNextLevel(level));
    const progressPercentage = (xp / xpNext) * 100;
    return {
        xpNext: xpNext,
        progress: progressPercentage
    };
}
