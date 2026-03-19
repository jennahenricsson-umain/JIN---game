export function renderMenu(overlay, gesture, gesture2, confidence, confidence2) {

    overlay.innerHTML = `
        <img src="public/assets/Umain-logotype-white.png" class="main-menu-logo" alt="Logo">
        <p class="scene-text scene-text--main-menu">Main Menu<br>(Thumbs Up to start intro)</p>
    `;
    return gesture === 'Thumb_Up' && confidence >= 0.7 || gesture2 === 'Thumb_Up' && confidence2 >= 0.7;
}
