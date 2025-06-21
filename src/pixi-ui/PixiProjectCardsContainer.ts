import { Container } from 'pixi.js';
import { Project } from '../types/game';
import { PixiProjectCard } from './PixiProjectCard';
import { PixiAnimatedProjectCard } from './PixiAnimatedProjectCard';

export class PixiProjectCardsContainer extends Container {
    private cards: (PixiProjectCard | PixiAnimatedProjectCard)[] = [];
    private cardWidth: number;
    private cardHeight: number;
    private gap: number;

    constructor(
        cardWidth = 220,
        cardHeight = 160, 
        gap = 20
    ) {
        super();
        this.cardWidth = cardWidth;
        this.cardHeight = cardHeight;
        this.gap = gap;
    }

    public addProjectCard(
        project: Project,
        onClick: (project: Project) => void,
        isAnimated = false,
        staff?: any[],
        priority?: number,
        isAutomated?: boolean
    ) {
        let card: PixiProjectCard | PixiAnimatedProjectCard;

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

        // Position the card
        const x = (this.cardWidth + this.gap) * this.cards.length;
        card.position.set(x, 0);
        
        this.addChild(card);
        this.cards.push(card);
        return card;
    }

    public updateCard(index: number, project: Project) {
        if (index >= 0 && index < this.cards.length) {
            this.cards[index].update(project);
        }
    }

    public updateAnimatedCard(
        index: number,
        progress: number,
        staff: any[],
        priority: number,
        isAutomated: boolean
    ) {
        const card = this.cards[index];
        if (card instanceof PixiAnimatedProjectCard) {
            card.updateAnimation(progress, staff, priority, isAutomated);
        }
    }

    public clearCards() {
        this.cards.forEach(card => this.removeChild(card));
        this.cards = [];
    }
}