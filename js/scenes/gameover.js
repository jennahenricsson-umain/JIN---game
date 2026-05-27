import { saveScoreAndGetQR } from "../qrLogic.js";
import { watchUsername, currentSessionId, currentSessionId2, fetchLeaderboard } from "../firebase.js";

const RANKS = ["1st", "2nd", "3rd"];
let initializing = false;

function buildScoreboard(scores) {
    return `
        <div class="leaderboard-column">
            <div class="rectangle-wrapper green">
                <div class="scoreboard__board-title">Leaderboard</div>
                ${scores
                    .map(
                        (s, i) => `
                    <div class="scoreboard__row">
                    <div class="scoreboard__left">

                        <span class="scoreboard__rank">${RANKS[i]}</span>
                        <span class="scoreboard__playertag">${s.name || ""}</span>
                    </div>
                        <span class="scoreboard__score">${s.name ? s.score : ""}</span>
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

function buildMultiLayout(score1, score2, displayScores) {
    while (displayScores.length < 3) displayScores.push({ score: 0, name: "" });
    const rows = displayScores
        .map(
            (s, i) => `
        <div class="scoreboard__row">
            <div class="scoreboard__left">
                <span class="scoreboard__rank">${RANKS[i]}</span>
                <span class="scoreboard__playertag">${s.name || ""}</span>
            </div>
            <span class="scoreboard__score">${s.name ? s.score : ""}</span>
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

export async function initGameOver(overlay, finalScore, finalScore2) {
        initializing = true;
        const sessionScores = await fetchLeaderboard(3);
        const isMulti = finalScore2 !== null;
        const displayScores = [...sessionScores]
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);
        while (displayScores.length < 3) displayScores.push({ score: 0, name: "" });

        overlay.innerHTML = `
            <div class="scene-text scene-text--scoreboard">
                ${
                    isMulti
                        ? buildMultiLayout(finalScore, finalScore2, displayScores)
                        : `<div class="gameover-panel">
                        ${buildScoreboard(displayScores)}
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
                watchUsername(currentSessionId, async (name) => {
                    const newScores = await fetchLeaderboard(3);
                    const leaderboardEl = overlay.querySelector(".leaderboard-column");
                    if (leaderboardEl) leaderboardEl.outerHTML = buildScoreboard(newScores);
                });
            }
            if (currentSessionId2) {
                watchUsername(currentSessionId2, async (name) => {
                    const newScores = await fetchLeaderboard(3);
                    const leaderboardEl = overlay.querySelector(".leaderboard-column");
                    if (leaderboardEl) leaderboardEl.outerHTML = buildScoreboard(newScores);
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
                watchUsername(sessionId, async (name) => {
                    const newScores = await fetchLeaderboard(3);
                    const leaderboardEl = overlay.querySelector(".leaderboard-column");
                    if (leaderboardEl) leaderboardEl.outerHTML = buildScoreboard(newScores);
                });
            }
        }
        initializing = false;
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
    if (initializing) return false;
    if (
        (gesture === "Open_Palm" && confidence >= 0.7) ||
        (gesture2 === "Open_Palm" && confidence2 >= 0.7)
    ) {
        return "play_again";
    } else if (
        (gesture === "Thumb_Down" && confidence >= 0.7) ||
        (gesture2 === "Thumb_Down" && confidence2 >= 0.7)
    ) {
        return "menu";
    }
    return false;
}

export function resetGameOver() {
    initializing = false;
}

