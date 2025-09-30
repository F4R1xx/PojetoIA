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
    serproMaster: { name: "Especialista SERPRO", description: "Complete 5 decks do SERPRO.", icon: "💻" }
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
    let newAchievements = false;

    if (!userProfile.achievements) {
        userProfile.achievements = {};
    }

    if (userDecks.length > 0 && !userProfile.achievements.firstDeck) {
        userProfile.achievements.firstDeck = true; newAchievements = true;
    }
    if (completedDecks.length > 0 && !userProfile.achievements.firstComplete) {
        userProfile.achievements.firstComplete = true; newAchievements = true;
    }
    if (completedDecks.some(d => d.score === 10) && !userProfile.achievements.perfectScore) {
        userProfile.achievements.perfectScore = true; newAchievements = true;
    }
    if (userProfile.level >= 5 && !userProfile.achievements.level5) {
        userProfile.achievements.level5 = true; newAchievements = true;
    }
    if (userProfile.level >= 10 && !userProfile.achievements.level10) {
        userProfile.achievements.level10 = true; newAchievements = true;
    }
    if (completedDecks.filter(d => d.course === 'SERPRO').length >= 5 && !userProfile.achievements.serproMaster) {
        userProfile.achievements.serproMaster = true; newAchievements = true;
    }

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

