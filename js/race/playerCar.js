import { CONFIG } from '../config.js';
import { anyDown, isDown } from '../input.js';
import { getImage, hasImage } from '../assetLoader.js';

export function createPlayerCar() {
    return {
        x: 0,
        speed: 0,
        boost: 100,
        distance: 0,
        score: 0,
        crashTimer: 0,
        isBoosting: false,
    };
}

export function updatePlayerCar(player, dt) {
    const playerConfig = CONFIG.player;

    const boosting =
        isDown('Space') &&
        player.boost > 0 &&
        player.speed > 80 &&
        player.crashTimer <= 0;
        player.isBoosting = boosting;

    if (anyDown(['ArrowUp', 'KeyW'])) {
        player.speed += playerConfig.acceleration * dt;
    } else {
        player.speed -= playerConfig.friction * dt;
    }

    if (anyDown(['ArrowDown', 'KeyS'])) {
        player.speed -= playerConfig.brakePower * dt;
    }

    const currentMaxSpeed = boosting
        ? playerConfig.boostMaxSpeed
        : playerConfig.maxSpeed;

    if (boosting) {
        player.speed += 210 * dt;
        player.boost -= 32 * dt;
    } else {
        player.boost += 10 * dt;
    }

    if (player.crashTimer > 0) {
        player.crashTimer -= dt;
        player.speed -= 260 * dt;
    }

    player.boost = clamp(player.boost, 0, 100);
    player.speed = clamp(player.speed, 0, currentMaxSpeed);

    const steerStrength =
        playerConfig.steerStrength *
        dt *
        (0.45 + player.speed / currentMaxSpeed);

    if (anyDown(['ArrowLeft', 'KeyA'])) {
        player.x -= steerStrength;
    }

    if (anyDown(['ArrowRight', 'KeyD'])) {
        player.x += steerStrength;
    }

    player.x = clamp(player.x, -1.45, 1.45);

    player.distance += player.speed * dt * 0.004;
    player.score += player.speed * dt * 1.5;
}

export function drawPlayerCar(ctx, player, width, height) {
    if (hasImage('player.car')) {
        drawPlayerCarImage(ctx, player, width, height);
        return;
    }

    drawPlayerCarFallback(ctx, player, width, height);
}

function drawPlayerCarImage(ctx, player, width, height) {
    const image = getImage('player.car');

    if (!image) {
        drawPlayerCarFallback(ctx, player, width, height);
        return;
    }

    const carX = width / 2 + player.x * 110;
    const carY = height - 135;

    ctx.drawImage(image, carX - 80, carY, 160, 110);
}

function drawPlayerCarFallback(ctx, player, width, height) {
    const shake =
        player.crashTimer > 0
            ? Math.sin(performance.now() * 0.08) * 8
            : 0;

    const carX = width / 2 + player.x * 110 + shake;
    const carY = height - 92;

    ctx.save();
    ctx.translate(carX, carY);

    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.beginPath();
    ctx.ellipse(0, 56, 95, 18, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#070712';
    ctx.fillRect(-72, 8, 144, 42);

    const body = ctx.createLinearGradient(0, -35, 0, 55);
    body.addColorStop(0, '#26f7ff');
    body.addColorStop(0.48, '#a822ff');
    body.addColorStop(1, '#ff2bd6');

    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(-48, -30);
    ctx.lineTo(48, -30);
    ctx.lineTo(82, 12);
    ctx.lineTo(68, 45);
    ctx.lineTo(-68, 45);
    ctx.lineTo(-82, 12);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#050510';
    ctx.beginPath();
    ctx.moveTo(-28, -23);
    ctx.lineTo(28, -23);
    ctx.lineTo(43, 3);
    ctx.lineTo(-43, 3);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = player.crashTimer > 0 ? '#ffffff' : '#ff381f';
    ctx.fillRect(-60, 25, 34, 8);
    ctx.fillRect(26, 25, 34, 8);

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-65, 12);
    ctx.lineTo(65, 12);
    ctx.stroke();

    ctx.fillStyle = '#020208';
    ctx.fillRect(-72, 34, 28, 24);
    ctx.fillRect(44, 34, 28, 24);

if (isDown('Space') && player.boost > 0 && player.speed > 80) {
    drawBoostFlames(ctx, player.speed);
}

    ctx.restore();
}

function drawBoostFlames(ctx, speed) {
    const power = Math.min(speed / 360, 1);
    const flicker = 0.75 + Math.random() * 0.35;

    ctx.save();

    ctx.globalAlpha = 0.75 + power * 0.25;

    ctx.fillStyle = '#20f7ff';
    ctx.beginPath();
    ctx.moveTo(-38, 52);
    ctx.lineTo(-20, (90 + power * 38) * flicker);
    ctx.lineTo(-2, 52);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ff2bd6';
    ctx.beginPath();
    ctx.moveTo(6, 52);
    ctx.lineTo(26, (96 + power * 44) * flicker);
    ctx.lineTo(46, 52);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.45 + power * 0.35;
    ctx.beginPath();
    ctx.moveTo(-14, 52);
    ctx.lineTo(2, (76 + power * 28) * flicker);
    ctx.lineTo(16, 52);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}