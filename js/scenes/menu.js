export function renderMenu(overlay, gesture, confidence) {

    overlay.innerHTML = `
        <img src="public/assets/Umain-logotype-white.png" class="main-menu-logo" alt="Logo">
        <p class="scene-text scene-text--main-menu">Main Menu<br>(Thumbs Up to start)</p>
    `;
    return gesture === 'Thumb_Up' && confidence >= 0.7;
}
