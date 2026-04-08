import * as firebase from './firebase.js';

const DB_URL = 'https://jin-gesturegame-default-rtdb.europe-west1.firebasedatabase.app';
//const FORM_BASE = 'https://script.google.com/macros/s/AKfycbwoWI3fIg4DDaKmHW9Rca-MJSraAsGsOio7cB3AIqY40ongPnL-Zth0Lqy3tNJJxnnz7A/exec?sessionId=';
const FORM_BASE = 'https://script.google.com/macros/s/AKfycbwHgKB10Sq8z4-Rz6BC2uAcZp7gPS-P6tCwlFEIbcS_C4c2ShuxUYGl-JV4RWMpaXbf/exec?sessionId=';
export async function saveScoreAndGetQR(score) {
    await fetch(`${DB_URL}/sessions/${firebase.currentSessionId}.json`, {
        method: 'PATCH',
        body: JSON.stringify({ totalScore: score, username: 'Guest' })
    });

    const formUrl = FORM_BASE + firebase.currentSessionId;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(formUrl)}`;
}
