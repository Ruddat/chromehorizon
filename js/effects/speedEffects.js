export function drawSpeedEffects(ctx, player, width, height) {
    const speedRatio = Math.min(player.speed / 360, 1);
    const boostActive = player.isBoosting && player.speed > 120;

    if (speedRatio < 0.45) {
        return;
    }

    drawSpeedVignette(ctx, speedRatio, boostActive, width, height);

    if (boostActive) {
        drawBoostGlow(ctx, speedRatio, width, height);
    }
}

function drawSpeedVignette(ctx, speedRatio, boostActive, width, height) {
    const alpha = boostActive ? 0.36 : 0.18;

    const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.56,
        height * 0.18,
        width / 2,
        height * 0.56,
        height * 0.86
    );

    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${alpha * speedRatio})`);

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function drawBoostGlow(ctx, speedRatio, width, height) {
    const gradient = ctx.createRadialGradient(
        width / 2,
        height * 0.58,
        20,
        width / 2,
        height * 0.58,
        height * 0.68
    );

    gradient.addColorStop(0, `rgba(255,255,255,${0.08 * speedRatio})`);
    gradient.addColorStop(0.35, `rgba(32,247,255,${0.10 * speedRatio})`);
    gradient.addColorStop(0.75, `rgba(255,43,214,${0.08 * speedRatio})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}