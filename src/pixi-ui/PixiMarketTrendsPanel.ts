import { Container, Graphics, Text } from 'pixi.js';

// Types for market trends (can be imported from game-mechanics if available)
export interface PixiMarketTrend {
  genre: string;
  subGenre?: string;
  popularity: number; // 0-100
  trendDirection: 'rising' | 'stable' | 'falling';
}

/**
 * PixiMarketTrendsPanel visually displays market trends as animated bar charts with trend icons and tooltips.
 * Usage: panel.setTrends(trendsArray) to update data.
 */
export class PixiMarketTrendsPanel extends Container {
  private trends: PixiMarketTrend[] = [];
  private bars: Graphics[] = [];
  private labels: Text[] = [];
  private trendIcons: Graphics[] = [];
  protected panelWidth: number;
  protected panelHeight: number;
  private tooltip: Container;

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
   * Set the market trends data and re-render the panel.
   */
  public setTrends(trends: PixiMarketTrend[]) {
    this.trends = trends;
    this.renderPanel();
  }

  /**
   * Render the panel, bars, labels, and icons.
   */
  private renderPanel() {
    // Clear previous children except tooltip
    this.removeChildren();
    this.addChild(this.tooltip);
    this.bars = [];
    this.labels = [];
    this.trendIcons = [];

    // Panel background
    const bg = new Graphics();
    bg.beginFill(0x23272e, 0.95);
    bg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
    bg.endFill();
    this.addChild(bg);

    // Title
    const title = new Text('Market Trends', {
      fontFamily: 'Arial', fontSize: 22, fill: 0x8b5cf6, fontWeight: 'bold',
    });
    title.position.set(24, 16);
    this.addChild(title);

    // Layout
    const barAreaTop = 56;
    const barAreaHeight = this.panelHeight - barAreaTop - 24;
    const barHeight = 28;
    const barGap = 18;
    const maxBarWidth = this.panelWidth - 220;
    const iconSize = 24;

    this.trends.slice(0, Math.floor(barAreaHeight / (barHeight + barGap))).forEach((trend, i) => {
      const y = barAreaTop + i * (barHeight + barGap);
      // Bar color by popularity
      let barColor = 0x22c55e; // green
      if (trend.popularity < 40) barColor = 0xef4444; // red
      else if (trend.popularity < 70) barColor = 0xfacc15; // yellow
      // Bar
      const bar = new Graphics();
      bar.beginFill(barColor, 0.85);
      bar.drawRoundedRect(0, 0, (trend.popularity / 100) * maxBarWidth, barHeight, 8);
      bar.endFill();
      bar.position.set(180, y);
      bar.interactive = true;
      bar.on('pointerover', () => this.showTooltip(trend, bar.x + bar.width / 2, y));
      bar.on('pointerout', () => this.hideTooltip());
      this.addChild(bar);
      this.bars.push(bar);
      // Genre label
      const label = new Text(trend.genre + (trend.subGenre ? ` / ${trend.subGenre}` : ''), {
        fontFamily: 'Arial', fontSize: 16, fill: 0xffffff,
      });
      label.position.set(24, y + barHeight / 2 - label.height / 2);
      this.addChild(label);
      this.labels.push(label);
      // Popularity %
      const popText = new Text(`${trend.popularity}%`, {
        fontFamily: 'Arial', fontSize: 15, fill: 0xffffff,
      });
      popText.position.set(180 + maxBarWidth + 12, y + barHeight / 2 - popText.height / 2);
      this.addChild(popText);
      // Trend icon (simple: up, down, stable)
      const icon = this.createTrendIcon(trend.trendDirection, iconSize);
      icon.position.set(180 + maxBarWidth + 70, y + barHeight / 2 - iconSize / 2);
      this.addChild(icon);
      this.trendIcons.push(icon);
    });
  }

  /**
   * Show a tooltip with genre/subgenre details.
   */
  private showTooltip(trend: PixiMarketTrend, x: number, y: number) {
    this.tooltip.removeChildren();
    const bg = new Graphics();
    bg.beginFill(0x1a1a1a, 0.98);
    bg.drawRoundedRect(0, 0, 180, 40, 6);
    bg.endFill();
    this.tooltip.addChild(bg);
    const txt = new Text(`${trend.genre}${trend.subGenre ? ' / ' + trend.subGenre : ''}\nPopularity: ${trend.popularity}%\nTrend: ${trend.trendDirection}`, {
      fontFamily: 'Arial', fontSize: 13, fill: 0xffffff,
    });
    txt.position.set(12, 8);
    this.tooltip.addChild(txt);
    this.tooltip.position.set(x, y - 48);
    this.tooltip.visible = true;
  }

  private hideTooltip() {
    this.tooltip.visible = false;
    this.tooltip.removeChildren();
  }

  /**
   * Create a trend icon (up, down, stable) as a Graphics object.
   */
  private createTrendIcon(direction: 'rising' | 'stable' | 'falling', size: number): Graphics {
    const g = new Graphics();
    if (direction === 'rising') {
      g.beginFill(0x22c55e);
      g.moveTo(size / 2, 0);
      g.lineTo(size, size);
      g.lineTo(0, size);
      g.lineTo(size / 2, 0);
      g.endFill();
    } else if (direction === 'falling') {
      g.beginFill(0xef4444);
      g.moveTo(0, 0);
      g.lineTo(size, 0);
      g.lineTo(size / 2, size);
      g.lineTo(0, 0);
      g.endFill();
    } else {
      g.beginFill(0xfacc15);
      g.drawRect(0, size / 2 - 4, size, 8);
      g.endFill();
    }
    return g;
  }
} 