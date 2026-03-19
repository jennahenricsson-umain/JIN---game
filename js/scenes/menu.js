export function renderMenu(overlay, gesture, confidence, handX) {
    overlay.innerHTML = `
        <img src="public/assets/Umain-logotype-white.png" class="main-menu-logo" alt="Logo">
        <p class="scene-text scene-text--main-menu">
            Thumbs Up on the <strong>left</strong> — Single Player<br>
            Thumbs Up on the <strong>right</strong> — Multiplayer
        </p>
    `;

    if (gesture === 'Thumb_Up' && confidence >= 0.7) {
        return handX < window.innerWidth / 2 ? 'single' : 'multi';
    }

    return null;
}
