export function drawHud(ctx, level, player, race, width) {
    const palette = level.palette;

    ctx.save();

    ctx.font = 'bold 18px Consolas, monospace';
    ctx.fillStyle = palette.textAccent;
    ctx.fillText('CHROME HORIZON', 30, 36);

    ctx.font = 'bold 16px Consolas, monospace';
    ctx.fillStyle = palette.textAccent;
    ctx.fillText('SCORE', 30, 76);
    ctx.fillText('TIME', 30, 132);
    ctx.fillText('DISTANCE', 30, 188);
    ctx.fillText('NEXT', 30, 276);

    ctx.font = 'bold 28px Consolas, monospace';
    ctx.fillStyle = palette.textMain;
    ctx.fillText(String(Math.floor(player.score)).padStart(6, '0'), 30, 108);

    ctx.fillStyle = race.timeLeft < 10 ? '#ff2b2b' : palette.textHot;
    ctx.fillText(Math.ceil(race.timeLeft), 30, 164);

    ctx.fillStyle = palette.textMain;
    ctx.fillText(player.distance.toFixed(1) + ' KM', 30, 220);

    ctx.font = 'bold 22px Consolas, monospace';
    ctx.fillStyle = palette.textMain;
    ctx.fillText(
        Math.max(0, race.nextCheckpoint - player.distance).toFixed(1) + ' KM',
        30,
        306
    );

    ctx.font = 'bold 18px Consolas, monospace';
    ctx.fillStyle = palette.textAccent;
    ctx.fillText('SPEED', width - 225, 76);

    ctx.font = 'bold 44px Consolas, monospace';
    ctx.fillStyle = palette.textHot;
    ctx.fillText(Math.floor(player.speed), width - 225, 122);

    ctx.font = 'bold 18px Consolas, monospace';
    ctx.fillStyle = palette.textMain;
    ctx.fillText('KM/H', width - 95, 122);

    drawBoostBar(ctx, player, palette, width);

    if (race.messageTimer > 0) {
        drawMessage(ctx, race, width);
    }

    ctx.restore();
}

function drawBoostBar(ctx, player, palette, width) {
    ctx.font = 'bold 18px Consolas, monospace';
    ctx.fillStyle = palette.textAccent;
    ctx.fillText('BOOST', width - 225, 168);

    ctx.strokeStyle = palette.textAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(width - 225, 185, 170, 18);

    ctx.fillStyle = player.boost < 20 ? '#ff2b2b' : palette.textAccent;
    ctx.fillRect(width - 225, 185, clamp(player.boost / 100, 0, 1) * 170, 18);
}

function drawMessage(ctx, race, width) {
    ctx.textAlign = 'center';
    ctx.font = 'bold 34px Consolas, monospace';
    ctx.fillStyle = race.messageText === 'CRASH!' ? '#ff2b2b' : '#20f7ff';
    ctx.fillText(race.messageText, width / 2, 92);
    ctx.textAlign = 'left';
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}