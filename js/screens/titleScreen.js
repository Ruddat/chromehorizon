import { CONFIG } from '../config.js';
import { anyDown } from '../input.js';
import { setGameState, GameState } from '../gameState.js';

let blinkTimer = 0;

export function updateTitleScreen(dt) {
    blinkTimer += dt;

    if (anyDown(['Enter', 'Space'])) {
        setGameState(GameState.RACE);
    }
}

export function drawTitleScreen(ctx, width, height) {
    drawTitleBackground(ctx, width, height);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = 'bold 64px Consolas, monospace';
    ctx.fillStyle = '#20f7ff';
    ctx.shadowColor = '#20f7ff';
    ctx.shadowBlur = 18;
    ctx.fillText(CONFIG.title, width / 2, 190);

    ctx.font = 'bold 24px Consolas, monospace';
    ctx.fillStyle = '#ff2bd6';
    ctx.shadowColor = '#ff2bd6';
    ctx.shadowBlur = 14;
    ctx.fillText(CONFIG.subtitle, width / 2, 235);

    ctx.shadowBlur = 0;

    ctx.font = 'bold 18px Consolas, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('WASD / PFEILTASTEN  ·  SPACE BOOST', width / 2, 330);

    if (Math.floor(blinkTimer * 2) % 2 === 0) {
        ctx.fillStyle = '#20f7ff';
        ctx.fillText('ENTER ODER SPACE ZUM STARTEN', width / 2, 385);
    }

    ctx.font = 'bold 14px Consolas, monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText('HYBRID CANVAS ENGINE · IMAGE ASSET READY', width / 2, 500);

    ctx.restore();
}

function drawTitleBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#05051a');
    gradient.addColorStop(0.45, '#180a3f');
    gradient.addColorStop(1, '#020208');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = 'rgba(255,43,214,0.35)';
    ctx.lineWidth = 1;

    for (let y = 300; y < height; y += 18) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    for (let x = -width; x < width * 2; x += 48) {
        ctx.beginPath();
        ctx.moveTo(width / 2, 300);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}