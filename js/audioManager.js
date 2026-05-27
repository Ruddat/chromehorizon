const tracks = new Map();

let currentMusicKey = null;
let masterVolume = 1;
let musicEnabled = true;
let audioUnlocked = false;

export function initAudioManager() {
    const unlock = () => {
        audioUnlocked = true;

        window.removeEventListener('keydown', unlock);
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('keydown', unlock);
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('touchstart', unlock);
}

export function registerMusic(key, src, options = {}) {
    if (tracks.has(key)) {
        return tracks.get(key);
    }

    const audio = new Audio(src);

    audio.loop = options.loop ?? true;
    audio.volume = options.volume ?? 0.5;
    audio.preload = 'auto';

    tracks.set(key, {
        key,
        src,
        audio,
        baseVolume: options.volume ?? 0.5,
    });

    return tracks.get(key);
}

export async function playMusic(key, options = {}) {
    if (!musicEnabled || !audioUnlocked) {
        return;
    }

    const track = tracks.get(key);

    if (!track) {
        console.warn(`Music track nicht registriert: ${key}`);
        return;
    }

    if (currentMusicKey === key && !track.audio.paused) {
        return;
    }

    stopCurrentMusic();

    currentMusicKey = key;

    const volume = options.volume ?? track.baseVolume;
    track.audio.volume = clamp(volume * masterVolume, 0, 1);
    track.audio.currentTime = options.restart ? 0 : track.audio.currentTime;

    try {
        await track.audio.play();
    } catch (error) {
        console.warn('Musik konnte nicht gestartet werden:', error);
    }
}

export function stopCurrentMusic() {
    if (!currentMusicKey) {
        return;
    }

    const track = tracks.get(currentMusicKey);

    if (track) {
        track.audio.pause();
    }

    currentMusicKey = null;
}

export function pauseMusic() {
    if (!currentMusicKey) {
        return;
    }

    const track = tracks.get(currentMusicKey);

    if (track) {
        track.audio.pause();
    }
}

export async function resumeMusic() {
    if (!currentMusicKey || !audioUnlocked || !musicEnabled) {
        return;
    }

    const track = tracks.get(currentMusicKey);

    if (!track) {
        return;
    }

    try {
        await track.audio.play();
    } catch (error) {
        console.warn('Musik konnte nicht fortgesetzt werden:', error);
    }
}

export function setMasterVolume(value) {
    masterVolume = clamp(value, 0, 1);

    for (const track of tracks.values()) {
        track.audio.volume = clamp(track.baseVolume * masterVolume, 0, 1);
    }
}

export function setMusicEnabled(enabled) {
    musicEnabled = Boolean(enabled);

    if (!musicEnabled) {
        stopCurrentMusic();
    }
}

export function isAudioUnlocked() {
    return audioUnlocked;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}