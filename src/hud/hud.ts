import { Player } from '../entities/player';

function el(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

export class Hud {
  private root: HTMLElement;
  private heartsEl: HTMLElement;
  private magicFillEl: HTMLElement;
  private keyEl: HTMLElement;
  private arrowEl: HTMLElement;
  private bombEl: HTMLElement;
  private weaponEl: HTMLElement;
  private viewmodelEl: HTMLElement;
  private promptEl: HTMLElement;
  private lockedFlashEl: HTMLElement;
  private vignetteEl: HTMLElement;
  private diedEl: HTMLElement | null = null;
  private wonEl: HTMLElement | null = null;
  private lockedFlashTimer = 0;

  constructor() {
    this.root = document.getElementById('hud-root')!;
    while (this.root.firstChild) this.root.removeChild(this.root.firstChild);

    const bar = el('div', 'hud-bar');
    this.heartsEl = el('div', 'hud-hearts');
    bar.appendChild(this.heartsEl);

    const magicBar = el('div', 'hud-magic-bar');
    this.magicFillEl = el('div', 'hud-magic-fill');
    magicBar.appendChild(this.magicFillEl);
    bar.appendChild(magicBar);

    const counters = el('div', 'hud-counters');
    const keyCounter = el('div', 'hud-counter', 'K:');
    this.keyEl = el('span', undefined, '0');
    keyCounter.appendChild(this.keyEl);
    const arrowCounter = el('div', 'hud-counter', 'A:');
    this.arrowEl = el('span', undefined, '0');
    arrowCounter.appendChild(this.arrowEl);
    const bombCounter = el('div', 'hud-counter', 'B:');
    this.bombEl = el('span', undefined, '0');
    bombCounter.appendChild(this.bombEl);
    counters.appendChild(keyCounter);
    counters.appendChild(arrowCounter);
    counters.appendChild(bombCounter);
    bar.appendChild(counters);

    this.weaponEl = el('div', 'hud-weapon', 'Sword');
    this.viewmodelEl = el('div', 'hud-viewmodel sword');
    this.promptEl = el('div', 'hud-prompt', 'Press E to open');
    this.promptEl.style.display = 'none';
    this.lockedFlashEl = el('div', 'hud-locked-flash', 'LOCKED');
    this.lockedFlashEl.style.display = 'none';
    this.vignetteEl = el('div', 'hud-damage-vignette');

    this.root.appendChild(bar);
    this.root.appendChild(this.weaponEl);
    this.root.appendChild(this.viewmodelEl);
    this.root.appendChild(this.promptEl);
    this.root.appendChild(this.lockedFlashEl);
    this.root.appendChild(this.vignetteEl);
  }

  update(dt: number, player: Player, doorPromptVisible: boolean): void {
    this.renderHearts(player.health, player.maxHealth);
    this.magicFillEl.style.width = `${(player.magic / player.maxMagic) * 100}%`;
    this.keyEl.textContent = player.hasSmallKey ? '1' : '0';
    this.arrowEl.textContent = String(player.arrows);
    this.bombEl.textContent = String(player.bombs);
    this.weaponEl.textContent = ['Sword', 'Bow', 'Bombs', 'Fire Rod'][player.currentWeapon];
    this.viewmodelEl.className = `hud-viewmodel ${['sword', 'bow', 'bombs', 'fire-rod'][player.currentWeapon]}`;
    this.promptEl.style.display = doorPromptVisible ? 'block' : 'none';

    if (this.lockedFlashTimer > 0) {
      this.lockedFlashTimer -= dt;
      this.lockedFlashEl.style.display = this.lockedFlashTimer > 0 ? 'block' : 'none';
    }

    if (player.iframesRemaining > 0) {
      this.vignetteEl.classList.add('flash');
    } else {
      this.vignetteEl.classList.remove('flash');
    }
  }

  showLocked(): void {
    this.lockedFlashTimer = 1.0;
    this.lockedFlashEl.style.display = 'block';
  }

  showDied(onRestart: () => void): void {
    if (this.diedEl) return;
    this.diedEl = el('div', 'hud-died');
    const label = el('div', undefined, 'YOU DIED');
    const btn = el('button', undefined, 'RESTART') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      onRestart();
      this.hideDied();
    });
    this.diedEl.appendChild(label);
    this.diedEl.appendChild(btn);
    this.root.appendChild(this.diedEl);
  }

  hideDied(): void {
    if (this.diedEl) {
      this.diedEl.remove();
      this.diedEl = null;
    }
  }

  showWon(onRestart: () => void): void {
    if (this.wonEl) return;
    this.wonEl = el('div', 'hud-died'); // reuse the same overlay style
    const label = el('div', undefined, 'YOU WIN');
    label.style.color = '#ffd700'; // gold instead of red
    const btn = el('button', undefined, 'PLAY AGAIN') as HTMLButtonElement;
    btn.addEventListener('click', () => {
      onRestart();
      this.hideWon();
    });
    this.wonEl.appendChild(label);
    this.wonEl.appendChild(btn);
    this.root.appendChild(this.wonEl);
  }

  hideWon(): void {
    if (this.wonEl) {
      this.wonEl.remove();
      this.wonEl = null;
    }
  }

  private renderHearts(health: number, maxHealth: number): void {
    while (this.heartsEl.firstChild) this.heartsEl.removeChild(this.heartsEl.firstChild);
    const totalHearts = maxHealth / 2;
    for (let i = 0; i < totalHearts; i++) {
      const filledHalves = Math.max(0, Math.min(2, health - i * 2));
      const cls = filledHalves === 2 ? 'hud-heart' : filledHalves === 1 ? 'hud-heart half' : 'hud-heart empty';
      this.heartsEl.appendChild(el('div', cls));
    }
  }
}
