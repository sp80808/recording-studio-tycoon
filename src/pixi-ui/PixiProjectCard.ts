import { Container, Graphics, Text, Sprite, Texture, Assets } from 'pixi.js';
import { Project, CardState } from '../types/game';

// Default texture keys - should match atlas naming
const TEXTURE_KEYS = {
  CARD_BG_NORMAL: 'card_bg_normal',
  CARD_BG_HOVER: 'card_bg_hover',
  CARD_BG_ACTIVE: 'card_bg_active',
  CARD_BG_COMPLETED: 'card_bg_completed',
  PROGRESS_BAR_BG: 'progress_bar_bg',
  PROGRESS_BAR_FILL: 'progress_bar_fill',
  CLIENT_BADGES: ['badge_indie', 'badge_major', 'badge_independent'],
  GENRE_ICONS: [
    'icon_rock', 'icon_pop', 'icon_hiphop',
    'icon_electronic', 'icon_rnb', 'icon_country'
  ],
  DIFFICULTY_STARS: 'star'
};
import { PixiLabel } from './PixiLabel';

export class PixiProjectCard extends Container {
    protected project: Project;
    private onClickHandler: (project: Project) => void;
    private background: Sprite;
    protected state: CardState = 'normal';
    protected textures: Record<string, Texture> = {};
    protected isInitialized = false;
    
    // Text elements
    private titleText: Text;
    private clientBadge: Sprite;
    private genreIcon: Sprite;
    private difficultyStars: Sprite[] = [];
    protected progressBarBg: Sprite;
    protected progressBarFill: Sprite;
    private payoutText: Text;
    private repText: Text;
    private durationText: Text;

    constructor(project: Project, onClick: (project: Project) => void) {
        super();
        this.project = project;
        this.onClickHandler = onClick;
        
        // Create placeholder elements
        this.background = new Sprite(Texture.WHITE);
        this.addChild(this.background);
        
        // Start async initialization
        this.init().catch(console.error);

        // Create card background with texture
        this.background = new Sprite(this.textures.cardBackgroundNormal);
        this.background.width = 220;
        this.background.height = 160;
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

        // Create client badge with texture
        this.clientBadge = new Sprite(this.textures[`badge_${project.clientType}`]);
        this.clientBadge.position.set(180, 15);
        this.clientBadge.width = 40;
        this.clientBadge.height = 20;
        this.addChild(this.clientBadge);

        // Create genre icon
        this.genreIcon = new Sprite(this.textures[`icon_${project.genre}`]);
        this.genreIcon.position.set(15, 40);
        this.genreIcon.width = 24;
        this.genreIcon.height = 24;
        this.addChild(this.genreIcon);

        // Create difficulty stars
        this.createDifficultyStars(project.difficulty);

        // Create progress bar
        this.progressBarBg = new Sprite(this.textures.progressBarBg);
        this.progressBarBg.position.set(15, 130);
        this.addChild(this.progressBarBg);
        
        this.progressBarFill = new Sprite(this.textures.progressBarFill);
        this.progressBarFill.position.set(15, 130);
        this.progressBarFill.width = 0; // Start empty
        this.addChild(this.progressBarFill);

        // Create info texts
        this.payoutText = this.createInfoText(`$${project.payoutBase}`, 80, 0x00ff00);
        this.repText = this.createInfoText(`+${project.repGainBase} Rep`, 100, 0x00aaff);
        this.durationText = this.createInfoText(`${project.durationDaysTotal} days`, 120, 0xffff00);

        // Setup interactivity
        this.interactive = true;
        this.on('pointerdown', () => this.onClickHandler(this.project));
        this.on('pointerover', () => this.setState('hover'));
        this.on('pointerout', () => this.setState('normal'));
    }

    private async init(): Promise<void> {
        this.textures = await this.loadTextures();
        this.isInitialized = true;
        this.rebuildCard();
    }

    private async loadTextures(): Promise<Record<string, Texture>> {
        try {
            // Load texture atlas - assumes atlas is already loaded by main game
            const atlas = await Assets.load('projectCardsAtlas');
            
            // Verify all required textures exist
            const requiredTextures = [
                TEXTURE_KEYS.CARD_BG_NORMAL,
                TEXTURE_KEYS.CARD_BG_HOVER,
                TEXTURE_KEYS.CARD_BG_ACTIVE,
                TEXTURE_KEYS.CARD_BG_COMPLETED,
                TEXTURE_KEYS.PROGRESS_BAR_BG,
                TEXTURE_KEYS.PROGRESS_BAR_FILL,
                ...TEXTURE_KEYS.CLIENT_BADGES,
                ...TEXTURE_KEYS.GENRE_ICONS,
                TEXTURE_KEYS.DIFFICULTY_STARS
            ];

            const textures: Record<string, Texture> = {};
            for (const key of requiredTextures) {
                if (!atlas.textures[key]) {
                    console.warn(`Missing texture in atlas: ${key}`);
                    textures[key] = Texture.WHITE;
                } else {
                    textures[key] = atlas.textures[key];
                }
            }

            return textures;
        } catch (error) {
            console.error('Failed to load texture atlas:', error);
            // Fallback to white textures if atlas fails
            return Object.fromEntries(
                Object.values(TEXTURE_KEYS).flatMap(v =>
                    Array.isArray(v) ? v : [v]
                ).map(k => [k, Texture.WHITE])
            );
        }
    }

    private createDifficultyStars(count: number) {
        for (let i = 0; i < 5; i++) {
            const star = new Sprite(this.textures.star);
            star.position.set(15 + i * 20, 70);
            star.width = 16;
            star.height = 16;
            star.tint = i < count ? 0xFFFF00 : 0x555555;
            this.addChild(star);
            this.difficultyStars.push(star);
        }
    }

    protected setState(newState: CardState) {
        if (this.state === newState) return;
        this.state = newState;
        
        switch(newState) {
            case 'normal':
                this.background.texture = this.textures.cardBackgroundNormal;
                break;
            case 'hover':
                this.background.texture = this.textures.cardBackgroundHover;
                break;
            case 'active':
                this.background.texture = this.textures.cardBackgroundActive;
                break;
            case 'completed':
                this.background.texture = this.textures.cardBackgroundCompleted;
                break;
        }
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

    protected rebuildCard() {
        if (!this.isInitialized) return;
        
        // Remove all children except background
        this.removeChildren(1);
        
        // Recreate all card elements with loaded textures
        this.titleText = new Text(this.project.title, {
            fontFamily: 'Arial',
            fontSize: 16,
            fill: 0xffffff,
            fontWeight: 'bold'
        });
        this.titleText.position.set(15, 15);
        this.addChild(this.titleText);

        // Recreate all other elements similarly...
        // (Full implementation would recreate all card elements here)
    }

    public update(project: Project) {
        this.project = project;
        this.titleText.text = project.title;
        
        // Update client badge
        const badgeKey = TEXTURE_KEYS.CLIENT_BADGES.find(k => k.includes(project.clientType.toLowerCase()))
            || TEXTURE_KEYS.CLIENT_BADGES[0];
        this.clientBadge.texture = this.textures[badgeKey];
        
        // Update genre icon
        const genreKey = TEXTURE_KEYS.GENRE_ICONS.find(k => k.includes(project.genre.toLowerCase()))
            || TEXTURE_KEYS.GENRE_ICONS[0];
        this.genreIcon.texture = this.textures[genreKey];
        
        // Update difficulty stars
        this.difficultyStars.forEach((star, i) => {
            star.texture = this.textures[TEXTURE_KEYS.DIFFICULTY_STARS];
            star.tint = i < project.difficulty ? 0xFFFF00 : 0x555555;
        });

        // Update info texts
        this.payoutText.text = `$${project.payoutBase.toLocaleString()}`;
        this.repText.text = `+${project.repGainBase} Rep`;
        this.durationText.text = `${project.durationDaysTotal} days`;

        // Update progress and state
        if (project.progress !== undefined) {
            this.setProgress(project.progress);
        }
        if (project.cardState) {
            this.setState(project.cardState);
        }
    }

    public setProgress(progress: number) {
        this.progressBarFill.width = 190 * (progress / 100);
    }
}