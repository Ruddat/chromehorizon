export const GameState = {
    TITLE: 'title',
    RACE: 'race',
    GAME_OVER: 'game_over',
};

let currentState = GameState.TITLE;

export function getGameState() {
    return currentState;
}

export function setGameState(state) {
    currentState = state;
}