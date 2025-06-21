import { Graphics, Text, Container } from 'pixi.js';

export class PixiTextField extends Container {
  private background: Graphics;
  private textDisplay: Text;
  private _text: string = '';
  private _placeholder: string;
  private _isFocused: boolean = false;

  constructor(
    width: number,
    height: number,
    placeholder: string = '',
    backgroundColor: number = 0x333333,
    borderColor: number = 0x666666,
    textColor: number = 0xffffff,
    placeholderColor: number = 0xaaaaaa
  ) {
    super();
    this._placeholder = placeholder;

    this.background = new Graphics();
    this.addChild(this.background);

    this.textDisplay = new Text(this._placeholder, {
      fill: placeholderColor,
      fontSize: 18,
      wordWrap: false,
      trim: true,
    });
    this.textDisplay.position.set(5, height / 2 - this.textDisplay.height / 2);
    this.addChild(this.textDisplay);

    this.draw(backgroundColor, borderColor, width, height);

    this.interactive = true;
    this.cursor = 'text';

    this.on('pointerdown', this.onPointerDown);

    // Listen for keyboard input globally
    window.addEventListener('keydown', this.onKeyDown);
  }

  private draw(backgroundColor: number, borderColor: number, width: number, height: number) {
    this.background.clear();
    this.background.beginFill(backgroundColor);
    this.background.drawRoundedRect(0, 0, width, height, 8);
    this.background.endFill();
    this.background.lineStyle(2, borderColor);
    this.background.drawRoundedRect(0, 0, width, height, 8);
  }

  private onPointerDown() {
    this.focus();
  }

  private onKeyDown = (event: KeyboardEvent) => {
    if (!this._isFocused) return;

    if (event.key === 'Backspace') {
      this.text = this.text.slice(0, -1);
    } else if (event.key.length === 1) { // Only allow single character input
      this.text += event.key;
    }
  };

  public focus() {
    if (this._isFocused) return;
    this._isFocused = true;
    this.textDisplay.text = this._text; // Show actual text when focused
    this.textDisplay.style.fill = 0xffffff; // Change color to active text color
    // You might want to add a visual indicator for focus, e.g., a different border color
    this.draw(0x333333, 0x007bff, this.background.width, this.background.height); // Blue border when focused
  }

  public blur() {
    if (!this._isFocused) return;
    this._isFocused = false;
    if (this._text === '') {
      this.textDisplay.text = this._placeholder;
      this.textDisplay.style.fill = 0xaaaaaa; // Revert to placeholder color
    }
    this.draw(0x333333, 0x666666, this.background.width, this.background.height); // Revert to default border color
  }

  set text(value: string) {
    this._text = value;
    this.textDisplay.text = value === '' && !this._isFocused ? this._placeholder : value;
    this.textDisplay.style.fill = value === '' && !this._isFocused ? 0xaaaaaa : 0xffffff;
  }

  get text(): string {
    return this._text;
  }

  public get width(): number {
    return this.background.width;
  }

  public get height(): number {
    return this.background.height;
  }

  public destroy(options?: boolean | { children?: boolean; texture?: boolean; baseTexture?: boolean; }): void {
    window.removeEventListener('keydown', this.onKeyDown);
    super.destroy(options);
  }
}