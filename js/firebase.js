// Firebase Realtime Database configuration
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
import { getDatabase, ref, push, set, update, onValue, query, orderByChild, limitToLast, serverTimestamp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

// Firebase config from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDCe5jsT5vl9yeQEYHnNcomEWymgO817F8",
  authDomain: "jin-gesturegame.firebaseapp.com",
  databaseURL: "https://jin-gesturegame-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "jin-gesturegame",
  storageBucket: "jin-gesturegame.firebasestorage.app",
  messagingSenderId: "470580967492",
  appId: "1:470580967492:web:399614ecd28a8839b02411",
  measurementId: "G-FY89P91XS5"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export let currentSessionId = null;
let sessionStartTime = null;

// Initialize user session
export function startSession() {
    const sessionsRef = ref(db, 'sessions');
    const newSessionRef = push(sessionsRef);
    currentSessionId = newSessionRef.key;
    sessionStartTime = Date.now(); 

    set(newSessionRef, {
        startTime: serverTimestamp(),
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
        gamesPlayed: 0,
        totalScore: 0,
        active: true
    })
    .then(() => {
        console.log(`New session started with ID: ${currentSessionId}`);
    })
    .catch((error) => {
        console.error("Error starting new session:", error);
    });

    return currentSessionId;
}

// Update session when game ends
export function updateSession(gamesPlayed, ) {
    if (!currentSessionId) return;
    
    const sessionRef = ref(db, `sessions/${currentSessionId}`);
    update(sessionRef, {
        gamesPlayed,
        //totalScore,
        lastActivity: Date.now()
    });
    


}

// End session
export function endSession() {
    if (!currentSessionId) return;
    
    const duration = Date.now() - sessionStartTime;
    const sessionRef = ref(db, `sessions/${currentSessionId}`);
    update(sessionRef, {
        endTime: Date.now(),
        duration,
        active: false
    });
    
}

// Save game score and metrics
export function saveGame(score, duration, metrics) {
    const gamesRef = ref(db, 'games');
    const newGameRef = push(gamesRef);
    
    set(newGameRef, {
        sessionId: currentSessionId,
        score,
        duration,
        timestamp: Date.now(),
        ...metrics
    });
}

// Track gameplay metrics in real-time
export function trackMetric(eventType, data) {
    if (!currentSessionId) return;
    
    const metricsRef = ref(db, `metrics/${currentSessionId}`);
    const newMetricRef = push(metricsRef);
    
    set(newMetricRef, {
        eventType,
        timestamp: Date.now(),
        ...data
    });
}

// Get top scores with real-time updates
export function subscribeToTopScores(callback, limitCount = 5) {
    const scoresQuery = query(
        ref(db, 'games'),
        orderByChild('score'),
        limitToLast(limitCount)
    );
    
    return onValue(scoresQuery, (snapshot) => {
        const scores = [];
        snapshot.forEach((child) => {
            scores.push({ id: child.key, ...child.val() });
        });
        callback(scores.reverse());
    });
}

// Get session stats
export function getSessionStats(callback) {
    if (!currentSessionId) return;
    
    const sessionRef = ref(db, `sessions/${currentSessionId}`);
    return onValue(sessionRef, (snapshot) => {
        callback(snapshot.val());
    });
}
