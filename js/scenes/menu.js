
let holdstartLeft = null;
let holdstartRight = null;
let pctLeft = 0;
let pctRight = 0;
export let leftActive = false;
export let rightActive = false;
let selection = null;

export function renderMenu(overlay, gesture, gesture2, confidence, confidence2, handX1, handX2) {

    const html = `
        <p class="scene-text scene-text--main-menu">
            CHOOSE <span class="highlight-orange">MODE</span>
        </p>
        <img class="scene-image scene-image--left" src="public/assets/open_palm_chrome_left_JIN.png" alt="Menu Image">
        <p class="scene-text scene-text--menu-subtitle" style="left: 25%;">
            <span style="font-size: 1.3em;">1 PLAYER</span><br>WAVE ON THE <span class="highlight-violet">LEFT</span>
        </p>
        <img class="scene-image scene-image--right" src="public/assets/double_hands_JIN.png" alt="Menu Image">
        <p class="scene-text scene-text--menu-subtitle" style="left: 75%;">
            <span style="font-size: 1.3em;">2 PLAYERS</span><br>WAVE ON THE <span class="highlight-orange">RIGHT</span>
        </p>
        <div class="progress-bar" style="left: 25%"><div class="progress-bar__fill" id="bar-left" style="width:0%; transition:none;"></div></div>
        <div class="progress-bar" style="left: 75%"><div class="progress-bar__fill" id="bar-right" style="width:0%; transition:none;"></div></div>
    `;
    if (!overlay.querySelector('.scene-text--main-menu')) {
        overlay.innerHTML = html;
    }

    if (gesture === 'Open_Palm' && confidence >= 0.7) {
        selection = handX1 < window.innerWidth / 2 ? 'single' : 'multi';
    } 

    if (gesture2 === 'Open_Palm' && confidence2 >= 0.7) {
        selection = handX2 < window.innerWidth / 2 ? 'single' : 'multi';
    } 

    if (gesture === 'Open_Palm' && confidence >= 0.7 && handX1 <= window.innerWidth / 2 || gesture2 === 'Open_Palm' && confidence2 >= 0.7 && handX2 <= window.innerWidth / 2) {
        leftActive = true;
        rightActive = false;
    }
    if (gesture === 'Open_Palm' && confidence >= 0.7 && handX1 > window.innerWidth / 2 || gesture2 === 'Open_Palm' && confidence2 >= 0.7 && handX2 > window.innerWidth / 2) {
        leftActive = false;
        rightActive = true;
    }
    if (gesture !=='Open_Palm' && gesture2 !=='Open_Palm' || confidence <= 0.4 && confidence2 <= 0.4){
        leftActive = false;
        rightActive = false;
        pctRight = 0;
        pctLeft = 0;
    }

    if (leftActive) {
        holdstartRight = null;
        pctRight = 0;
        if (holdstartLeft === null) {
            holdstartLeft = Date.now();
        } else if (Date.now() - holdstartLeft >= 3000) {
            holdstartLeft = null;
            return selection;
        }
        pctLeft = ((Date.now() - holdstartLeft) / 3000) * 100;
    }
    if (rightActive) {
        holdstartLeft = null;
        pctLeft = 0;
        if (holdstartRight === null) {
            holdstartRight = Date.now();
        } else if (Date.now() - holdstartRight >= 3000) {
            holdstartRight = null;
            return selection;
        }
        pctRight = ((Date.now() - holdstartRight) / 3000) * 100;
    } 
    if (!leftActive && !rightActive) {
        holdstartLeft = null;
        holdstartRight = null;
        pctLeft = 0;
        pctRight = 0;
    }

    const progressbarLeft = overlay.querySelector('#bar-left');
    const progressbarRight = overlay.querySelector('#bar-right');
    if (progressbarLeft && progressbarLeft.style.width !== pctLeft + '%') progressbarLeft.style.width = pctLeft + '%';
    if (progressbarRight && progressbarRight.style.width !== pctRight + '%') progressbarRight.style.width = pctRight + '%';

    return null;
}
