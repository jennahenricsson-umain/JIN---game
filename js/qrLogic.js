import * as firebase from "./firebase.js";

const DB_URL =
    "https://jin-gesturegame-default-rtdb.europe-west1.firebasedatabase.app";
const FORM_BASE =
    "https://script.google.com/macros/s/AKfycbw3MHdvFQyWYg9vNyl-4mZYWLXJfy_rdzJoeCSn22YQaCXbB8MfnEo-A5myBtbu_dHKzQ/exec";

export async function saveScoreAndGetQR(score, player = 1) {
    const sessionId =
        player === 2 ? firebase.currentSessionId2 : firebase.currentSessionId;
    if (!sessionId) return null;

    await fetch(`${DB_URL}/sessions/${firebase.gameStartDate}/${sessionId}.json`, {
        method: "PATCH",
        body: JSON.stringify({ totalScore: score }),
    });

    const formUrl = FORM_BASE + "?sessionId=" + sessionId + "&date=" + firebase.gameStartDate;
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(formUrl)}`;
}
