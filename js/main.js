import { CONFIG } from './config.js';
import { initInput, anyDown } from './input.js';
import { getGameState, GameState } from './gameState.js';
import {
    updateTitleScreen,
    drawTitleScreen,
} from './screens/titleScreen.js';
import {
    initRaceScreen,
    updateRaceScreen,
    drawRaceScreen,
    drawGameOverScreen,
    restartRaceScreen,
} from './screens/raceScreen.js';

import { initAudioManager } from './audioManager.js';


const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

canvas.width = CONFIG.canvas.width;
canvas.height = CONFIG.canvas.height;

let lastTime = 0;

initInput();
initAudioManager();

await initRaceScreen();

function update(dt) {
    const state = getGameState();

    if (state === GameState.TITLE) {
        updateTitleScreen(dt);
        return;
    }

    if (state === GameState.RACE) {
        updateRaceScreen(dt);
        return;
    }

    if (state === GameState.GAME_OVER) {
        if (anyDown(['Enter'])) {
            restartRaceScreen();
        }
    }
}

function render() {
    const state = getGameState();

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (state === GameState.TITLE) {
        drawTitleScreen(ctx, canvas.width, canvas.height);
        return;
    }

    if (state === GameState.RACE) {
        drawRaceScreen(ctx, canvas.width, canvas.height);
        return;
    }

    if (state === GameState.GAME_OVER) {
        drawGameOverScreen(ctx, canvas.width, canvas.height);
    }
}

function loop(timestamp) {
    const dt = Math.min((timestamp - lastTime) / 1000 || 0, 0.033);
    lastTime = timestamp;

    update(dt);
    render();

    requestAnimationFrame(loop);
}

requestAnimationFrame(loop);