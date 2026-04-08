/**
 * Global input state. Updated by DOM event listeners that the
 * Game class registers at boot. Game polls this state each frame.
 */

export interface MouseDelta {
  dx: number;
  dy: number;
}

export class Input {
  private keys = new Set<string>();
  private mouseDelta: MouseDelta = { dx: 0, dy: 0 };
  private mouseDownLeft = false;
  private mouseClickedLeft = false;
  private locked = false;

  constructor(private canvas: HTMLCanvasElement) {
    this.attach();
  }

  private attach(): void {
    window.addEventListener('keydown', (e) => this.keys.add(e.code));
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));

    this.canvas.addEventListener('click', () => {
      if (!this.locked) {
        this.canvas.requestPointerLock();
      }
    });

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === this.canvas;
    });

    document.addEventListener('mousemove', (e) => {
      if (this.locked) {
        this.mouseDelta.dx += e.movementX;
        this.mouseDelta.dy += e.movementY;
      }
    });

    document.addEventListener('mousedown', (e) => {
      if (e.button === 0) {
        if (!this.mouseDownLeft) this.mouseClickedLeft = true;
        this.mouseDownLeft = true;
      }
    });

    document.addEventListener('mouseup', (e) => {
      if (e.button === 0) this.mouseDownLeft = false;
    });
  }

  isDown(code: string): boolean {
    return this.keys.has(code);
  }

  /** Returns the accumulated mouse delta and resets it. */
  consumeMouseDelta(): MouseDelta {
    const d = this.mouseDelta;
    this.mouseDelta = { dx: 0, dy: 0 };
    return d;
  }

  /** True only on the frame the mouse was pressed (resets on read). */
  consumeLeftClick(): boolean {
    const c = this.mouseClickedLeft;
    this.mouseClickedLeft = false;
    return c;
  }

  isLeftDown(): boolean {
    return this.mouseDownLeft;
  }

  isLocked(): boolean {
    return this.locked;
  }
}
