import { projectRoadPoint } from './road.js';

export function createPickups(level, totalTrackLength) {
    const config = level.pickups ?? {};
    const density = config.density ?? 6;
    const spawnDistance = config.spawnDistance ?? 680;
    const lanes = config.lanes ?? [-0.55, -0.18, 0.18, 0.55];

    const items = [];

    for (let i = 0; i < density; i++) {
        items.push(createPickup(level, totalTrackLength, i, density, spawnDistance, lanes));
    }

    return {
        enabled: config.enabled ?? true,
        visibleDistance: spawnDistance,
        minSpacing: config.minSpacing ?? 80,
        items,
        particles: [],
    };
}

function createPickup(level, totalTrackLength, index, density, spawnDistance, lanes) {
    const template = pickPickupTemplate(level);
    const spacing = spawnDistance / Math.max(1, density);

    const position =
        220 +
        index * spacing +
        Math.random() * spacing * 0.55;

    return {
        active: true,
        collected: false,
        respawnDelay: 0,

        position: position % totalTrackLength,
        lane: lanes[Math.floor(Math.random() * lanes.length)],

        type: template.type,
        label: template.label,
        color: template.color,
        value: template.value,

        spin: Math.random() * Math.PI * 2,
        pulse: Math.random() * Math.PI * 2,
        lastRelative: undefined,
    };
}

function pickPickupTemplate(level) {
    const list = level.pickups?.items ?? [];

    if (!list.length) {
        return {
            type: 'score',
            label: 'SCORE',
            chance: 1,
            color: '#ffb000',
            value: 1000,
        };
    }

    const totalChance = list.reduce((sum, item) => sum + (item.chance ?? 1), 0);
    let roll = Math.random() * totalChance;

    for (const item of list) {
        roll -= item.chance ?? 1;

        if (roll <= 0) {
            return item;
        }
    }

    return list[0];
}

export function updatePickups(pickups, road, player, race, dt) {
    if (!pickups.enabled) {
        return;
    }

    const total = road.totalTrackLength;

    updatePickupParticles(pickups, dt);

    for (const item of pickups.items) {
        if (!item.active) {
            item.respawnDelay -= dt;

            if (item.respawnDelay <= 0) {
                respawnPickup(item, pickups, road, total);
            }

            continue;
        }

        item.spin += dt * 4.5;
        item.pulse += dt * 5.5;

        const relative = getRelativeDistance(item.position, road.offset, total);

        /*
         * Erst Sammeln prüfen, dann despawnen.
         */
        checkPickupCollect(item, relative, player, race, pickups);

        if (item.collected) {
            continue;
        }

        /*
         * Wenn das Pickup hinter uns durch ist, neu spawnen.
         */
        if (relative < 2 || relative > pickups.visibleDistance + 160) {
            item.active = false;
            item.respawnDelay = 1.2 + Math.random() * 2.2;
            item.lastRelative = undefined;
            continue;
        }

        item.lastRelative = relative;
    }
}

function checkPickupCollect(item, relative, player, race, pickups) {
    if (item.collected) {
        return;
    }

    const collectDistance = 42;

    const crossedPickup =
        item.lastRelative !== undefined &&
        item.lastRelative > collectDistance &&
        relative < collectDistance;

    const nearPlayer = relative < collectDistance || crossedPickup;
    const sameLane = Math.abs(item.lane - player.x) < 0.38;

    if (!nearPlayer || !sameLane) {
        return;
    }

    item.collected = true;
    item.active = false;
    item.respawnDelay = 2.0 + Math.random() * 3.0;
    item.lastRelative = undefined;

    spawnPickupBurst(pickups, item, player);

    if (item.type === 'boost') {
        player.boost = Math.min(100, player.boost + item.value);
        player.score += 500;
        showRaceMessage(race, `BOOST +${item.value}`, 0.9);
        return;
    }

    if (item.type === 'time') {
        race.timeLeft += item.value;
        player.score += 750;
        showRaceMessage(race, `TIME +${item.value}`, 0.9);
        return;
    }

    if (item.type === 'score') {
        player.score += item.value;
        showRaceMessage(race, `+${item.value}`, 0.9);
    }
}

function respawnPickup(item, pickups, road, totalTrackLength) {
    const lanes = road.level.pickups?.lanes ?? [-0.55, -0.18, 0.18, 0.55];
    const template = pickPickupTemplate(road.level);

    const spawnAhead =
        pickups.visibleDistance * 0.68 +
        Math.random() * pickups.visibleDistance * 0.50;

    item.position = (road.offset + spawnAhead) % totalTrackLength;
    item.lane = lanes[Math.floor(Math.random() * lanes.length)];

    item.type = template.type;
    item.label = template.label;
    item.color = template.color;
    item.value = template.value;

    item.spin = Math.random() * Math.PI * 2;
    item.pulse = Math.random() * Math.PI * 2;

    item.collected = false;
    item.active = true;
    item.respawnDelay = 0;
    item.lastRelative = undefined;
}

export function drawPickups(ctx, road, playerX, pickups, width, height) {
    if (!pickups.enabled) {
        return;
    }

    const visible = [];
    const total = road.totalTrackLength;

    for (const item of pickups.items) {
        if (!item.active) {
            continue;
        }

        const relative = getRelativeDistance(item.position, road.offset, total);

        if (relative < 8 || relative > pickups.visibleDistance) {
            continue;
        }

        const z = 1 - relative / pickups.visibleDistance;

        if (z <= 0 || z >= 1) {
            continue;
        }

        const projected = projectRoadPoint(
            road,
            playerX,
            item.lane,
            z,
            width,
            height
        );

        visible.push({
            item,
            z,
            projected,
        });
    }

    visible.sort((a, b) => a.z - b.z);

    for (const visibleItem of visible) {
        drawPickup(ctx, visibleItem.item, visibleItem.projected, visibleItem.z);
    }

    drawPickupParticles(ctx, pickups);
}

function drawPickup(ctx, item, projected, z) {
    const scale = 0.10 + Math.pow(z, 1.35) * 1.35;
    const x = projected.x;
    const y = projected.y - 22 * scale;

    const pulse = 1 + Math.sin(item.pulse) * 0.08;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(pulse, pulse);
    ctx.rotate(Math.sin(item.spin) * 0.18);

    drawPickupGlow(ctx, item, scale);
    drawPickupBody(ctx, item, scale);
    drawPickupIcon(ctx, item, scale);

    ctx.restore();
}

function drawPickupGlow(ctx, item, scale) {
    ctx.save();

    ctx.shadowColor = item.color;
    ctx.shadowBlur = 20 * scale;

    ctx.fillStyle = item.color;
    ctx.globalAlpha = 0.24;

    ctx.beginPath();
    ctx.arc(0, 0, 30 * scale, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

function drawPickupBody(ctx, item, scale) {
    ctx.save();

    const w = 52 * scale;
    const h = 34 * scale;

    ctx.fillStyle = '#070712';
    ctx.strokeStyle = item.color;
    ctx.lineWidth = Math.max(1, 3 * scale);

    ctx.shadowColor = item.color;
    ctx.shadowBlur = 12 * scale;

    roundRect(ctx, -w / 2, -h / 2, w, h, 10 * scale);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.lineWidth = Math.max(1, 1.5 * scale);
    roundRect(
        ctx,
        -w / 2 + 5 * scale,
        -h / 2 + 5 * scale,
        w - 10 * scale,
        h - 10 * scale,
        7 * scale
    );
    ctx.stroke();

    ctx.restore();
}

function drawPickupIcon(ctx, item, scale) {
    ctx.save();

    ctx.fillStyle = item.color;
    ctx.font = `bold ${Math.max(8, 15 * scale)}px Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillText(getPickupIcon(item.type), 0, 0);

    ctx.restore();
}

function getPickupIcon(type) {
    if (type === 'boost') {
        return 'B';
    }

    if (type === 'time') {
        return '+T';
    }

    if (type === 'score') {
        return '$';
    }

    return '?';
}

function spawnPickupBurst(pickups, item, player) {
    /*
     * Explosion nahe beim Spieler-Auto.
     */
    const x = 480 + player.x * 110;
    const y = 405;

    const count = item.type === 'boost' ? 26 : item.type === 'time' ? 24 : 20;
    const color = item.color;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 80 + Math.random() * 230;
        const size = 3 + Math.random() * 7;

        pickups.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 80,
            gravity: 260 + Math.random() * 120,
            life: 0.45 + Math.random() * 0.45,
            maxLife: 0.65,
            size,
            color,
            rotation: Math.random() * Math.PI * 2,
            spin: -8 + Math.random() * 16,
            type: Math.random() > 0.45 ? 'shard' : 'spark',
        });
    }

    pickups.particles.push({
        x,
        y: y - 12,
        vx: 0,
        vy: -70,
        gravity: 0,
        life: 0.75,
        maxLife: 0.75,
        size: 1,
        color,
        text: getPickupBurstText(item),
        type: 'text',
    });
}

function getPickupBurstText(item) {
    if (item.type === 'boost') {
        return `BOOST +${item.value}`;
    }

    if (item.type === 'time') {
        return `TIME +${item.value}`;
    }

    if (item.type === 'score') {
        return `+${item.value}`;
    }

    return 'BONUS';
}

function updatePickupParticles(pickups, dt) {
    for (let i = pickups.particles.length - 1; i >= 0; i--) {
        const particle = pickups.particles[i];

        particle.life -= dt;

        if (particle.life <= 0) {
            pickups.particles.splice(i, 1);
            continue;
        }

        particle.x += particle.vx * dt;
        particle.y += particle.vy * dt;
        particle.vy += particle.gravity * dt;
        particle.rotation += (particle.spin ?? 0) * dt;
    }
}

function drawPickupParticles(ctx, pickups) {
    for (const particle of pickups.particles) {
        const alpha = Math.max(0, particle.life / particle.maxLife);

        if (particle.type === 'text') {
            drawPickupBurstText(ctx, particle, alpha);
            continue;
        }

        if (particle.type === 'spark') {
            drawPickupSpark(ctx, particle, alpha);
            continue;
        }

        drawPickupShard(ctx, particle, alpha);
    }
}

function drawPickupShard(ctx, particle, alpha) {
    ctx.save();

    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);

    ctx.globalAlpha = alpha;
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 10 * alpha;

    const s = particle.size;

    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.7, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.7, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

function drawPickupSpark(ctx, particle, alpha) {
    ctx.save();

    ctx.globalAlpha = alpha;
    ctx.strokeStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 12 * alpha;
    ctx.lineWidth = Math.max(1, particle.size * 0.35);
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(
        particle.x - particle.vx * 0.035,
        particle.y - particle.vy * 0.035
    );
    ctx.stroke();

    ctx.restore();
}

function drawPickupBurstText(ctx, particle, alpha) {
    ctx.save();

    ctx.globalAlpha = alpha;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 22px Consolas, monospace';
    ctx.fillStyle = particle.color;
    ctx.shadowColor = particle.color;
    ctx.shadowBlur = 14;

    ctx.fillText(particle.text, particle.x, particle.y);

    ctx.restore();
}

function getRelativeDistance(objectPosition, playerPosition, totalTrackLength) {
    let relative = objectPosition - playerPosition;

    while (relative < 0) {
        relative += totalTrackLength;
    }

    return relative % totalTrackLength;
}

function showRaceMessage(race, text, duration = 0.9) {
    if (!race) {
        return;
    }

    race.messageText = text;
    race.messageTimer = duration;
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