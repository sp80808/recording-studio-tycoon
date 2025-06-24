import { Container, Graphics, Text } from 'pixi.js';
import { Band } from '../types/bands';

export class PixiArtistBandManagementPanel extends Container {
    private panelWidth: number;
    private panelHeight: number;
    private title: Text;
    private bandsContainer: Container;

    constructor(width: number, height: number) {
        super();
        this.panelWidth = width;
        this.panelHeight = height;

        const bg = new Graphics();
        bg.beginFill(0x2a2a2a, 0.9);
        bg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
        bg.endFill();
        this.addChild(bg);

        this.title = new Text('Artist & Band Management', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xffffff,
            fontWeight: 'bold',
        });
        this.title.position.set(20, 15);
        this.addChild(this.title);

        this.bandsContainer = new Container();
        this.bandsContainer.position.set(20, 60);
        this.addChild(this.bandsContainer);
    }

    public setBands(bands: Band[]) {
        this.bandsContainer.removeChildren();

        let yPos = 0;
        bands.forEach(band => {
            const bandEntry = new Container();

            const name = new Text(`${band.bandName} (${band.genre})`, {
                fontFamily: 'Arial',
                fontSize: 16,
                fill: 0xffffff,
            });
            name.position.set(0, 0);
            bandEntry.addChild(name);

            const fame = new Text(`Fame: ${band.fame}`, {
                fontFamily: 'Arial',
                fontSize: 12,
                fill: 0xcccccc,
            });
            fame.position.set(0, 22);
            bandEntry.addChild(fame);

            bandEntry.position.y = yPos;
            this.bandsContainer.addChild(bandEntry);
            yPos += 45;
        });
    }
}
