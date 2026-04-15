

export function renderMenu(overlay, gesture, gesture2, confidence, confidence2, handX1, handX2) {
    
    const html = `
        <p class="scene-text scene-text--main-menu">
            CHOOSE <span class="highlight-orange">MODE</span>
        </p>
        <img class="scene-image scene-image--left" src="public/assets/open_palm_chrome_left_JIN.png" alt="Menu Image">
        <p class="scene-text scene-text--menu-subtitle" style="left: 25%;">
            1 PLAYER<br>WAVE ON THE <span class="highlight-violet">LEFT</span>
        </p>
        <img class="scene-image scene-image--right" src="public/assets/double_hands_JIN.png" alt="Menu Image">
        <p class="scene-text scene-text--menu-subtitle" style="left: 75%;">
            2 PLAYERS<br>WAVE ON THE <span class="highlight-orange">RIGHT</span>
        </p>
    `;
    if (!overlay.querySelector('.scene-text--main-menu')) {
        overlay.innerHTML = html;
    }

    if (gesture === 'Open_Palm' && confidence >= 0.7) {
        return handX1 < window.innerWidth / 2 ? 'single' : 'multi';
    }

    if (gesture2 === 'Open_Palm' && confidence2 >= 0.7) {
        return handX2 < window.innerWidth / 2 ? 'single' : 'multi';
    }

    return null;
}
