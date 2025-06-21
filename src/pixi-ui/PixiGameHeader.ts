import { Container, Text, Graphics, DisplayObject as PIXIDisplayObject } from 'pixi.js';
import { PixiButton } from './PixiButton';
import { PixiLabel } from './PixiLabel';

export class PixiGameHeader extends Container {
  private moneyLabel: PixiLabel;
  private reputationLabel: PixiLabel;
  private dayLabel: PixiLabel;
  private settingsButton: PixiButton;
  private fullscreenButton: PixiButton;
  private tooltipContainer: Container;
  private currentTooltip: Graphics | Text | null = null;

  constructor(width: number, height: number) {
    super();

    // Background for the header
    const background = new Graphics();
    background.beginFill(0x1a1a1a, 0.9);
    background.drawRect(0, 0, width, height);
    background.endFill();
    this.addChild(background);

    // Tooltip container
    this.tooltipContainer = new Container();
    this.tooltipContainer.visible = false;
    this.addChild(this.tooltipContainer);

    // Money Label with hover effect
    this.moneyLabel = new PixiLabel('$0', 0x00ff00, 18, 'left');
    this.moneyLabel.position.set(20, height / 2 - this.moneyLabel.height / 2);
    this.moneyLabel.interactive = true;
    this.moneyLabel.on('pointerover', () => this.showTooltip('Current Money', this.moneyLabel));
    this.moneyLabel.on('pointerout', () => this.hideTooltip());
    this.addChild(this.moneyLabel);

    // Reputation Label with hover effect
    this.reputationLabel = new PixiLabel('0 Rep', 0x00aaff, 18, 'left');
    this.reputationLabel.position.set(this.moneyLabel.x + this.moneyLabel.width + 40, height / 2 - this.reputationLabel.height / 2);
    this.reputationLabel.interactive = true;
    this.reputationLabel.on('pointerover', () => this.showTooltip('Current Reputation', this.reputationLabel));
    this.reputationLabel.on('pointerout', () => this.hideTooltip());
    this.addChild(this.reputationLabel);

    // Day Label with hover effect
    this.dayLabel = new PixiLabel('Day 1', 0xffff00, 18, 'left');
    this.dayLabel.position.set(this.reputationLabel.x + this.reputationLabel.width + 40, height / 2 - this.dayLabel.height / 2);
    this.dayLabel.interactive = true;
    this.dayLabel.on('pointerover', () => this.showTooltip('Current Day', this.dayLabel));
    this.dayLabel.on('pointerout', () => this.hideTooltip());
    this.addChild(this.dayLabel);

    // Settings Button with enhanced styling
    this.settingsButton = new PixiButton('⚙️', 40, 40, 0x333333, 0x555555, 0x222222, 0xffffff);
    this.settingsButton.position.set(width - 100, height / 2 - this.settingsButton.height / 2);
    this.settingsButton.setOnClick(() => console.log('Settings clicked!'));
    this.settingsButton.addHoverEffect(0x444444);
    this.addChild(this.settingsButton);

    // Fullscreen Button with enhanced styling
    this.fullscreenButton = new PixiButton('↔️', 40, 40, 0x333333, 0x555555, 0x222222, 0xffffff);
    this.fullscreenButton.position.set(width - 50, height / 2 - this.fullscreenButton.height / 2);
    this.fullscreenButton.setOnClick(() => console.log('Fullscreen clicked!'));
    this.fullscreenButton.addHoverEffect(0x444444);
    this.addChild(this.fullscreenButton);
  }

  public update(gameState: any) {
    this.moneyLabel.text = `$${gameState.money.toLocaleString()}`;
    this.reputationLabel.text = `${gameState.reputation.toLocaleString()} Rep`;
    this.dayLabel.text = `Day ${gameState.currentDay}`;
    
    // Update tooltip positions if visible
    if (this.currentTooltip) {
      this.positionTooltip(this.currentTooltip);
    }
  }

  private showTooltip(text: string, target: PIXIDisplayObject) {
    this.hideTooltip();
    
    // Create tooltip background
    const tooltipBg = new Graphics();
    tooltipBg.beginFill(0x1a1a1a, 0.95);
    tooltipBg.drawRoundedRect(0, 0, 150, 30, 4);
    tooltipBg.endFill();
    
    // Create tooltip text
    const tooltipText = new Text(text, {
      fontFamily: 'Arial',
      fontSize: 14,
      fill: 0xffffff,
      align: 'center'
    });
    tooltipText.position.set(75, 15);
    tooltipText.anchor.set(0.5);
    
    this.currentTooltip = tooltipBg;
    this.tooltipContainer.addChild(tooltipBg);
    this.tooltipContainer.addChild(tooltipText);
    this.positionTooltip(target);
    this.tooltipContainer.visible = true;
  }

  private hideTooltip() {
    this.tooltipContainer.removeChildren();
    this.tooltipContainer.visible = false;
    this.currentTooltip = null;
  }

  private positionTooltip(target: PIXIDisplayObject) {
    if (!this.currentTooltip) return;
    
    const targetBounds = target.getBounds();
    this.tooltipContainer.position.set(
      targetBounds.x + targetBounds.width / 2 - 75,
      targetBounds.y - 40
    );
  }

  public setOnSettingsClick(handler: () => void) {
    this.settingsButton.setOnClick(handler);
  }

  public setOnFullscreenClick(handler: () => void) {
    this.fullscreenButton.setOnClick(handler);
  }

  public resize(newWidth: number, newHeight: number) {
    // Update background
    (this.children[0] as Graphics).clear();
    (this.children[0] as Graphics).beginFill(0x1a1a1a, 0.9);
    (this.children[0] as Graphics).drawRect(0, 0, newWidth, newHeight);
    (this.children[0] as Graphics).endFill();

    // Reposition elements
    this.moneyLabel.position.set(20, newHeight / 2 - this.moneyLabel.height / 2);
    this.reputationLabel.position.set(this.moneyLabel.x + this.moneyLabel.width + 40, newHeight / 2 - this.reputationLabel.height / 2);
    this.dayLabel.position.set(this.reputationLabel.x + this.reputationLabel.width + 40, newHeight / 2 - this.dayLabel.height / 2);
    this.settingsButton.position.set(newWidth - 100, newHeight / 2 - this.settingsButton.height / 2);
    this.fullscreenButton.position.set(newWidth - 50, newHeight / 2 - this.fullscreenButton.height / 2);
  }
}