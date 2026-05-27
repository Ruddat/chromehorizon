export function createRoad(level) {
    return {
        level,
        offset: 0,
        totalTrackLength: calculateTrackLength(level),
    };
}

export function updateRoad(road, speed, dt) {
    const speedRatio = Math.min(speed / 360, 1);

    /*
     * Nicht linear:
     * langsam = kontrolliert
     * schnell = deutlich mehr Weltbewegung
     * Boost = Arcade-Warp
     */
    const movement = speed * dt * (0.10 + speedRatio * speedRatio * 0.26);

    road.offset += movement;
}

function calculateTrackLength(level) {
    return level.track.reduce((total, section) => total + section.length, 0);
}

function getTrackSectionAt(road, position) {
    const level = road.level;
    const totalLength = road.totalTrackLength;

    let wrappedPosition = position % totalLength;

    if (wrappedPosition < 0) {
        wrappedPosition += totalLength;
    }

    let cursor = 0;

    for (let i = 0; i < level.track.length; i++) {
        const section = level.track[i];
        const start = cursor;
        const end = cursor + section.length;

        if (wrappedPosition >= start && wrappedPosition < end) {
            const localT = (wrappedPosition - start) / section.length;
            const nextSection = level.track[(i + 1) % level.track.length];

            return {
                section,
                nextSection,
                localT,
            };
        }

        cursor = end;
    }

    return {
        section: level.track[0],
        nextSection: level.track[1] || level.track[0],
        localT: 0,
    };
}

function smoothStep(t) {
    return t * t * (3 - 2 * t);
}

function getTrackValueAt(road, position, key = 'curve') {
    const trackData = getTrackSectionAt(road, position);
    const t = smoothStep(trackData.localT);

    const currentValue = trackData.section[key] ?? 0;
    const nextValue = trackData.nextSection[key] ?? currentValue;

    return currentValue + (nextValue - currentValue) * t;
}

function getBendAhead(road, distanceAhead) {
    /*
     * Liest die Strecke vor dem Spieler.
     * Dadurch sieht man Kurven schon am Horizont.
     */
    const step = 8;
    let bend = 0;

    for (let d = 0; d <= distanceAhead; d += step) {
        const curve = getTrackValueAt(road, road.offset + d, 'curve');
        bend += curve * step;
    }

    return bend;
}

function getHillAhead(road, distanceAhead) {
    /*
     * Liest Bodenwellen / Hügel vor dem Spieler.
     */
    const step = 10;
    let hill = 0;

    for (let d = 0; d <= distanceAhead; d += step) {
        const value = getTrackValueAt(road, road.offset + d, 'hill');
        hill += value * step;
    }

    return hill;
}

export function getCurveAt(road, z) {
    /*
     * z = 0 Horizont
     * z = 1 direkt beim Auto
     *
     * Wichtig:
     * Am Horizont schauen wir weit voraus.
     * Beim Auto schauen wir fast nicht voraus.
     */
    const viewDistance = road.level.road.viewDistance ?? 520;
    const distanceAhead = (1 - z) * viewDistance;

    const bend = getBendAhead(road, distanceAhead);

    /*
     * Skaliert die Kurve.
     * Nicht zu hoch setzen, sonst reißt die Straße seitlich weg.
     */
    const curveStrength = road.level.road.curveStrength ?? 0.55;

    return bend * curveStrength * 0.9;
}

export function getHeightAt(road, z) {
    const viewDistance = road.level.road.viewDistance ?? 520;
    const distanceAhead = (1 - z) * viewDistance;

    const hillStrength = road.level.road.hillStrength ?? 0.55;

    return getHillAhead(road, distanceAhead) * hillStrength;
}

export function projectRoadPoint(road, playerX, lane, z, canvasWidth, canvasHeight) {
    const horizon = road.level.road.horizon;
    const p = z * z;

    const baseY = horizon + p * (canvasHeight - horizon + 120);
    const hill = getHeightAt(road, z);

    const y = baseY - hill;
    const roadWidth = 80 + p * road.level.road.baseWidth;
    const curve = getCurveAt(road, z);
    const center = canvasWidth / 2 + curve - playerX * 190 * p;

    return {
        x: center + lane * roadWidth,
        y,
        scale: p,
        roadWidth,
        center,
    };
}

export function drawGeneratedBackground(ctx, level, width, height) {
    const palette = level.palette;

    const sky = ctx.createLinearGradient(0, 0, 0, height);
    sky.addColorStop(0, palette.skyTop);
    sky.addColorStop(0.45, palette.skyMid);
    sky.addColorStop(0.72, palette.skyBottom);
    sky.addColorStop(1, '#070713');

    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    drawStars(ctx, width);
    drawSun(ctx, width);
    drawMountains(ctx, level, width, height);
    drawSkyline(ctx, level, width);
    drawHorizonGlow(ctx, width);
}

function drawStars(ctx, width) {
    ctx.fillStyle = 'rgba(255,255,255,0.75)';

    for (let i = 0; i < 90; i++) {
        const x = (i * 131) % width;
        const y = (i * 47) % 210;
        const size = (i % 3) + 1;

        ctx.fillRect(x, y, size, size);
    }
}

function drawSun(ctx, width) {
    const sunX = width * 0.5;
    const sunY = 210;
    const sunRadius = 72;

    const sunGradient = ctx.createRadialGradient(
        sunX,
        sunY,
        10,
        sunX,
        sunY,
        sunRadius
    );

    sunGradient.addColorStop(0, '#fff78a');
    sunGradient.addColorStop(0.35, '#ff9f4a');
    sunGradient.addColorStop(1, '#ff2b88');

    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#251060';

    for (let i = 0; i < 8; i++) {
        ctx.fillRect(sunX - sunRadius, sunY - 50 + i * 16, sunRadius * 2, 5);
    }
}

function drawMountains(ctx, level, width, height) {
    ctx.fillStyle = level.palette.mountain;

    ctx.beginPath();
    ctx.moveTo(0, 300);
    ctx.lineTo(120, 245);
    ctx.lineTo(230, 290);
    ctx.lineTo(360, 230);
    ctx.lineTo(520, 300);
    ctx.lineTo(700, 240);
    ctx.lineTo(860, 300);
    ctx.lineTo(width, 260);
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fill();
}

function drawSkyline(ctx, level, width) {
    for (let i = 0; i < 38; i++) {
        const w = 18 + (i % 4) * 10;
        const h = 35 + (i % 7) * 14;
        const x = i * 30;
        const y = 305 - h;

        ctx.fillStyle = level.palette.skyline;
        ctx.fillRect(x, y, w, h);

        ctx.fillStyle = i % 2 === 0
            ? level.palette.neonB
            : level.palette.neonA;

        for (let wy = y + 8; wy < 300; wy += 14) {
            ctx.fillRect(x + 5, wy, 3, 4);
            ctx.fillRect(x + 13, wy, 3, 4);
        }
    }
}

function drawHorizonGlow(ctx, width) {
    const glow = ctx.createLinearGradient(0, 260, 0, 350);
    glow.addColorStop(0, 'rgba(255,43,214,0.35)');
    glow.addColorStop(1, 'rgba(255,43,214,0)');

    ctx.fillStyle = glow;
    ctx.fillRect(0, 260, width, 100);
}

export function drawRoad(ctx, road, playerX, width, height) {
    const level = road.level;
    const segments = level.road.segments;
    const palette = level.palette;

    const scroll = ((road.offset % 1) + 1) % 1;
    const stripeOffset = Math.floor(road.offset);

    /*
     * Wichtig:
     * Von hinten nach vorne zeichnen.
     * Also Horizont zuerst, Nähe zuletzt.
     */
    for (let i = 1; i <= segments; i++) {
        const zFar = (i - 1 + scroll) / segments;
        const zNear = Math.min((i + scroll) / segments, 1.08);

        const far = projectRoadPoint(road, playerX, 0, zFar, width, height);
        const near = projectRoadPoint(road, playerX, 0, zNear, width, height);

        const roadWidthFar = far.roadWidth;
        const roadWidthNear = near.roadWidth;

        const centerFar = far.center;
        const centerNear = near.center;

        const yFar = far.y;
        const yNear = near.y;

        const stripeIndex = stripeOffset + i;

        const groundColor = stripeIndex % 2 === 0
            ? palette.groundA
            : palette.groundB;

        const roadColor = stripeIndex % 2 === 0
            ? palette.roadA
            : palette.roadB;

        const neonColor = stripeIndex % 2 === 0
            ? palette.neonA
            : palette.neonB;

        // Boden links/rechts
        ctx.fillStyle = groundColor;
        ctx.fillRect(0, yFar, width, yNear - yFar + 2);

        // Straße
        ctx.fillStyle = roadColor;
        ctx.beginPath();
        ctx.moveTo(centerFar - roadWidthFar, yFar);
        ctx.lineTo(centerFar + roadWidthFar, yFar);
        ctx.lineTo(centerNear + roadWidthNear, yNear);
        ctx.lineTo(centerNear - roadWidthNear, yNear);
        ctx.closePath();
        ctx.fill();

        // Neon-Ränder
        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(centerFar - roadWidthFar, yFar);
        ctx.lineTo(centerNear - roadWidthNear, yNear);
        ctx.moveTo(centerFar + roadWidthFar, yFar);
        ctx.lineTo(centerNear + roadWidthNear, yNear);
        ctx.stroke();

        drawCenterLine(
            ctx,
            stripeIndex,
            centerNear,
            centerFar,
            yNear,
            yFar,
            near.scale,
            far.scale
        );

        drawLaneGuides(
            ctx,
            stripeIndex,
            centerNear,
            centerFar,
            yNear,
            yFar,
            roadWidthNear,
            roadWidthFar,
            near.scale,
            far.scale
        );
    }
}

function drawCenterLine(ctx, stripeIndex, centerNear, centerFar, yNear, yFar, pNear, pFar) {
if (stripeIndex % 6 >= 3) {
    return;
}

    const laneWNear = 5 + pNear * 12;
    const laneWFar = 5 + pFar * 12;

    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.moveTo(centerFar - laneWFar, yFar);
    ctx.lineTo(centerFar + laneWFar, yFar);
    ctx.lineTo(centerNear + laneWNear, yNear);
    ctx.lineTo(centerNear - laneWNear, yNear);
    ctx.closePath();
    ctx.fill();
}

function drawLaneGuides(
    ctx,
    stripeIndex,
    centerNear,
    centerFar,
    yNear,
    yFar,
    roadWidthNear,
    roadWidthFar,
    pNear,
    pFar
) {
if (stripeIndex % 7 >= 3) {
    return;
}

    const lineWidthNear = 3 + pNear * 8;
    const lineWidthFar = 3 + pFar * 8;

    const lanePositions = [-0.5, 0.5];

    ctx.fillStyle = 'rgba(32,247,255,0.55)';

    for (const lane of lanePositions) {
        const xNear = centerNear + roadWidthNear * lane;
        const xFar = centerFar + roadWidthFar * lane;

        ctx.beginPath();
        ctx.moveTo(xFar - lineWidthFar, yFar);
        ctx.lineTo(xFar + lineWidthFar, yFar);
        ctx.lineTo(xNear + lineWidthNear, yNear);
        ctx.lineTo(xNear - lineWidthNear, yNear);
        ctx.closePath();
        ctx.fill();
    }
}