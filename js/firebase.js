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
let gameStartTime = null;

export function startGame() {
    const newRef = push(ref(db, 'sessions'));
    currentSessionId = newRef.key;
    gameStartTime = Date.now();
    set(newRef, { timestamp: Date.now() });
}

export function endGame(score) {
    if (!currentSessionId) return;
    const duration = Math.floor((Date.now() - gameStartTime) / 1000);
    update(ref(db, `sessions/${currentSessionId}`), { score, duration });
}
