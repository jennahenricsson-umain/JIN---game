import { saveScoreAndGetQR } from "../qrLogic.js";
import { watchUsername, currentSessionId, currentSessionId2 } from "../firebase.js";

const RANKS = ["1st", "2nd", "3rd"];
let rendered = false;
let sessionScores = [];

function buildScoreboard(scores, finalScore) {
    const latestIndex = [...scores].findIndex((s) => s.score === finalScore);
    return `
        <div class="leaderboard-column">
            <div class="rectangle-wrapper green">
                <div class="scoreboard__board-title">Leaderboard</div>
                ${scores
                    .map(
                        (s, i) => `
                    <div class="scoreboard__row ${i === latestIndex ? "scoreboard__row--highlight" : ""}" data-session-id="${s.sessionId || ""}">
                    <div class="scoreboard__left">

                        <span class="scoreboard__rank">${RANKS[i]}</span>
                        <span class="scoreboard__playertag">${s.player || ""}</span>
                    </div>
                        <span class="scoreboard__score">${s.player ? s.score : ""}</span>
                    </div>

                `
                    )
                    .join("")}
                </div>
                    <div class="rectangle-wrapper green wave-box">
                    Wave to play again
                </div>
        </div>
    `;
}

function buildQRColumn(score, wrapperId) {
    return `
        <div class="qr-column">
            <div class="rectangle-wrapper blue qr-score-box">
                <div class="scoreboard__title">Your score</div>
                <div class="your-score-value">${score}</div>

            </div>
            <div class="rectangle-wrapper blue qr-panel">
                <div id="${wrapperId}" class="qr-img-wrap">Loading…</div>
                <div class="qr-label">Scan to join</div>
            </div>
        </div>
    `;
}

function buildMultiLayout(score1, score2) {
    const displayScores = [...sessionScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3);
    while (displayScores.length < 3) displayScores.push({ score: 0, player: "" });
    const rows = displayScores
        .map(
            (s, i) => `
        <div class="scoreboard__row" data-session-id="${s.sessionId || ''}">
            <div class="scoreboard__left">
                <span class="scoreboard__rank">${RANKS[i]}</span>
                <span class="scoreboard__playertag">${s.player || ""}</span>
            </div>
            <span class="scoreboard__score">${s.player ? s.score : ""}</span>
        </div>`
        )
        .join("");
    return `
        <div class="gameover-panel--multi">
            <div class="qr-column">
                <div class="rectangle-wrapper blue qr-score-box">
                    <div class="scoreboard__title">Player 1</div>
                    <div class="multi-score-value">${score1}</div>
                </div>
                <div class="rectangle-wrapper blue qr-panel">
                    <div id="qr-img-wrap-p1" class="qr-img-wrap">Loading…</div>
                    <div class="qr-label">Scan to join the leaderboard</div>
                </div>
            </div>
            <div class="leaderboard-column">
                <div class="rectangle-wrapper green">
                    <div class="scoreboard__board-title">Scoreboard</div>
                    ${rows}
                </div>
                <div class="rectangle-wrapper green wave-box">Wave to play again</div>
            </div>
            <div class="qr-column">
                <div class="rectangle-wrapper blue qr-score-box">
                    <div class="scoreboard__title">Player 2</div>
                    <div class="multi-score-value">${score2}</div>
                </div>
                <div class="rectangle-wrapper blue qr-panel">
                    <div id="qr-img-wrap-p2" class="qr-img-wrap">Loading…</div>
                    <div class="qr-label">Scan to join the leaderboard</div>
                </div>
            </div>
        </div>
    `;
}

// finalScore2 is optional — pass it in multiplayer to show both scores
export function renderGameOver(
    overlay,
    gesture,
    gesture2,
    confidence,
    confidence2,
    finalScore,
    finalScore2 = null
) {
    if (!rendered) {
        rendered = true;
        const isMulti = finalScore2 !== null;
        if (isMulti) {
            sessionScores.push(
                { score: finalScore, player: "", sessionId: currentSessionId },
                { score: finalScore2, player: "", sessionId: currentSessionId2 }
            );
        } else {
            const sessionId = currentSessionId;
            sessionScores.push({ score: finalScore, sessionId, player: "" });
        }
        const displayScores = [...sessionScores]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        while (displayScores.length < 3) displayScores.push({ score: 0 });

        overlay.innerHTML = `
            <div class="scene-text scene-text--scoreboard">
                ${
                    isMulti
                        ? buildMultiLayout(finalScore, finalScore2)
                        : `<div class="gameover-panel">
                        ${buildScoreboard(displayScores, finalScore)}
                        ${buildQRColumn(finalScore, "qr-img-wrap-p1")}
                       </div>`
                }
            </div>
            ${window._savedIconsHTML || ""}
            ${window._savedScoreHTML || ""}
        `;

        if (isMulti) {
            saveScoreAndGetQR(finalScore, 1).then((url) => {
                const wrap = document.getElementById("qr-img-wrap-p1");
                if (wrap && url)
                    wrap.innerHTML = `<img src="${url}" class="qr-prompt__img" alt="QR code">`;
            });
            saveScoreAndGetQR(finalScore2, 2).then((url) => {
                const wrap = document.getElementById("qr-img-wrap-p2");
                if (wrap && url)
                    wrap.innerHTML = `<img src="${url}" class="qr-prompt__img" alt="QR code">`;
            });
            if (currentSessionId) {
                watchUsername(currentSessionId, (name) => {
                    const entry = sessionScores.find((s) => s.sessionId === currentSessionId);
                    if (entry) entry.player = name;
                    const row = overlay.querySelector(`[data-session-id="${currentSessionId}"]`);
                    if (row) {
                        row.querySelector(".scoreboard__playertag").textContent = name;
                        row.querySelector(".scoreboard__score").textContent = entry ? entry.score : "";
                    }
                });
            }
            if (currentSessionId2) {
                watchUsername(currentSessionId2, (name) => {
                    const entry = sessionScores.find((s) => s.sessionId === currentSessionId2);
                    if (entry) entry.player = name;
                    const row = overlay.querySelector(`[data-session-id="${currentSessionId2}"]`);
                    if (row) {
                        row.querySelector(".scoreboard__playertag").textContent = name;
                        row.querySelector(".scoreboard__score").textContent = entry ? entry.score : "";
                    }
                });
            }
        } else {
            const sessionId = currentSessionId;
            saveScoreAndGetQR(finalScore, 1).then((url) => {
                const wrap = document.getElementById("qr-img-wrap-p1");
                if (wrap && url)
                    wrap.innerHTML = `<img src="${url}" class="qr-prompt__img" alt="QR code">`;
            });
            if (sessionId) {
                watchUsername(sessionId, (name) => {
                    const entry = sessionScores.find(
                        (s) => s.sessionId === sessionId
                    );
                    if (entry) entry.player = name;
                    const row = overlay.querySelector(
                        `[data-session-id="${sessionId}"]`
                    );
                    if (row) {
                        row.querySelector(".scoreboard__playertag").textContent = name;
                        row.querySelector(".scoreboard__score").textContent = entry ? entry.score : "";
                    }
                });
            }
        }
    }

    if (
        (gesture === "Open_Palm" && confidence >= 0.7) ||
        (gesture2 === "Open_Palm" && confidence2 >= 0.7)
    ) {
        rendered = false;
        return "play_again";
    } else if (
        (gesture === "Thumb_Down" && confidence >= 0.7) ||
        (gesture2 === "Thumb_Down" && confidence2 >= 0.7)
    ) {
        rendered = false;
        return "menu";
    }
    return false;
}

export function resetGameOver() {
    rendered = false;
}

export function getSessionScores() {
    return [...sessionScores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map((s) => ({ score: s.score, name: s.player || "" }));
}
