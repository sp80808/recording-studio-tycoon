import { Container, Graphics, Text, Texture, Sprite } from 'pixi.js';
import { Project } from '../types/game';
import { PixiLabel } from './PixiLabel';

export class PixiProjectCard extends Container {
    private project: Project;
    private onClickHandler: (project: Project) => void;
    private background: Graphics;
    private titleText: Text;
    private clientBadge: PixiLabel;
    private genreText: Text;
    private difficultyText: Text;
    private payoutText: Text;
    private repText: Text;
    private durationText: Text;

    constructor(project: Project, onClick: (project: Project) => void) {
        super();
        this.project = project;
        this.onClickHandler = onClick;

        // Create card background
        this.background = new Graphics();
        this.drawCardBackground();
        this.addChild(this.background);

        // Create title text
        this.titleText = new Text(project.title, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        this.titleText.position.set(15, 15);
        this.addChild(this.titleText);

        // Create client type badge
        this.clientBadge = new PixiLabel(
            project.clientType,
            0xff5555,
            12,
            'center'
        );
        this.clientBadge.position.set(180, 15);
        this.addChild(this.clientBadge);

        // Create info texts
        this.genreText = this.createInfoText(`Genre: ${project.genre}`, 40);
        this.difficultyText = this.createInfoText(`Difficulty: ${project.difficulty}`, 60, 0xffaa00);
        this.payoutText = this.createInfoText(`$${project.payoutBase}`, 80, 0x00ff00);
        this.repText = this.createInfoText(`+${project.repGainBase} Rep`, 100, 0x00aaff);
        this.durationText = this.createInfoText(`${project.durationDaysTotal} days`, 120, 0xffff00);

        // Setup interactivity
        this.interactive = true;
        this.on('pointerdown', () => this.onClickHandler(this.project));
        this.on('pointerover', () => this.setHoverState(true));
        this.on('pointerout', () => this.setHoverState(false));
    }

    private drawCardBackground(hovered = false) {
        this.background.clear();
        this.background.beginFill(hovered ? 0x333333 : 0x1a1a1a, 0.9);
        this.background.lineStyle(1, hovered ? 0x666666 : 0x444444);
        this.background.drawRoundedRect(0, 0, 220, 160, 8);
        this.background.endFill();
    }

    private createInfoText(text: string, y: number, color = 0xffffff): Text {
        const textObj = new Text(text, {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: color
        });
        textObj.position.set(15, y);
        this.addChild(textObj);
        return textObj;
    }

    private setHoverState(hovered: boolean) {
        this.drawCardBackground(hovered);
    }

    public update(project: Project) {
        this.project = project;
        this.titleText.text = project.title;
        this.clientBadge.text = project.clientType;
        this.genreText.text = `Genre: ${project.genre}`;
        this.difficultyText.text = `Difficulty: ${project.difficulty}`;
        this.payoutText.text = `$${project.payoutBase}`;
        this.repText.text = `+${project.repGainBase} Rep`;
        this.durationText.text = `${project.durationDaysTotal} days`;
    }
}