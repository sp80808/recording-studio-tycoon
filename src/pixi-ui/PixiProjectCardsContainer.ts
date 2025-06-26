import { Container, Ticker } from 'pixi.js';
import { Project } from '../types/game';
import { PixiProjectCard } from './PixiProjectCard';
import { PixiAnimatedProjectCard } from './PixiAnimatedProjectCard';

export class PixiProjectCardsContainer extends Container {
    public cards: (PixiProjectCard | PixiAnimatedProjectCard)[] = [];
    private cardWidth: number;
    private cardHeight: number;
    private gap: number;
    private cardPool: (PixiProjectCard | PixiAnimatedProjectCard)[] = [];
    private animationTicker?: Ticker;

    constructor(
        cardWidth = 220,
        cardHeight = 160,
        gap = 20
    ) {
        super();
        this.cardWidth = cardWidth;
        this.cardHeight = cardHeight;
        this.gap = gap;
        
        // Setup animation ticker
        this.animationTicker = new Ticker();
        this.animationTicker.add(this.updateAnimations.bind(this));
        this.animationTicker.start();
    }

    public addProjectCard(
        project: Project,
        onClick: (project: Project) => void,
        isAnimated = false,
        staff?: StaffMember[],
        priority?: number,
        isAutomated?: boolean
    ) {
        let card: PixiProjectCard | PixiAnimatedProjectCard;

        // Try to reuse card from pool
        const poolIndex = this.cardPool.findIndex(c =>
            isAnimated ? c instanceof PixiAnimatedProjectCard : !(c instanceof PixiAnimatedProjectCard)
        );
        
        if (poolIndex >= 0) {
            card = this.cardPool.splice(poolIndex, 1)[0];
            card.update(project);
            if (card instanceof PixiAnimatedProjectCard && staff && priority !== undefined && isAutomated !== undefined) {
                card.updateAnimation(0, staff, priority, isAutomated);
            }
        } else {
            // Create new card if none in pool
            if (isAnimated && staff && priority !== undefined && isAutomated !== undefined) {
                card = new PixiAnimatedProjectCard(
                    project,
                    onClick,
                    staff,
                    priority,
                    isAutomated
                );
            } else {
                card = new PixiProjectCard(project, onClick);
            }
        }
        
        this.addChild(card);
        this.cards.push(card);
        this.repositionCards();
        return card;
    }

    public resize(width: number, height: number) {
        this.repositionCards(width);
    }

    private repositionCards(containerWidth?: number) {
        const width = containerWidth || this.parent?.width || this.cardWidth;
        let x = 0;
        let y = 0;

        this.cards.forEach(card => {
            if (x + this.cardWidth > width) {
                x = 0;
                y += this.cardHeight + this.gap;
            }
            card.position.set(x, y);
            x += this.cardWidth + this.gap;
        });
    }

    private updateAnimations(delta: number) {
        this.cards.forEach(card => {
            if (card instanceof PixiAnimatedProjectCard) {
                // Get current animation state from game
                const progress = card instanceof PixiAnimatedProjectCard ?
                    card.getProgress() : 0;
                card.updateAnimation(
                    progress,
                    card.assignedStaff,
                    card.priority,
                    card.isAutomated,
                    delta
                );
            }
        });
    }

    public updateCard(index: number, project: Project) {
        if (index >= 0 && index < this.cards.length) {
            this.cards[index].update(project);
        }
    }

    public updateAnimatedCard(
        index: number,
        progress: number,
        staff: StaffMember[],
        priority: number,
        isAutomated: boolean
    ) {
        const card = this.cards[index];
        if (card instanceof PixiAnimatedProjectCard) {
            card.updateAnimation(progress, staff, priority, isAutomated);
        }
    }

    public clearCards() {
        // Move cards to pool instead of destroying them
        this.cards.forEach(card => {
            card.visible = false;
            this.removeChild(card);
            this.cardPool.push(card);
        });
        this.cards = [];
    }

    public destroy(options?: boolean | { children?: boolean; texture?: boolean; baseTexture?: boolean; }) {
        if (this.animationTicker) {
            this.animationTicker.stop();
            this.animationTicker.destroy();
        }
        this.cardPool.forEach(card => card.destroy(options));
        this.cardPool = [];
        super.destroy(options);
    }
}
