import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, set, update, query, orderByChild, limitToLast, get, onValue } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

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

export function watchUsername(sessionId, callback) {
    const unsubscribe = onValue(ref(db, `sessions/${sessionId}/username`), snapshot => {
        const name = snapshot.val();
        if (name && name !== 'Guest') {
            callback(name);
            unsubscribe();
        }
    });
}

export async function fetchLeaderboard(limit = 5) {
    const q = query(ref(db, 'sessions'), orderByChild('score'), limitToLast(limit));
    const snapshot = await get(q);
    const results = [];
    snapshot.forEach(child => {
        const val = child.val();
        if (val.score != null) results.push({ score: val.score, name: val.username || '' });
    });
    return results.sort((a, b) => b.score - a.score);
}
