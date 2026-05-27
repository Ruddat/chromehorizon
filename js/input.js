const keys = {};

export function initInput() {
    window.addEventListener('keydown', (event) => {
        keys[event.code] = true;
    });

    window.addEventListener('keyup', (event) => {
        keys[event.code] = false;
    });
}

export function isDown(code) {
    return Boolean(keys[code]);
}

export function anyDown(codes) {
    return codes.some((code) => isDown(code));
}