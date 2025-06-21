import { Graphics, Text } from 'pixi.js';
import { Project, StaffMember } from '../types/game';
import { PixiProjectCard } from './PixiProjectCard';

export class PixiAnimatedProjectCard extends PixiProjectCard {
    private progressBar: Graphics;
    private progressText: Text;
    private staffIcons: Graphics[] = [];
    private priorityText: Text;
    private autoStatusText: Text;
    private progress = 0;

    constructor(
        project: Project,
        onClick: (project: Project) => void,
        public assignedStaff: StaffMember[],
        public priority: number,
        public isAutomated: boolean
    ) {
        super(project, onClick);

        // Create progress bar
        this.progressBar = new Graphics();
        this.drawProgressBar(0);
        this.addChild(this.progressBar);

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

    private drawProgressBar(progress: number) {
        this.progressBar.clear();
        
        // Background
        this.progressBar.beginFill(0x333333);
        this.progressBar.drawRect(15, 130, 190, 5);
        this.progressBar.endFill();
        
        // Progress fill
        this.progressBar.beginFill(0x00aaff);
        this.progressBar.drawRect(15, 130, 190 * (progress / 100), 5);
        this.progressBar.endFill();
    }

    private updateStaffIcons() {
        // Clear existing icons
        this.staffIcons.forEach(icon => this.removeChild(icon));
        this.staffIcons = [];

        // Create new icons
        const iconSize = 12;
        const spacing = 2;
        const startX = 15;
        const startY = 100;

        this.assignedStaff.forEach((staff, index) => {
            const icon = new Graphics();
            icon.beginFill(this.getStaffColor(staff.role));
            icon.drawCircle(0, 0, iconSize / 2);
            icon.endFill();
            icon.position.set(
                startX + (iconSize + spacing) * index,
                startY
            );
            this.addChild(icon);
            this.staffIcons.push(icon);
        });
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

    public updateAnimation(progress: number, assignedStaff: StaffMember[], priority: number, isAutomated: boolean) {
        this.progress = progress;
        this.assignedStaff = assignedStaff;
        this.priority = priority;
        this.isAutomated = isAutomated;

        this.drawProgressBar(progress);
        this.progressText.text = `${progress}% Complete`;
        this.updateStaffIcons();
        this.priorityText.text = `Priority: ${priority}`;
        this.autoStatusText.text = `Auto: ${isAutomated ? 'ON' : 'OFF'}`;
        this.autoStatusText.style.fill = isAutomated ? 0x00ff00 : 0xff0000;
    }
}