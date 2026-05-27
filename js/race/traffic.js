import { projectRoadPoint } from './road.js';

export function createTraffic(level, totalTrackLength) {
    const config = level.traffic ?? {};
    const density = config.density ?? 6;
    const spawnDistance = config.spawnDistance ?? 540;
    const lanes = config.lanes ?? [-0.55, -0.18, 0.18, 0.55];

    const cars = [];

    /*
     * Wichtig:
     * Beim Levelstart nicht alles sofort vollballern.
     * Wir starten mit wenigen aktiven Autos.
     * Der Rest wird später aktiviert.
     */
    for (let i = 0; i < density; i++) {
        cars.push(createTrafficCar(level, totalTrackLength, i, density, spawnDistance, lanes));
    }

    return {
        enabled: config.enabled ?? true,
        visibleDistance: spawnDistance,
        minSpacing: config.minSpacing ?? 55,
        spawnCooldown: 0,
        spawnTimer: 0,
        maxActive: density,
        cars,
    };
}

function createTrafficCar(level, totalTrackLength, index, density, spawnDistance, lanes) {
    const template = pickTrafficTemplate(level);

    /*
     * Erste Autos weiter nach vorne legen.
     * active=false bedeutet: kommt erst später ins Spiel.
     */
    const activeAtStart = index < Math.ceil(density * 0.35);

    const startDistance = activeAtStart
        ? 180 + index * 105 + Math.random() * 60
        : spawnDistance + 220 + index * 90 + Math.random() * 180;

    return {
        active: activeAtStart,
        position: startDistance % totalTrackLength,
        lane: lanes[Math.floor(Math.random() * lanes.length)],

        type: template.type,
        colorA: template.colorA,
        colorB: template.colorB,

        /*
         * Eigene Geschwindigkeit des Autos in Welt-Einheiten.
         * Das Auto fährt auch, wenn der Spieler steht.
         */
        worldSpeed: template.worldSpeed ?? 18,

        passed: false,
        crashed: false,
        spawnDelay: activeAtStart ? 0 : 2 + index * 0.9,
        wobble: Math.random() * Math.PI * 2,
    };
}

function pickTrafficTemplate(level) {
    const carTypes = level.traffic?.cars ?? [];

    if (!carTypes.length) {
        return {
            type: 'basic',
            colorA: '#20f7ff',
            colorB: '#0b1024',
            worldSpeed: 18,
        };
    }

    return carTypes[Math.floor(Math.random() * carTypes.length)];
}

export function updateTraffic(traffic, road, player, race, dt) {
    if (!traffic.enabled) {
        return;
    }

    traffic.spawnTimer += dt;

    const total = road.totalTrackLength;

    for (const car of traffic.cars) {
        if (!car.active) {
            car.spawnDelay -= dt;

            if (car.spawnDelay <= 0) {
                spawnCarAhead(car, traffic, road, total);
            }

            continue;
        }

        /*
         * Eigene Bewegung.
         * Autos fahren auch ohne Spielerbewegung.
         */
        car.position += car.worldSpeed * dt;

        if (car.position >= total) {
            car.position -= total;
        }

        let relative = getRelativeDistance(car.position, road.offset, total);

        /*
         * Wenn Auto hinter dir raus ist, später neu vorne spawnen.
         */
        if (relative < 5 || relative > traffic.visibleDistance + 160) {
            car.active = false;
            car.spawnDelay = 1.2 + Math.random() * 2.4;
            continue;
        }

        checkPassed(car, relative, player, race);
        checkCollision(car, relative, player, race);
    }
}

function spawnCarAhead(car, traffic, road, totalTrackLength) {
    const lanes = road.level.traffic?.lanes ?? [-0.55, -0.18, 0.18, 0.55];
    const template = pickTrafficTemplate(road.level);

    /*
     * Nicht direkt vor die Nase setzen.
     * Lieber weit vorne am Horizont.
     */
    const spawnAhead =
        traffic.visibleDistance * 0.72 +
        Math.random() * traffic.visibleDistance * 0.45;

    car.position = (road.offset + spawnAhead) % totalTrackLength;
    car.lane = lanes[Math.floor(Math.random() * lanes.length)];

    car.type = template.type;
    car.colorA = template.colorA;
    car.colorB = template.colorB;
    car.worldSpeed = template.worldSpeed ?? 18;

    car.passed = false;
    car.crashed = false;
    car.active = true;
}

function getRelativeDistance(objectPosition, playerPosition, totalTrackLength) {
    let relative = objectPosition - playerPosition;

    while (relative < 0) {
        relative += totalTrackLength;
    }

    return relative % totalTrackLength;
}

function checkPassed(car, relative, player, race) {
    if (car.passed || car.crashed) {
        return;
    }

    /*
     * Auto ist sehr nah/hinter dir.
     * Wenn du nicht auf gleicher Spur bist: überholt.
     */
    if (relative < 22 && Math.abs(car.lane - player.x) > 0.25) {
        car.passed = true;
        player.score += 850;

        if (race) {
            race.messageText = 'OVERTAKE +850';
            race.messageTimer = 0.85;
        }
    }
}

function checkCollision(car, relative, player, race) {
    if (car.crashed || player.crashTimer > 0) {
        return;
    }

    const nearPlayer = relative < 20;
    const sameLane = Math.abs(car.lane - player.x) < 0.27;

    if (!nearPlayer || !sameLane) {
        return;
    }

    car.crashed = true;

    player.crashTimer = 0.85;
    player.speed *= 0.35;
    player.score = Math.max(0, player.score - 2200);

    if (race) {
        race.messageText = 'CRASH!';
        race.messageTimer = 1.1;
    }
}

export function drawTraffic(ctx, road, playerX, traffic, width, height) {
    if (!traffic.enabled) {
        return;
    }

    const visible = [];
    const total = road.totalTrackLength;

    for (const car of traffic.cars) {
        if (!car.active) {
            continue;
        }

        const relative = getRelativeDistance(car.position, road.offset, total);

        if (relative < 8 || relative > traffic.visibleDistance) {
            continue;
        }

        /*
         * relative:
         * 0 = direkt beim Spieler
         * visibleDistance = Horizont
         */
        const z = 1 - relative / traffic.visibleDistance;

        if (z <= 0 || z >= 1) {
            continue;
        }

        const projected = projectRoadPoint(
            road,
            playerX,
            car.lane,
            z,
            width,
            height
        );

        visible.push({
            car,
            z,
            projected,
        });
    }

    visible.sort((a, b) => a.z - b.z);

    for (const item of visible) {
        drawTrafficCar(ctx, item.car, item.projected, item.z);
    }
}

function drawTrafficCar(ctx, car, projected, z) {
    /*
     * Kleine Autos am Horizont, groß erst in der Nähe.
     */
    const scale = 0.08 + Math.pow(z, 1.45) * 1.95;

    const w = 54 * scale;
    const h = 92 * scale;

    const x = projected.x;
    const y = projected.y - h * 0.12;

    ctx.save();
    ctx.translate(x, y);

    // Schatten
    ctx.fillStyle = 'rgba(0,0,0,0.42)';
    ctx.beginPath();
    ctx.ellipse(0, h * 0.44, w * 0.65, h * 0.12, 0, 0, Math.PI * 2);
    ctx.fill();

    // Karosserie
    const gradient = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
    gradient.addColorStop(0, car.colorA);
    gradient.addColorStop(0.52, '#10101f');
    gradient.addColorStop(1, car.colorB);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(-w * 0.34, -h * 0.48);
    ctx.lineTo(w * 0.34, -h * 0.48);
    ctx.lineTo(w * 0.50, -h * 0.08);
    ctx.lineTo(w * 0.39, h * 0.43);
    ctx.lineTo(-w * 0.39, h * 0.43);
    ctx.lineTo(-w * 0.50, -h * 0.08);
    ctx.closePath();
    ctx.fill();

    // Fenster
    ctx.fillStyle = '#050510';
    ctx.beginPath();
    ctx.moveTo(-w * 0.22, -h * 0.35);
    ctx.lineTo(w * 0.22, -h * 0.35);
    ctx.lineTo(w * 0.31, -h * 0.04);
    ctx.lineTo(-w * 0.31, -h * 0.04);
    ctx.closePath();
    ctx.fill();

    // Frontlichter
    ctx.fillStyle = '#fff06a';
    ctx.fillRect(-w * 0.34, -h * 0.43, w * 0.17, h * 0.055);
    ctx.fillRect(w * 0.17, -h * 0.43, w * 0.17, h * 0.055);

    // Neonlinie
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    ctx.beginPath();
    ctx.moveTo(-w * 0.30, h * 0.06);
    ctx.lineTo(w * 0.30, h * 0.06);
    ctx.stroke();

    // Reifen
    ctx.fillStyle = '#020208';
    ctx.fillRect(-w * 0.48, h * 0.20, w * 0.18, h * 0.25);
    ctx.fillRect(w * 0.30, h * 0.20, w * 0.18, h * 0.25);

    ctx.restore();
}