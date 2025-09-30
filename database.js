import { getDatabase, ref, onValue, push, remove, serverTimestamp, update, set } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-database.js";
import { firebaseApp } from './firebase.js';

const db = getDatabase(firebaseApp);

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

