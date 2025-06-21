import { Graphics, Text, Container } from 'pixi.js';

export class PixiButton extends Container {
  private hoverTint: number | null = null;
  private originalTint: number;

  public addHoverEffect(tintColor: number) {
    this.hoverTint = tintColor;
    this.originalTint = this.children[0].tint;
    
    this.interactive = true;
    this.on('pointerover', () => {
      if (this.hoverTint !== null) {
        this.children.forEach(child => {
          child.tint = this.hoverTint as number;
        });
      }
    });
    
    this.on('pointerout', () => {
      if (this.hoverTint !== null) {
        this.children.forEach(child => {
          child.tint = this.originalTint;
        });
      }
    });
  }
  private background: Graphics;
  private buttonLabel: Text;
  private defaultColor: number;
  private hoverColor: number;
  private pressedColor: number;
  private onClickHandler: () => void;

  constructor(
    text: string,
    width: number,
    height: number,
    defaultColor: number = 0x007bff,
    hoverColor: number = 0x0056b3,
    pressedColor: number = 0x004085,
    textColor: number = 0xffffff
  ) {
    super();
    this.defaultColor = defaultColor;
    this.hoverColor = hoverColor;
    this.pressedColor = pressedColor;

    this.background = new Graphics();
    this.addChild(this.background);

    this.buttonLabel = new Text(text, {
      fill: textColor,
      fontSize: 18,
      align: 'center',
    });
    this.buttonLabel.anchor.set(0.5);
    this.addChild(this.buttonLabel);

    this.draw(this.defaultColor, width, height);
    this.buttonLabel.position.set(width / 2, height / 2);

    this.interactive = true;
    this.cursor = 'pointer';

    this.on('pointerover', this.onPointerOver)
        .on('pointerout', this.onPointerOut)
        .on('pointerdown', this.onPointerDown)
        .on('pointerup', this.onPointerUp)
        .on('pointerupoutside', this.onPointerUpOutside);
  }

  private draw(color: number, width: number, height: number) {
    this.background.clear();
    this.background.beginFill(color);
    this.background.drawRoundedRect(0, 0, width, height, 8);
    this.background.endFill();
  }

  private onPointerOver() {
    this.draw(this.hoverColor, this.background.width, this.background.height);
  }

  private onPointerOut() {
    this.draw(this.defaultColor, this.background.width, this.background.height);
  }

  private onPointerDown() {
    this.draw(this.pressedColor, this.background.width, this.background.height);
  }

  private onPointerUp() {
    this.draw(this.hoverColor, this.background.width, this.background.height);
    if (this.onClickHandler) {
      this.onClickHandler();
    }
  }

  private onPointerUpOutside() {
    this.draw(this.defaultColor, this.background.width, this.background.height);
  }

  public setOnClick(handler: () => void) {
    this.onClickHandler = handler;
  }

  public get width(): number {
    return this.background.width;
  }

  public get height(): number {
    return this.background.height;
  }
}