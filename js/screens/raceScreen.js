import { getLevel } from '../levels/index.js';
import { loadAssets, hasImage, getImage } from '../assetLoader.js';
import {
    createRoad,
    updateRoad,
    drawRoad,
    drawGeneratedBackground,
} from '../race/road.js';
import {
    createPlayerCar,
    updatePlayerCar,
    drawPlayerCar,
} from '../race/playerCar.js';
import { drawHud } from '../race/hud.js';
import { setGameState, GameState } from '../gameState.js';
import { createRoadside, drawRoadside } from '../race/roadside.js';
import {
    registerMusic,
    playMusic,
    stopCurrentMusic,
} from '../audioManager.js';

import { drawSpeedEffects } from '../effects/speedEffects.js';

import {
    createTraffic,
    updateTraffic,
    drawTraffic,
} from '../race/traffic.js';

import {
    createPickups,
    updatePickups,
    drawPickups,
} from '../race/pickups.js';

const level = getLevel(0);

let initialized = false;
let road;
let player;
let race;
let roadside;
let traffic;
let pickups;

export async function initRaceScreen() {
    road = createRoad(level);
    player = createPlayerCar();
    roadside = createRoadside(level, road.totalTrackLength);
    traffic = createTraffic(level, road.totalTrackLength);
    pickups = createPickups(level, road.totalTrackLength);

    race = {
        timeLeft: level.timeLimit,
        nextCheckpoint: level.checkpointEveryKm,
        messageText: '',
        messageTimer: 0,

        // Parallax
        backgroundOffsetX: 0,
    };

    await loadAssets(level.assets);

    if (level.music?.race) {
        registerMusic('level1.race', level.music.race, {
            loop: true,
            volume: level.music.volume ?? 0.45,
        });
    }


    initialized = true;
}

export function updateRaceScreen(dt) {
    if (!initialized) {
        return;
    }

    playMusic('level1.race');

    updatePlayerCar(player, dt);
    updateRoad(road, player.speed, dt);
    updateTraffic(traffic, road, player, race, dt);
    updatePickups(pickups, road, player, race, dt);
    updateRaceTimer(dt);
    updateCheckpoint();
    updateMessage(dt);
    updateBackgroundParallax(dt);

    if (race.timeLeft <= 0) {
        stopCurrentMusic();
        setGameState(GameState.GAME_OVER);
    }
}

export function drawRaceScreen(ctx, width, height) {
    if (!initialized) {
        drawLoading(ctx, width, height);
        return;
    }

    const shake = getCameraShake();

    ctx.save();
    ctx.translate(shake.x, shake.y);

    drawBackground(ctx, width, height);
    drawRoad(ctx, road, player.x, width, height);
    drawRoadside(ctx, road, player.x, roadside, width, height);
    drawPickups(ctx, road, player.x, pickups, width, height);
    drawTraffic(ctx, road, player.x, traffic, width, height);
    drawPlayerCar(ctx, player, width, height);
    drawSpeedEffects(ctx, player, width, height);

    ctx.restore();

    drawHud(ctx, level, player, race, width);
}

export function drawGameOverScreen(ctx, width, height) {
    drawRaceScreen(ctx, width, height);

    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.fillRect(0, 0, width, height);

    ctx.save();
    ctx.textAlign = 'center';

    ctx.font = 'bold 54px Consolas, monospace';
    ctx.fillStyle = '#ff2bd6';
    ctx.fillText('TIME UP', width / 2, height / 2 - 55);

    ctx.font = 'bold 24px Consolas, monospace';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(
        'SCORE ' + String(Math.floor(player.score)).padStart(6, '0'),
        width / 2,
        height / 2 - 8
    );

    ctx.font = 'bold 20px Consolas, monospace';
    ctx.fillStyle = '#20f7ff';
    ctx.fillText('ENTER ZUM NEUSTART', width / 2, height / 2 + 42);

    ctx.restore();
}

export function restartRaceScreen() {
    road = createRoad(level);
    player = createPlayerCar();
    roadside = createRoadside(level, road.totalTrackLength);
    traffic = createTraffic(level, road.totalTrackLength);
    pickups = createPickups(level, road.totalTrackLength);

    race = {
        timeLeft: level.timeLimit,
        nextCheckpoint: level.checkpointEveryKm,
        messageText: '',
        messageTimer: 0,
        backgroundOffsetX: 0,
    };

    setGameState(GameState.RACE);
}

function updateBackgroundParallax(dt) {
    const speedRatio = Math.min(player.speed / 360, 1);

    const maxParallax = 35 + speedRatio * 130;
    const targetOffset = -player.x * maxParallax;

    const followSpeed = 3.5 + speedRatio * 7.5;

    race.backgroundOffsetX +=
        (targetOffset - race.backgroundOffsetX) *
        Math.min(1, dt * followSpeed);
}

function drawBackground(ctx, width, height) {
    if (hasImage('background.level1')) {
        const image = getImage('background.level1');
        drawParallaxBackgroundImage(ctx, image, width, height, race.backgroundOffsetX);
        return;
    }

    drawGeneratedBackground(ctx, level, width, height);
}

function drawParallaxBackgroundImage(ctx, image, width, height, offsetX = 0) {
    /*
     * Wir zeichnen das Bild bewusst breiter als die Canvas,
     * damit wir links/rechts Luft für Parallax haben.
     */
    const baseScale = height / image.height;
    let drawWidth = image.width * baseScale;
    let drawHeight = height;

    const extraMargin = 220;

    if (drawWidth < width + extraMargin) {
        const scaleUp = (width + extraMargin) / drawWidth;
        drawWidth *= scaleUp;
        drawHeight *= scaleUp;
    }

    const baseX = (width - drawWidth) / 2;
    const x = baseX + offsetX;
    const y = height - drawHeight;

    ctx.drawImage(image, x, y, drawWidth, drawHeight);
}

function updateRaceTimer(dt) {
    race.timeLeft -= dt;

    if (race.timeLeft < 0) {
        race.timeLeft = 0;
    }
}

function updateCheckpoint() {
    if (player.distance < race.nextCheckpoint) {
        return;
    }

    race.timeLeft += 25;
    player.boost = 100;
    player.score += 5000;
    race.nextCheckpoint += level.checkpointEveryKm;

    showMessage('CHECKPOINT +25 SEC');
}

function updateMessage(dt) {
    if (race.messageTimer > 0) {
        race.messageTimer -= dt;
    }
}

function showMessage(text, duration = 1.5) {
    race.messageText = text;
    race.messageTimer = duration;
}

function drawLoading(ctx, width, height) {
    ctx.fillStyle = '#050511';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.font = 'bold 24px Consolas, monospace';
    ctx.fillStyle = '#20f7ff';
    ctx.fillText('LOADING CHROME HORIZON...', width / 2, height / 2);
    ctx.textAlign = 'left';
}

function getCameraShake() {
    const speedRatio = Math.min(player.speed / 360, 1);

    let strength = 0;

    if (speedRatio > 0.55) {
        strength += (speedRatio - 0.55) * 5;
    }

    if (player.isBoosting) {
        strength += 3 + speedRatio * 6;
    }

    if (player.crashTimer > 0) {
        strength += 9;
    }

    return {
        x: (Math.random() - 0.5) * strength,
        y: (Math.random() - 0.5) * strength,
    };
}