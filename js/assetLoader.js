const images = new Map();

export async function loadImage(key, src) {
    return new Promise((resolve) => {
        const image = new Image();

        image.onload = () => {
            images.set(key, image);
            resolve(image);
        };

        image.onerror = () => {
            console.warn(`Asset konnte nicht geladen werden: ${src}`);
            resolve(null);
        };

        image.src = src;
    });
}

export async function loadAssets(assetList = []) {
    const jobs = assetList.map((asset) => loadImage(asset.key, asset.src));
    await Promise.all(jobs);
}

export function hasImage(key) {
    return images.has(key);
}

export function getImage(key) {
    return images.get(key) || null;
}