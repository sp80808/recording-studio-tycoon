import { Container, Graphics, Text } from 'pixi.js';
import { StudioPerk, StudioUpgradeService } from '../game-mechanics/studio-perks';
import { GameState } from '../types/game';

export class PixiStudioPerksPanel extends Container {
    private perks: StudioPerk[] = [];
    private service: StudioUpgradeService;
    private panelWidth: number;
    private panelHeight: number;
    private title: Text;

    constructor(width: number, height: number, service: StudioUpgradeService) {
        super();
        this.panelWidth = width;
        this.panelHeight = height;
        this.service = service;

        const bg = new Graphics();
        bg.beginFill(0x23272e, 0.95);
        bg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
        bg.endFill();
        this.addChild(bg);

        this.title = new Text('Studio Perks', {
            fontFamily: 'Arial',
            fontSize: 22,
            fill: 0x38bdf8,
            fontWeight: 'bold',
        });
        this.title.position.set(24, 16);
        this.addChild(this.title);
    }

    public setPerks(perks: StudioPerk[], gameState: GameState) {
        this.perks = perks;
        this.renderPerks(gameState);
    }

    private renderPerks(gameState: GameState) {
        // Clear previous perks
        this.children.slice(2).forEach(child => this.removeChild(child));

        const rowHeight = 60;
        const maxRows = Math.floor((this.panelHeight - 60) / rowHeight);

        this.perks.slice(0, maxRows).forEach((perk, i) => {
            const y = 60 + i * rowHeight;
            const canUnlock = this.service.canUnlockPerk(perk.id, gameState);
            const isUnlocked = perk.isUnlocked;

            const perkContainer = new Container();
            perkContainer.position.set(20, y);
            this.addChild(perkContainer);

            const icon = new Graphics();
            icon.beginFill(isUnlocked ? 0x22c55e : (canUnlock ? 0xfacc15 : 0x64748b));
            icon.drawCircle(0, 0, 16);
            icon.endFill();
            icon.position.set(16, rowHeight / 2 - 8);
            perkContainer.addChild(icon);

            const nameLabel = new Text(perk.name, {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: isUnlocked ? 0xffffff : 0x94a3b8,
            });
            nameLabel.position.set(48, rowHeight / 2 - nameLabel.height / 2 - 10);
            perkContainer.addChild(nameLabel);

            const descLabel = new Text(perk.description, {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0x94a3b8,
                wordWrap: true,
                wordWrapWidth: this.panelWidth - 80,
            });
            descLabel.position.set(48, rowHeight / 2 - descLabel.height / 2 + 10);
            perkContainer.addChild(descLabel);

            if (canUnlock && !isUnlocked) {
                const unlockButton = new Graphics();
                unlockButton.beginFill(0x38bdf8);
                unlockButton.drawRoundedRect(0, 0, 80, 30, 8);
                unlockButton.endFill();
                unlockButton.position.set(this.panelWidth - 120, rowHeight / 2 - 15);
                
                const buttonText = new Text('Unlock', {
                    fontFamily: 'Arial',
                    fontSize: 14,
                    fill: 0xffffff,
                });
                buttonText.anchor.set(0.5);
                buttonText.position.set(40, 15);
                unlockButton.addChild(buttonText);

                unlockButton.interactive = true;
                unlockButton.cursor = 'pointer';
                unlockButton.on('pointerdown', () => {
                    this.service.unlockPerk(perk.id, gameState);
                    this.setPerks(this.service.getAllPerks(), gameState);
                });
                perkContainer.addChild(unlockButton);
            }
        });
    }
}
