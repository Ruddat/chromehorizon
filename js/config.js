export const CONFIG = {
    title: 'CHROME HORIZON',
    subtitle: 'NEON ROAD ARCADE',

    canvas: {
        width: 960,
        height: 540,
    },

    graphics: {
        useImageAssets: true,
        fallbackToCanvas: true,
        glow: true,
    },

    player: {
        maxSpeed: 280,
        boostMaxSpeed: 360,
        acceleration: 180,
        brakePower: 220,
        friction: 70,
        steerStrength: 1.65,
    },

    debug: {
        showHitboxes: false,
    },
};