import { Container, Graphics, Text } from 'pixi.js';
import { RandomEvent } from '../game-mechanics/random-events';

export class PixiEventNotifier extends Container {
    private notificationQueue: RandomEvent[] = [];
    private currentNotification: Container | null = null;
    private isDisplaying = false;

    constructor() {
        super();
    }

    public showEvent(event: RandomEvent) {
        this.notificationQueue.push(event);
        if (!this.isDisplaying) {
            this.displayNextNotification();
        }
    }

    private displayNextNotification() {
        if (this.notificationQueue.length === 0) {
            this.isDisplaying = false;
            return;
        }

        this.isDisplaying = true;
        const event = this.notificationQueue.shift()!;

        const notification = new Container();
        const bg = new Graphics();
        bg.beginFill(0x000000, 0.8);
        bg.drawRoundedRect(0, 0, 400, 100, 10);
        bg.endFill();
        notification.addChild(bg);

        const title = new Text(event.name, {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xffffff,
            fontWeight: 'bold',
        });
        title.position.set(10, 10);
        notification.addChild(title);

        const description = new Text(event.description, {
            fontFamily: 'Arial',
            fontSize: 14,
            fill: 0xcccccc,
            wordWrap: true,
            wordWrapWidth: 380,
        });
        description.position.set(10, 40);
        notification.addChild(description);

        this.currentNotification = notification;
        this.addChild(notification);

        // Position notification at the top center of the screen
        if (this.parent) {
            notification.x = (this.parent.width - 400) / 2;
        } else {
            notification.x = (window.innerWidth - 400) / 2;
        }
        notification.y = 20;

        setTimeout(() => {
            if (this.currentNotification) {
                this.removeChild(this.currentNotification);
                this.currentNotification = null;
            }
            this.displayNextNotification();
        }, 5000); // Display for 5 seconds
    }
}
