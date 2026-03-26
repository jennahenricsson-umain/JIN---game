export function renderMenu(overlay, gesture, gesture2, confidence, confidence2, handX1, handX2) {
    overlay.innerHTML = `
        <img src="public/assets/Umain-logotype-white.png" class="main-menu-logo" alt="Logo">
        <p class="scene-text scene-text--main-menu" style="left: 25%;">
            Single Player<br>Wave on the <strong>left</strong>
        </p>
        <p class="scene-text scene-text--main-menu" style="left: 75%;">
            Multiplayer<br>Wave on the <strong>right</strong>
        </p>
    `;

    if (gesture === 'Open_Palm' && confidence >= 0.7) {
        return handX1 < window.innerWidth / 2 ? 'single' : 'multi';
    }

    if (gesture2 === 'Open_Palm' && confidence2 >= 0.7) {
        return handX2 < window.innerWidth / 2 ? 'single' : 'multi';
    }

    return null;
}
