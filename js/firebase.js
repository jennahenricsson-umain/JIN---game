import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, set, update, query, orderByChild, limitToLast, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyDCe5jsT5vl9yeQEYHnNcomEWymgO817F8",
    authDomain: "jin-gesturegame.firebaseapp.com",
    databaseURL: "https://jin-gesturegame-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "jin-gesturegame",
    storageBucket: "jin-gesturegame.firebasestorage.app",
    messagingSenderId: "470580967492",
    appId: "1:470580967492:web:399614ecd28a8839b02411"
};

const db = getDatabase(initializeApp(firebaseConfig));

export let currentSessionId = null;
export let currentSessionId2 = null;
let gameStartTime = null;

export function startGame(isMultiplayer = false) {
    const newRef = push(ref(db, 'sessions'));
    currentSessionId = newRef.key;
    gameStartTime = Date.now();
    set(newRef, { timestamp: Date.now() });

    if (isMultiplayer) {
        const newRef2 = push(ref(db, 'sessions'));
        currentSessionId2 = newRef2.key;
        set(newRef2, { timestamp: Date.now() });
    } else {
        currentSessionId2 = null;
    }
}

export function endGame(score, score2 = null) {
    if (!currentSessionId) return;
    const duration = Math.floor((Date.now() - gameStartTime) / 1000);
    update(ref(db, `sessions/${currentSessionId}`), { score, duration });
    if (currentSessionId2 && score2 !== null) {
        update(ref(db, `sessions/${currentSessionId2}`), { score: score2, duration });
    }
}
