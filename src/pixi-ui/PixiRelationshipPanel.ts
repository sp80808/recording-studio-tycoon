import { Container, Graphics, Text } from 'pixi.js';

export interface PixiRelationship {
  id: string;
  name: string;
  type: 'Client' | 'Label';
  relationshipScore: number; // 0-100
  recentChange: number; // e.g., +5 or -3
  history: Array<{ day: number; change: number; reason: string }>;
}

export interface PixiReputationPanelData {
  reputation: number; // 0-1000 or similar
  recentChange: number;
  relationships: PixiRelationship[];
}

/**
 * PixiRelationshipPanel visually displays reputation and relationship management.
 * Usage: panel.setData(panelData) to update data.
 */
export class PixiRelationshipPanel extends Container {
  private data: PixiReputationPanelData | null = null;
  private bars: Graphics[] = [];
  private labels: Text[] = [];
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
   * Set the relationship and reputation data and re-render the panel.
   */
  public setData(data: PixiReputationPanelData) {
    this.data = data;
    this.renderPanel();
  }

  /**
   * Render the panel, bars, labels, and tooltips.
   */
  private renderPanel() {
    // Clear previous children except tooltip
    this.removeChildren();
    this.addChild(this.tooltip);
    this.bars = [];
    this.labels = [];

    // Panel background
    const bg = new Graphics();
    bg.beginFill(0x23272e, 0.95);
    bg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
    bg.endFill();
    this.addChild(bg);

    // Title
    const title = new Text('Reputation & Relationships', {
      fontFamily: 'Arial', fontSize: 22, fill: 0x818cf8, fontWeight: 'bold',
    });
    title.position.set(24, 16);
    this.addChild(title);

    if (!this.data) return;

    // Reputation bar
    const repBarWidth = this.panelWidth - 180;
    const repBarHeight = 22;
    const repBarY = 56;
    const repColor = 0x818cf8;
    const repBar = new Graphics();
    repBar.beginFill(repColor, 0.85);
    repBar.drawRoundedRect(0, 0, (this.data.reputation / 1000) * repBarWidth, repBarHeight, 8);
    repBar.endFill();
    repBar.position.set(140, repBarY);
    this.addChild(repBar);
    // Reputation label
    const repLabel = new Text(`Reputation: ${this.data.reputation}${this.data.recentChange !== 0 ? (this.data.recentChange > 0 ? ` (+${this.data.recentChange})` : ` (${this.data.recentChange})`) : ''}`, {
      fontFamily: 'Arial', fontSize: 16, fill: 0xffffff,
    });
    repLabel.position.set(24, repBarY + repBarHeight / 2 - repLabel.height / 2);
    this.addChild(repLabel);
    this.labels.push(repLabel);

    // Layout for relationships
    const rowHeight = 44;
    const barWidth = this.panelWidth - 220;
    const barHeight = 16;
    const maxRows = Math.floor((this.panelHeight - repBarY - repBarHeight - 32) / rowHeight);

    this.data.relationships.slice(0, maxRows).forEach((rel, i) => {
      const y = repBarY + repBarHeight + 24 + i * rowHeight;
      // Relationship bar color
      let barColor = 0x22c55e; // green
      if (rel.relationshipScore < 40) barColor = 0xef4444; // red
      else if (rel.relationshipScore < 70) barColor = 0xfacc15; // yellow
      // Relationship bar
      const bar = new Graphics();
      bar.beginFill(barColor, 0.85);
      bar.drawRoundedRect(0, 0, (rel.relationshipScore / 100) * barWidth, barHeight, 6);
      bar.endFill();
      bar.position.set(180, y);
      bar.interactive = true;
      bar.on('pointerover', () => this.showTooltip(rel, bar.x + bar.width / 2, y));
      bar.on('pointerout', () => this.hideTooltip());
      this.addChild(bar);
      this.bars.push(bar);
      // Name label
      const nameLabel = new Text(`${rel.name} (${rel.type})`, {
        fontFamily: 'Arial', fontSize: 15, fill: 0xffffff,
      });
      nameLabel.position.set(24, y + barHeight / 2 - nameLabel.height / 2);
      this.addChild(nameLabel);
      this.labels.push(nameLabel);
      // Score label
      const scoreLabel = new Text(`${rel.relationshipScore}${rel.recentChange !== 0 ? (rel.recentChange > 0 ? ` (+${rel.recentChange})` : ` (${rel.recentChange})`) : ''}`, {
        fontFamily: 'Arial', fontSize: 14, fill: 0xffffff,
      });
      scoreLabel.position.set(180 + barWidth + 12, y + barHeight / 2 - scoreLabel.height / 2);
      this.addChild(scoreLabel);
      this.labels.push(scoreLabel);
    });
  }

  /**
   * Show a tooltip with relationship details and history.
   */
  private showTooltip(rel: PixiRelationship, x: number, y: number) {
    this.tooltip.removeChildren();
    const bg = new Graphics();
    bg.beginFill(0x1a1a1a, 0.98);
    bg.drawRoundedRect(0, 0, 260, 80, 6);
    bg.endFill();
    this.tooltip.addChild(bg);
    const txt = new Text(
      `${rel.name} (${rel.type})\nScore: ${rel.relationshipScore}\nRecent: ${rel.recentChange > 0 ? '+' : ''}${rel.recentChange}\n` +
      rel.history.slice(-3).map(h => `Day ${h.day}: ${h.change > 0 ? '+' : ''}${h.change} (${h.reason})`).join('\n'),
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