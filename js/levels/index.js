import { level1 } from './level1.js';

export const levels = [
    level1,
];

export function getLevel(index = 0) {
    return levels[index] || levels[0];
}