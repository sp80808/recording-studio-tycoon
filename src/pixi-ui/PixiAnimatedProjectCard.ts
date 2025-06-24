import { Graphics, Text, Sprite, Texture } from 'pixi.js';
import { Project, StaffMember, CardState } from '../types/game';
import { PixiProjectCard } from './PixiProjectCard';

export class PixiAnimatedProjectCard extends PixiProjectCard {
    private animatedProgressBarBg: Sprite;
    private progressText: Text;
    private staffIcons: Sprite[] = [];
    private priorityText: Text;
    private autoStatusText: Text;
    private pulseTicker = 0;
    private pulseDirection = 1;

    constructor(
        project: Project,
        onClick: (project: Project) => void,
        public assignedStaff: StaffMember[],
        public priority: number,
        public isAutomated: boolean
    ) {
        super(project, onClick);
        
        // Will be fully initialized in rebuildCard()
    }

    protected override rebuildCard() {
        super.rebuildCard();
        
        if (!this.isInitialized) return;

        // Create progress bar
        this.animatedProgressBarBg = new Sprite(this.textures.progressBarBg);
        this.animatedProgressBarBg.position.set(15, 130);
        this.addChild(this.animatedProgressBarBg);
        
        // Create progress bar using inherited progressBarFill
        this.progressBarFill = new Sprite(this.textures.progressBarFill);
        this.progressBarFill.position.set(15, 130);
        this.progressBarFill.width = 0;
        this.addChild(this.progressBarFill);

        // Create progress text
        this.progressText = new Text('0% Complete', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xffffff
        });
        this.progressText.position.set(15, 140);
        this.addChild(this.progressText);

        // Create staff icons
        this.updateStaffIcons();

        // Create priority and auto status
        this.priorityText = new Text(`Priority: ${this.priority}`, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: 0xffffff
        });
        this.priorityText.position.set(120, 120);
        this.addChild(this.priorityText);

        this.autoStatusText = new Text(`Auto: ${this.isAutomated ? 'ON' : 'OFF'}`, {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: this.isAutomated ? 0x00ff00 : 0xff0000
        });
        this.autoStatusText.position.set(120, 140);
        this.addChild(this.autoStatusText);
    }

    private updateStaffIcons() {
        // Clear existing icons
        this.staffIcons.forEach(icon => this.removeChild(icon));
        this.staffIcons = [];

        if (!this.isInitialized) return;

        const iconSize = 12;
        const spacing = 2;
        const startX = 15;
        const startY = 100;

        this.assignedStaff.forEach((staff, index) => {
            const icon = new Sprite(this.textures[`staff_${staff.role.toLowerCase()}`] || Texture.WHITE);
            icon.width = iconSize;
            icon.height = iconSize;
            icon.position.set(
                startX + (iconSize + spacing) * index,
                startY
            );
            icon.tint = this.getStaffColor(staff.role);
            this.addChild(icon);
            this.staffIcons.push(icon);
        });
    }

    private pulseProgressBar(delta: number) {
        if (!this.progressBarFill) return;
        
        this.pulseTicker += delta * 0.1 * this.pulseDirection;
        
        if (this.pulseTicker > 1) {
            this.pulseTicker = 1;
            this.pulseDirection = -1;
        } else if (this.pulseTicker < 0) {
            this.pulseTicker = 0;
            this.pulseDirection = 1;
        }
        
        this.progressBarFill.alpha = 0.7 + this.pulseTicker * 0.3;
    }

    private getStaffColor(role: string): number {
        switch(role) {
            case 'producer': return 0xff5555;
            case 'engineer': return 0x5555ff;
            case 'writer': return 0x55ff55;
            case 'artist': return 0xffff55;
            default: return 0xaaaaaa;
        }
    
    }

    public updateAnimation(
        progress: number,
        assignedStaff: StaffMember[],
        priority: number,
        isAutomated: boolean,
        delta?: number
    ) {
        this.assignedStaff = assignedStaff;
        this.priority = priority;
        this.isAutomated = isAutomated;

        // Update progress bar
        if (this.progressBarFill) {
            this.progressBarFill.width = 190 * (progress / 100);
        }
        
        // Pulse animation when progress changes
        if (delta !== undefined) {
            this.pulseProgressBar(delta);
        }

        // Update text elements
        this.progressText.text = `${progress}% Complete`;
        this.updateStaffIcons();
        this.priorityText.text = `Priority: ${priority}`;
        this.autoStatusText.text = `Auto: ${isAutomated ? 'ON' : 'OFF'}`;
        this.autoStatusText.style.fill = this.isAutomated ? 0x00ff00 : 0xff0000;

        // Update card state based on progress
        if (progress >= 100) {
            this.setState('completed');
        } else if (this.state !== 'active') {
            this.setState('active');
        }
    }

    public getProgress(): number {
        if (!this.progressBarFill) return 0;
        return (this.progressBarFill.width / 190) * 100;
    }
}
