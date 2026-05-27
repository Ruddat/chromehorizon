export const level1 = {
    id: 'coastal-neonway',
    name: 'Coastal Neonway',

    music: {
        race: 'assets/audio/level1-theme.mp3',
        volume: 0.45,
    },

    assets: [
        { key: 'background.level1', src: 'assets/backgrounds/coastal-sunset.png' },
        { key: 'player.car', src: 'assets/cars/player-car.png' },
    ],

    timeLimit: 60,
    checkpointEveryKm: 40.5,

    road: {
        horizon: 285,
        segments: 140,
        baseWidth: 700,
        curveStrength: 0.55,
        hillStrength: 0.55,
        viewDistance: 520,
        roadsideSpacing: 48,
    },

traffic: {
    enabled: true,
    density: 7,
    spawnDistance: 620,
    minSpacing: 55,
    lanes: [-0.55, -0.18, 0.18, 0.55],

    cars: [
        {
            type: 'sport',
            colorA: '#20f7ff',
            colorB: '#0b1024',
            worldSpeed: 22,
        },
        {
            type: 'coupe',
            colorA: '#ff2bd6',
            colorB: '#210822',
            worldSpeed: 18,
        },
        {
            type: 'sedan',
            colorA: '#ffb000',
            colorB: '#211400',
            worldSpeed: 14,
        },
    ],
},

pickups: {
    enabled: true,

    density: 7,
    spawnDistance: 680,
    minSpacing: 80,

    lanes: [-0.55, -0.18, 0.18, 0.55],

    items: [
        {
            type: 'boost',
            label: 'BOOST',
            chance: 0.45,
            color: '#20f7ff',
            value: 35,
        },
        {
            type: 'time',
            label: 'TIME',
            chance: 0.25,
            color: '#ff2bd6',
            value: 5,
        },
        {
            type: 'score',
            label: 'SCORE',
            chance: 0.30,
            color: '#ffb000',
            value: 1500,
        },
    ],
},


    track: [
        { length: 150, curve: 0.00, hill: 0.00 },
        { length: 90, curve: 0.18, hill: 0.10 },
        { length: 90, curve: 0.42, hill: 0.35 },
        { length: 70, curve: 0.22, hill: 0.50 },

        { length: 140, curve: 0.00, hill: -0.25 },

        { length: 100, curve: -0.28, hill: -0.10 },
        { length: 110, curve: -0.62, hill: 0.15 },
        { length: 80, curve: -0.25, hill: 0.40 },

        { length: 160, curve: 0.00, hill: 0.00 },

        { length: 90, curve: 0.80, hill: -0.35 },
        { length: 90, curve: -0.80, hill: -0.35 },

        { length: 170, curve: 0.00, hill: 0.20 },
    ],

    palette: {
        skyTop: '#05051a',
        skyMid: '#251060',
        skyBottom: '#ff2b88',

        mountain: '#08071b',
        skyline: '#090820',

        groundA: '#090927',
        groundB: '#0d0a34',

        roadA: '#171725',
        roadB: '#10101c',

        neonA: '#ff2bd6',
        neonB: '#20f7ff',

        textMain: '#ffffff',
        textAccent: '#20f7ff',
        textHot: '#ff2bd6',
    },
};