import { getDatabase, ref, onValue, push, remove, serverTimestamp, update, set, query, orderByChild, equalTo } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseApp } from './firebase.js';

const db = getDatabase(firebaseApp);

// ... existing code ...

export function loadUserProfile(userId, callback) {
    const userProfileRef = ref(db, `users/${userId}/profile`);
    onValue(userProfileRef, (snapshot) => {
        let profile;
        if (snapshot.exists()) {
            profile = snapshot.val();
            if (!profile.achievements) profile.achievements = {};
            if (profile.credits === undefined) profile.credits = 15;
        } else {
            profile = { level: 1, xp: 0, credits: 15, achievements: {} };
            saveUserProfile(userId, profile);
        }
        callback(profile);
    });
}

export async function saveUserProfile(userId, profile) {
    if (!userId) return;
    const userProfileRef = ref(db, `users/${userId}/profile`);
    await set(userProfileRef, profile);
}

export function loadUserDecks(userId, callback) {
    const userDecksRef = ref(db, `users/${userId}/decks`);
    onValue(userDecksRef, (snapshot) => {
        let decks = [];
        if (snapshot.exists()) {
            const data = snapshot.val();
            decks = Object.keys(data).map(key => ({ id: key, ...data[key] })).reverse();
        }
        callback(decks);
    });
}

export async function pushFlashcardSet(userId, flashcardSet) {
    if (!userId) return null;
    const userDecksRef = ref(db, `users/${userId}/decks`);
    const newDeckRef = await push(userDecksRef, flashcardSet);
    return newDeckRef.key;
}

export async function updateFlashcardSet(userId, deckId, flashcardSet) {
    if (!userId) return;
    const deckRef = ref(db, `users/${userId}/decks/${deckId}`);
    await update(deckRef, flashcardSet);
}

export function deleteFlashcardSet(userId, deckId) {
    if (!userId || !deckId) return;
    const deckRef = ref(db, `users/${userId}/decks/${deckId}`);
    return remove(deckRef);
}

// --- FUNÇÕES DE DUELO (NOVAS) ---

export async function createDuel(challengerInfo, opponentEmail, course, questions) {
    const duelsRef = ref(db, 'duels');
    const newDuel = {
        createdAt: serverTimestamp(),
        course: course,
        challenger: {
            uid: challengerInfo.uid,
            email: challengerInfo.email,
            score: null, // Null indica que ainda não jogou ou não terminou
            status: 'pending' 
        },
        opponent: {
            email: opponentEmail,
            score: null,
            status: 'pending'
        },
        questions: questions,
        status: 'active' // active, finished
    };
    return push(duelsRef, newDuel);
}

// Escuta TODOS os duelos e filtra no cliente (solução simples para protótipo sem regras de índice complexas)
export function listenToDuels(userEmail, callback) {
    const duelsRef = ref(db, 'duels');
    onValue(duelsRef, (snapshot) => {
        const allDuels = snapshot.val();
        const myDuels = [];
        
        if (allDuels) {
            Object.keys(allDuels).forEach(key => {
                const duel = allDuels[key];
                // Verifica se sou o desafiante ou o oponente
                if (duel.challenger.email === userEmail || duel.opponent.email === userEmail) {
                    myDuels.push({ id: key, ...duel });
                }
            });
        }
        // Ordena os mais recentes primeiro
        myDuels.sort((a, b) => b.createdAt - a.createdAt);
        callback(myDuels);
    });
}

export async function updateDuelScore(duelId, role, score) {
    // role deve ser 'challenger' ou 'opponent'
    const updates = {};
    updates[`duels/${duelId}/${role}/score`] = score;
    updates[`duels/${duelId}/${role}/status`] = 'completed';
    
    await update(ref(db), updates);
    
    // Verifica se ambos terminaram para marcar duelo como finished (opcional, pode ser feito na view)
    // Mas vamos deixar o status geral como 'active' até que ambos joguem visualmente
}