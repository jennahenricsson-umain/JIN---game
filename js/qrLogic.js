import * as firebase from './firebase.js';

const DB_URL = 'https://jin-gesturegame-default-rtdb.europe-west1.firebasedatabase.app';
const FORM_BASE = 'https://script.google.com/macros/s/AKfycbwEAxdeiA_05NtHgkdZUapqS1ySks3jr8wT_JF34mrH2tt03qykGk0E5PRPk7OdZq-FyQ/exec?sessionId=';

export async function saveScoreAndGetQR(score) {
    await fetch(`${DB_URL}/sessions/${firebase.currentSessionId}.json`, {
        method: 'PATCH',
        body: JSON.stringify({ totalScore: score, username: 'Guest' })
    });

    const formUrl = FORM_BASE + firebase.currentSessionId;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(formUrl)}`;
}
