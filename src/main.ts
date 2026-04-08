import { Game } from './game';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const game = new Game(canvas);
game.start().catch((e) => {
  console.error('Failed to start game:', e);
});
