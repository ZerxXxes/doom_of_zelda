import { Player } from '../entities/player';

function el(tag: string, className?: string, text?: string): HTMLElement {
  const e = document.createElement(tag);
  if (className) e.className = className;
  if (text !== undefined) e.textContent = text;
  return e;
}

function colorKeyToDataURL(url: string, keyR = 255, keyG = 0, keyB = 255, tolerance = 16): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('no 2d context')); return; }
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;
      for (let i = 0; i < px.length; i += 4) {
        if (Math.abs(px[i] - keyR) <= tolerance && Math.abs(px[i + 1] - keyG) <= tolerance && Math.abs(px[i + 2] - keyB) <= tolerance) {
          px[i + 3] = 0;
        }
      }
      ctx.putImageData(data, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = () => reject(new Error(`Failed to load ${url}`));
    img.src = url;
  });
}

const WEAPON_BASE_TRANSFORMS = [
  'translateX(-50%) rotate(35deg)',    // sword — tilted right
  'translateX(-50%) rotate(15deg)',    // bow — slight tilt
  'translateX(-50%) rotate(0deg)',     // bomb — upright
  'translateX(-50%) rotate(20deg)',    // fire rod — moderate tilt
];

const WEAPON_ATTACK_TRANSFORMS = [
  'translateX(-70%) rotate(-25deg)',   // sword — swings left (slash)
  'translateX(-50%) rotate(15deg) translateY(20px)',  // bow — pulls down (draw)
  'translateX(-50%) rotate(0deg) translateY(-50px)',  // bomb — tosses up
  'translateX(-40%) rotate(10deg) scale(1.15)',       // fire rod — jabs forward
];

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
  private attackTimer = 0;
  private currentAttackWeapon = -1;
  private weaponImages: string[] = [];

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
    this.viewmodelEl = el('div', 'hud-viewmodel');
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
    // Attack animation timer
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = 0;
        this.currentAttackWeapon = -1;
      }
    }

    // Viewmodel: set weapon image and transform
    if (this.weaponImages.length > 0) {
      const idx = player.currentWeapon;
      this.viewmodelEl.style.backgroundImage = `url(${this.weaponImages[idx]})`;
      this.viewmodelEl.style.backgroundSize = 'contain';
      this.viewmodelEl.style.backgroundRepeat = 'no-repeat';
      this.viewmodelEl.style.backgroundPosition = 'center bottom';
    }
    // Only set base transform when NOT in attack animation (CSS transition handles the swing back)
    if (this.attackTimer <= 0) {
      this.viewmodelEl.style.transform = WEAPON_BASE_TRANSFORMS[player.currentWeapon] ?? WEAPON_BASE_TRANSFORMS[0];
    } else {
      // Keep showing the attack transform for the weapon that triggered it
      const slot = this.currentAttackWeapon;
      this.viewmodelEl.style.transform = WEAPON_ATTACK_TRANSFORMS[slot] ?? WEAPON_ATTACK_TRANSFORMS[0];
    }
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

  triggerAttack(weaponSlot: number): void {
    this.attackTimer = 0.15; // duration of the attack swing
    this.currentAttackWeapon = weaponSlot;
    this.viewmodelEl.style.transform = WEAPON_ATTACK_TRANSFORMS[weaponSlot] ?? WEAPON_ATTACK_TRANSFORMS[0];
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

  async loadWeaponSprites(): Promise<void> {
    const urls = [
      'sprites/weapon_lvl1_sword.png',
      'sprites/weapon_lvl1_bow.png',
      'sprites/weapon_bomb.png',
      'sprites/weapon_fire_rod.png',
    ];
    this.weaponImages = await Promise.all(urls.map((url) => colorKeyToDataURL(url)));
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
