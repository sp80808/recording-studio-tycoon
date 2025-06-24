import { Container, Graphics, Text } from 'pixi.js';

export interface PixiStaffWellbeing {
  id: string;
  name: string;
  moodScore: number; // 0-100
  currentMood: string; // e.g., 'Happy', 'Stressed', etc.
  burnoutLevel: number; // 0-100
  moodFactors: Array<{ description: string; impact: number; source: string }>;
}

/**
 * PixiStaffWellbeingPanel visually displays staff wellbeing with animated mood indicators and burnout warnings.
 * Usage: panel.setStaff(staffArray) to update data.
 */
export class PixiStaffWellbeingPanel extends Container {
  private staff: PixiStaffWellbeing[] = [];
  private moodOrbs: Graphics[] = [];
  private labels: Text[] = [];
  private burnoutWarnings: Graphics[] = [];
  private tooltip: Container;
  protected panelWidth: number;
  protected panelHeight: number;

  constructor(width: number, height: number) {
    super();
    this.panelWidth = width;
    this.panelHeight = height;
    this.tooltip = new Container();
    this.tooltip.visible = false;
    this.addChild(this.tooltip);
    this.interactive = true;
    this.renderPanel();
  }

  /**
   * Set the staff wellbeing data and re-render the panel.
   */
  public setStaff(staff: PixiStaffWellbeing[]) {
    this.staff = staff;
    this.renderPanel();
  }

  /**
   * Render the panel, mood orbs, labels, and burnout warnings.
   */
  private renderPanel() {
    // Clear previous children except tooltip
    this.removeChildren();
    this.addChild(this.tooltip);
    this.moodOrbs = [];
    this.labels = [];
    this.burnoutWarnings = [];

    // Panel background
    const bg = new Graphics();
    bg.beginFill(0x23272e, 0.95);
    bg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
    bg.endFill();
    this.addChild(bg);

    // Title
    const title = new Text('Staff Wellbeing', {
      fontFamily: 'Arial', fontSize: 22, fill: 0x38bdf8, fontWeight: 'bold',
    });
    title.position.set(24, 16);
    this.addChild(title);

    // Layout
    const rowHeight = 48;
    const orbRadius = 16;
    const barWidth = this.panelWidth - 180;
    const barHeight = 16;
    const maxRows = Math.floor((this.panelHeight - 56) / rowHeight);

    this.staff.slice(0, maxRows).forEach((member, i) => {
      const y = 56 + i * rowHeight;
      // Mood orb color by moodScore
      let orbColor = 0x22c55e; // green
      if (member.moodScore < 40) orbColor = 0xef4444; // red
      else if (member.moodScore < 70) orbColor = 0xfacc15; // yellow
      // Mood orb
      const orb = new Graphics();
      orb.beginFill(orbColor, 0.9);
      orb.drawCircle(0, 0, orbRadius);
      orb.endFill();
      orb.position.set(48, y + rowHeight / 2);
      orb.interactive = true;
      orb.on('pointerover', () => this.showTooltip(member, orb.x, orb.y));
      orb.on('pointerout', () => this.hideTooltip());
      this.addChild(orb);
      this.moodOrbs.push(orb);
      // Staff name
      const nameLabel = new Text(member.name, {
        fontFamily: 'Arial', fontSize: 16, fill: 0xffffff,
      });
      nameLabel.position.set(80, y + rowHeight / 2 - nameLabel.height / 2);
      this.addChild(nameLabel);
      this.labels.push(nameLabel);
      // Mood label
      const moodLabel = new Text(member.currentMood, {
        fontFamily: 'Arial', fontSize: 14, fill: 0x94a3b8,
      });
      moodLabel.position.set(220, y + rowHeight / 2 - moodLabel.height / 2);
      this.addChild(moodLabel);
      this.labels.push(moodLabel);
      // Burnout bar (with warning if high)
      const burnoutBar = new Graphics();
      const burnoutColor = member.burnoutLevel >= 70 ? 0xf87171 : 0x64748b;
      burnoutBar.beginFill(burnoutColor, 0.7);
      burnoutBar.drawRoundedRect(0, 0, (member.burnoutLevel / 100) * barWidth, barHeight, 6);
      burnoutBar.endFill();
      burnoutBar.position.set(320, y + rowHeight / 2 - barHeight / 2);
      this.addChild(burnoutBar);
      // Burnout warning (pulse effect if critical)
      if (member.burnoutLevel >= 90) {
        const warning = new Graphics();
        warning.beginFill(0xf87171, 1);
        warning.drawCircle(0, 0, 10);
        warning.endFill();
        warning.position.set(320 + barWidth + 20, y + rowHeight / 2);
        this.addChild(warning);
        this.burnoutWarnings.push(warning);
      }
    });
  }

  /**
   * Show a tooltip with mood and burnout details.
   */
  private showTooltip(member: PixiStaffWellbeing, x: number, y: number) {
    this.tooltip.removeChildren();
    const bg = new Graphics();
    bg.beginFill(0x1a1a1a, 0.98);
    bg.drawRoundedRect(0, 0, 220, 60, 6);
    bg.endFill();
    this.tooltip.addChild(bg);
    const txt = new Text(
      `${member.name}\nMood: ${member.currentMood} (${member.moodScore})\nBurnout: ${member.burnoutLevel}\n` +
      member.moodFactors.slice(-3).map(f => `${f.description}: ${f.impact > 0 ? '+' : ''}${f.impact}`).join('\n'),
      { fontFamily: 'Arial', fontSize: 13, fill: 0xffffff }
    );
    txt.position.set(12, 8);
    this.tooltip.addChild(txt);
    this.tooltip.position.set(x + 20, y - 40);
    this.tooltip.visible = true;
  }

  private hideTooltip() {
    this.tooltip.visible = false;
    this.tooltip.removeChildren();
  }
} 