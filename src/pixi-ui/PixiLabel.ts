import { Text, Container } from 'pixi.js';

export class PixiLabel extends Container {
  private labelText: Text;

  constructor(
    text: string,
    textColor: number = 0xffffff,
    fontSize: number = 18,
    align: 'left' | 'center' | 'right' = 'left'
  ) {
    super();

    this.labelText = new Text(text, {
      fill: textColor,
      fontSize: fontSize,
      align: align,
    });
    this.addChild(this.labelText);
  }

  set text(value: string) {
    this.labelText.text = value;
  }

  get text(): string {
    return this.labelText.text;
  }

  public get width(): number {
    return this.labelText.width;
  }

  public get height(): number {
    return this.labelText.height;
  }
}