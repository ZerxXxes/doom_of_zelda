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
  'translateX(-50%) rotate(35deg) scale(1.6)',    // sword — bigger + tilted right
  'translateX(-50%) rotate(15deg) scale(1.5)',    // bow — bigger + slight tilt
  'translateX(-50%) rotate(0deg)',                 // bomb — normal size
  'translateX(-50%) rotate(20deg) scale(1.5)',    // fire rod — bigger + tilt
];

const WEAPON_ATTACK_TRANSFORMS = [
  'translateX(-70%) rotate(-25deg) scale(1.6)',              // sword — swings left
  'translateX(-50%) rotate(15deg) scale(1.5) translateY(30px)',  // bow — pulls back
  'translateX(-50%) rotate(0deg) translateY(-50px)',          // bomb — tosses up
  'translateX(-40%) rotate(10deg) scale(1.65)',               // fire rod — jabs forward
];

export class Hud {
  private root: HTMLElement;
  private heartsEl: HTMLElement;
  private magicFillEl: HTMLElement;
  private magicBgEl: HTMLImageElement;
  private weaponBoxEl: HTMLImageElement;
  private weaponIconEl: HTMLImageElement;
  private rupeeEl: HTMLElement;
  private keyEl: HTMLElement;
  private arrowEl: HTMLElement;
  private bombEl: HTMLElement;
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
  private bowEmptyImage = '';
  private bowReloadTimer = 0;
  private heartFullUrl = '';
  private heartHalfUrl = '';
  private weaponIconUrls: string[] = [];
  private weaponBoxUrl = '';
  private magicMeterUrl = '';
  private rupeeIconUrl = '';
  private bombCountIconUrl = '';
  private arrowCountIconUrl = '';
  private keyCountIconUrl = '';
  private rupeeIconEl!: HTMLImageElement;
  private bombCountIconEl!: HTMLImageElement;
  private arrowCountIconEl!: HTMLImageElement;
  private keyCountIconEl!: HTMLImageElement;

  constructor() {
    this.root = document.getElementById('hud-root')!;
    while (this.root.firstChild) this.root.removeChild(this.root.firstChild);

    const bar = el('div', 'hud-bar');

    // 1. Magic meter
    const magicContainer = el('div', 'hud-magic-container');
    this.magicBgEl = document.createElement('img');
    this.magicBgEl.className = 'hud-magic-bg';
    magicContainer.appendChild(this.magicBgEl);
    this.magicFillEl = el('div', 'hud-magic-fill');
    magicContainer.appendChild(this.magicFillEl);
    bar.appendChild(magicContainer);

    // 2. Weapon select box
    const weaponContainer = el('div', 'hud-weapon-box-container');
    this.weaponBoxEl = document.createElement('img');
    this.weaponBoxEl.className = 'hud-weapon-box-bg';
    weaponContainer.appendChild(this.weaponBoxEl);
    this.weaponIconEl = document.createElement('img');
    this.weaponIconEl.className = 'hud-weapon-icon';
    weaponContainer.appendChild(this.weaponIconEl);
    bar.appendChild(weaponContainer);

    // 3-6. Counter stack (rupees, bombs, arrows, keys)
    const countersStack = el('div', 'hud-counters-stack');

    // Helper to create one counter row: icon + value span
    const makeCounter = (_fieldName: string): { icon: HTMLImageElement; value: HTMLElement } => {
      const row = el('div', 'hud-counter-item');
      const icon = document.createElement('img');
      icon.className = 'hud-counter-icon';
      row.appendChild(icon);
      const value = el('span', 'hud-counter-value', '0');
      row.appendChild(value);
      countersStack.appendChild(row);
      return { icon, value };
    };

    const rupeeCounter = makeCounter('rupee');
    this.rupeeIconEl = rupeeCounter.icon;
    this.rupeeEl = rupeeCounter.value;

    const bombCounter = makeCounter('bomb');
    this.bombCountIconEl = bombCounter.icon;
    this.bombEl = bombCounter.value;

    const arrowCounter = makeCounter('arrow');
    this.arrowCountIconEl = arrowCounter.icon;
    this.arrowEl = arrowCounter.value;

    const keyCounter = makeCounter('key');
    this.keyCountIconEl = keyCounter.icon;
    this.keyEl = keyCounter.value;

    bar.appendChild(countersStack);

    // 7. Hearts
    this.heartsEl = el('div', 'hud-hearts');
    bar.appendChild(this.heartsEl);

    // Rest of HUD (viewmodel, prompt, etc.)
    this.viewmodelEl = el('div', 'hud-viewmodel');
    this.promptEl = el('div', 'hud-prompt', 'Press E to open');
    this.promptEl.style.display = 'none';
    this.lockedFlashEl = el('div', 'hud-locked-flash', 'LOCKED');
    this.lockedFlashEl.style.display = 'none';
    this.vignetteEl = el('div', 'hud-damage-vignette');

    this.root.appendChild(bar);
    this.root.appendChild(this.viewmodelEl);
    this.root.appendChild(this.promptEl);
    this.root.appendChild(this.lockedFlashEl);
    this.root.appendChild(this.vignetteEl);
  }

  update(dt: number, player: Player, doorPromptVisible: boolean): void {
    this.renderHearts(player.health, player.maxHealth);

    // Magic fill: height proportional to magic/maxMagic, growing from bottom
    const magicPct = player.magic / player.maxMagic;
    this.magicFillEl.style.height = `${Math.round(magicPct * 102)}px`;

    this.rupeeEl.textContent = '0'; // rupees not tracked yet
    this.bombEl.textContent = String(player.bombs);
    this.arrowEl.textContent = String(player.arrows);
    this.keyEl.textContent = player.hasSmallKey ? '1' : '0';

    if (this.weaponIconUrls.length > 0) {
      this.weaponIconEl.src = this.weaponIconUrls[player.currentWeapon];
    }

    // Attack animation timer
    if (this.attackTimer > 0) {
      this.attackTimer -= dt;
      if (this.attackTimer <= 0) {
        this.attackTimer = 0;
        this.currentAttackWeapon = -1;
      }
    }

    // Bow reload timer: show empty bow after firing, then swap back
    if (this.bowReloadTimer > 0) {
      this.bowReloadTimer -= dt;
    }

    // Viewmodel: set weapon image and transform
    if (this.weaponImages.length > 0) {
      const idx = player.currentWeapon;
      // Show empty bow sprite while reloading, normal sprite otherwise
      const useBowEmpty = idx === 1 && this.bowReloadTimer > 0 && this.attackTimer <= 0 && this.bowEmptyImage;
      this.viewmodelEl.style.backgroundImage = `url(${useBowEmpty ? this.bowEmptyImage : this.weaponImages[idx]})`;
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
    this.attackTimer = 0.15;
    this.currentAttackWeapon = weaponSlot;
    this.viewmodelEl.style.transform = WEAPON_ATTACK_TRANSFORMS[weaponSlot] ?? WEAPON_ATTACK_TRANSFORMS[0];
    // Bow: after the pull-back, show empty bow for a reload period
    if (weaponSlot === 1) {
      this.bowReloadTimer = 0.5;
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

  async loadHudSprites(): Promise<void> {
    // Weapon viewmodel sprites (for the held weapon at bottom of screen)
    const viewmodelUrls = [
      'sprites/weapon_lvl1_sword.png',
      'sprites/weapon_lvl1_bow.png',
      'sprites/weapon_bomb.png',
      'sprites/weapon_fire_rod.png',
    ];
    this.weaponImages = await Promise.all(viewmodelUrls.map((url) => colorKeyToDataURL(url)));
    this.bowEmptyImage = await colorKeyToDataURL('sprites/weapon_bow_empty.png');

    // HUD icon sprites
    this.heartFullUrl = await colorKeyToDataURL('sprites/full_heart_icon.png');
    this.heartHalfUrl = await colorKeyToDataURL('sprites/half_heart_icon.png');
    this.weaponBoxUrl = await colorKeyToDataURL('sprites/weapon_select_box.png');
    this.magicMeterUrl = await colorKeyToDataURL('sprites/magic_meter.png');
    const iconUrls = [
      'sprites/lvl1_sword_icon.png',
      'sprites/bow_icon.png',
      'sprites/bomb_icon.png',
      'sprites/fire_rod_icon.png',
    ];
    this.weaponIconUrls = await Promise.all(iconUrls.map((url) => colorKeyToDataURL(url)));

    // Counter icon sprites
    this.rupeeIconUrl = await colorKeyToDataURL('sprites/rupees_count_icon.png');
    this.bombCountIconUrl = await colorKeyToDataURL('sprites/bomb_count_icon.png');
    this.arrowCountIconUrl = await colorKeyToDataURL('sprites/arrow_count_icon.png');
    this.keyCountIconUrl = await colorKeyToDataURL('sprites/key_count_icon.png');

    // Set background images now that sprites are loaded
    this.magicBgEl.src = this.magicMeterUrl;
    this.weaponBoxEl.src = this.weaponBoxUrl;
    this.rupeeIconEl.src = this.rupeeIconUrl;
    this.bombCountIconEl.src = this.bombCountIconUrl;
    this.arrowCountIconEl.src = this.arrowCountIconUrl;
    this.keyCountIconEl.src = this.keyCountIconUrl;
  }

  private renderHearts(health: number, maxHealth: number): void {
    while (this.heartsEl.firstChild) this.heartsEl.removeChild(this.heartsEl.firstChild);
    if (!this.heartFullUrl) return; // sprites not loaded yet
    const totalHearts = maxHealth / 2;
    for (let i = 0; i < totalHearts; i++) {
      const filledHalves = Math.max(0, Math.min(2, health - i * 2));
      const img = document.createElement('img');
      img.className = 'hud-heart-icon';
      if (filledHalves === 2) {
        img.src = this.heartFullUrl;
      } else if (filledHalves === 1) {
        img.src = this.heartHalfUrl;
      } else {
        img.src = this.heartFullUrl; // show dimmed full heart as "empty slot"
        img.style.opacity = '0.2';
      }
      this.heartsEl.appendChild(img);
    }
  }
}
