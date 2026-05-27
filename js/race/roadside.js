import { projectRoadPoint } from './road.js';

export function createRoadside(level, totalTrackLength) {
    const objects = [];
    const spacing = level.road.roadsideSpacing ?? 36;

    for (let position = 30; position < totalTrackLength; position += spacing) {
        // links
        objects.push(createRoadsideObject(level, position, -1));

        // rechts leicht versetzt
        objects.push(createRoadsideObject(level, position + spacing * 0.5, 1));

        // gelegentlich Neon-Schild
        if (Math.random() < 0.22) {
            objects.push({
                type: 'sign',
                side: Math.random() > 0.5 ? 1 : -1,
                position: position + spacing * 0.25,
                laneOffset: 1.95 + Math.random() * 0.55,
                variant: Math.floor(Math.random() * 3),
            });
        }

        // gelegentlich Felsen / Deko
        if (Math.random() < 0.28) {
            objects.push({
                type: 'rock',
                side: Math.random() > 0.5 ? 1 : -1,
                position: position + spacing * 0.72,
                laneOffset: 1.38 + Math.random() * 0.42,
                variant: Math.floor(Math.random() * 3),
            });
        }
    }

    return {
        visibleDistance: level.road.viewDistance ?? 520,
        objects,
    };
}

function createRoadsideObject(level, position, side) {
    const types = ['palm', 'palm', 'tree', 'lamp'];
    const type = types[Math.floor(Math.random() * types.length)];

    return {
        type,
        side,
        position,
        laneOffset: 1.75 + Math.random() * 0.75,
        variant: Math.floor(Math.random() * 4),
    };
}

export function drawRoadside(ctx, road, playerX, roadside, width, height) {
    const visibleItems = [];
    const totalTrackLength = road.totalTrackLength;
    const maxDistance = roadside.visibleDistance;

    for (const object of roadside.objects) {
        let relativeDistance = object.position - road.offset;

        while (relativeDistance < 0) {
            relativeDistance += totalTrackLength;
        }

        relativeDistance %= totalTrackLength;

        if (relativeDistance < 8 || relativeDistance > maxDistance) {
            continue;
        }

        /*
         * relativeDistance:
         * 0 = direkt beim Spieler
         * maxDistance = am Horizont
         *
         * z:
         * 0 = Horizont
         * 1 = nah am Spieler
         */
        const z = 1 - relativeDistance / maxDistance;

        if (z <= 0 || z >= 1) {
            continue;
        }

        const lane = object.side * object.laneOffset;

        const projected = projectRoadPoint(
            road,
            playerX,
            lane,
            z,
            width,
            height
        );

        visibleItems.push({
            ...object,
            z,
            projected,
        });
    }

    // Fern zuerst, nah zuletzt
    visibleItems.sort((a, b) => a.z - b.z);

    for (const item of visibleItems) {
        drawRoadsideItem(ctx, item);
    }
}

function drawRoadsideItem(ctx, item) {
    const { x, y } = item.projected;
    const scale = 0.08 + Math.pow(item.z, 1.55) * 2.35;
    drawRoadsideMotionBlur(ctx, item, scale);

    if (item.type === 'palm') {
        drawPalm(ctx, x, y, scale, item.side, item.variant);
        return;
    }

    if (item.type === 'tree') {
        drawTree(ctx, x, y, scale, item.side, item.variant);
        return;
    }

    if (item.type === 'lamp') {
        drawLamp(ctx, x, y, scale, item.side);
        return;
    }

    if (item.type === 'sign') {
        drawSign(ctx, x, y, scale, item.side, item.variant);
        return;
    }

    if (item.type === 'rock') {
        drawRock(ctx, x, y, scale, item.side, item.variant);
    }
}

function drawPalm(ctx, x, y, scale, side, variant = 0) {
    const wind = Math.sin(performance.now() * 0.002 + x * 0.01) * 3 * scale;

    ctx.save();
    ctx.translate(x + wind, y);

    // Schatten
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 4 * scale, 26 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stamm
    ctx.strokeStyle = '#2b140c';
    ctx.lineWidth = Math.max(2, 7 * scale);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(
        side * -8 * scale,
        -34 * scale,
        side * 8 * scale,
        -78 * scale
    );
    ctx.stroke();

    // Stamm-Highlights
    ctx.strokeStyle = 'rgba(255,118,64,0.45)';
    ctx.lineWidth = Math.max(1, 2 * scale);
    for (let i = 0; i < 5; i++) {
        const yy = -8 * scale - i * 13 * scale;
        ctx.beginPath();
        ctx.moveTo(-5 * scale, yy);
        ctx.lineTo(6 * scale, yy - 3 * scale);
        ctx.stroke();
    }

    const crownX = side * 8 * scale;
    const crownY = -78 * scale;

    // Blätter
    const leafColors = ['#061a13', '#0b2f20', '#103b29'];

    for (let i = 0; i < 9; i++) {
        const angle = -Math.PI + (i / 8) * Math.PI * 1.55 + side * 0.2;
        const length = (38 + (i % 3) * 9 + variant * 2) * scale;

        ctx.strokeStyle = leafColors[i % leafColors.length];
        ctx.lineWidth = Math.max(2, 5 * scale);
        ctx.beginPath();
        ctx.moveTo(crownX, crownY);
        ctx.quadraticCurveTo(
            crownX + Math.cos(angle) * length * 0.55,
            crownY + Math.sin(angle) * length * 0.35,
            crownX + Math.cos(angle) * length,
            crownY + Math.sin(angle) * length
        );
        ctx.stroke();
    }

    // Neon-Kante
    ctx.strokeStyle = side > 0
        ? 'rgba(255,43,214,0.55)'
        : 'rgba(32,247,255,0.55)';
    ctx.lineWidth = Math.max(1, 1.4 * scale);
    ctx.beginPath();
    ctx.arc(crownX, crownY, 13 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function drawTree(ctx, x, y, scale, side, variant = 0) {
    ctx.save();
    ctx.translate(x, y);

    // Schatten
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 5 * scale, 24 * scale, 8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Stamm
    ctx.fillStyle = '#2f1b0e';
    ctx.fillRect(-5 * scale, -38 * scale, 10 * scale, 42 * scale);

    const neon = side > 0
        ? 'rgba(255,43,214,0.45)'
        : 'rgba(32,247,255,0.45)';

    const crownColor = variant % 2 === 0 ? '#071b14' : '#0b2519';

    ctx.fillStyle = crownColor;
    drawBlob(ctx, 0, -62 * scale, 25 * scale);
    drawBlob(ctx, -13 * scale, -48 * scale, 18 * scale);
    drawBlob(ctx, 14 * scale, -47 * scale, 17 * scale);
    drawBlob(ctx, 2 * scale, -36 * scale, 15 * scale);

    ctx.strokeStyle = neon;
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.beginPath();
    ctx.arc(0, -62 * scale, 25 * scale, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
}

function drawBlob(ctx, x, y, r) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
}

function drawLamp(ctx, x, y, scale, side) {
    ctx.save();
    ctx.translate(x, y);

    const neon = side > 0 ? '#ff2bd6' : '#20f7ff';

    // Mast
    ctx.strokeStyle = '#242436';
    ctx.lineWidth = Math.max(2, 4 * scale);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -82 * scale);
    ctx.stroke();

    // Ausleger
    ctx.strokeStyle = '#303048';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.beginPath();
    ctx.moveTo(0, -78 * scale);
    ctx.lineTo(side * -25 * scale, -92 * scale);
    ctx.stroke();

    // Lampe
    ctx.fillStyle = neon;
    ctx.shadowColor = neon;
    ctx.shadowBlur = 16 * scale;
    ctx.beginPath();
    ctx.arc(side * -29 * scale, -94 * scale, 6 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.restore();
}

function drawSign(ctx, x, y, scale, side, variant = 0) {
    ctx.save();
    ctx.translate(x, y);

    const neon = variant % 2 === 0 ? '#ff2bd6' : '#20f7ff';

    // Mast
    ctx.fillStyle = '#30303c';
    ctx.fillRect(-3 * scale, -46 * scale, 6 * scale, 50 * scale);

    // Schild
    const w = 48 * scale;
    const h = 24 * scale;

    ctx.fillStyle = '#160d28';
    ctx.strokeStyle = neon;
    ctx.lineWidth = Math.max(1, 2 * scale);
    ctx.shadowColor = neon;
    ctx.shadowBlur = 12 * scale;

    roundRect(ctx, -w / 2, -72 * scale, w, h, 6 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Text-Linien
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-15 * scale, -63 * scale, 30 * scale, 3 * scale);
    ctx.fillStyle = neon;
    ctx.fillRect(-10 * scale, -56 * scale, 20 * scale, 2 * scale);

    ctx.restore();
}

function drawRock(ctx, x, y, scale, side, variant = 0) {
    ctx.save();
    ctx.translate(x, y);

    const w = (24 + variant * 5) * scale;
    const h = (15 + variant * 3) * scale;

    ctx.fillStyle = '#151522';
    ctx.strokeStyle = side > 0
        ? 'rgba(255,43,214,0.35)'
        : 'rgba(32,247,255,0.35)';
    ctx.lineWidth = Math.max(1, 1.4 * scale);

    ctx.beginPath();
    ctx.moveTo(-w * 0.5, 0);
    ctx.lineTo(-w * 0.2, -h);
    ctx.lineTo(w * 0.25, -h * 0.82);
    ctx.lineTo(w * 0.55, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
}

function roundRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);

    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}


function drawRoadsideMotionBlur(ctx, item, scale) {
    if (item.z < 0.62) {
        return;
    }

    const { x, y } = item.projected;

    const blurLength = (item.z - 0.62) * 120;
    const alpha = Math.min(0.32, (item.z - 0.62) * 0.75);

    ctx.save();

    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(2, 8 * scale);
    ctx.lineCap = 'round';

    const color = item.side > 0
        ? 'rgba(255,43,214,0.75)'
        : 'rgba(32,247,255,0.75)';

    ctx.strokeStyle = color;

    /*
     * Bewegungsrichtung:
     * Objekte kommen aus der Tiefe und rauschen unten/außen vorbei.
     * Blur wird deshalb nach oben-innen gezogen.
     */
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
        x - item.side * blurLength * 0.65,
        y - blurLength
    );
    ctx.stroke();

    ctx.restore();
}