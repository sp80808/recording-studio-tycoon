import { Container, Graphics, Text } from 'pixi.js';
import { Financials, ProjectReport } from '../types/game';

export class PixiFinancialsPanel extends Container {
    private panelWidth: number;
    private panelHeight: number;
    private title: Text;
    private financialsContainer: Container;
    private reportsContainer: Container;

    constructor(width: number, height: number) {
        super();
        this.panelWidth = width;
        this.panelHeight = height;

        const bg = new Graphics();
        bg.beginFill(0x2a2a2a, 0.9);
        bg.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
        bg.endFill();
        this.addChild(bg);

        this.title = new Text('Financials & Reports', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xffffff,
            fontWeight: 'bold',
        });
        this.title.position.set(20, 15);
        this.addChild(this.title);

        this.financialsContainer = new Container();
        this.financialsContainer.position.set(20, 60);
        this.addChild(this.financialsContainer);

        this.reportsContainer = new Container();
        this.reportsContainer.position.set(20, 120);
        this.addChild(this.reportsContainer);
    }

    public setData(financials: Financials) {
        this.financialsContainer.removeChildren();
        this.reportsContainer.removeChildren();

        const income = new Text(`Income: $${financials.income.toLocaleString()}`, { fontFamily: 'Arial', fontSize: 16, fill: 0x00ff00 });
        this.financialsContainer.addChild(income);

        const expenses = new Text(`Expenses: $${financials.expenses.toLocaleString()}`, { fontFamily: 'Arial', fontSize: 16, fill: 0xff0000 });
        expenses.position.y = 25;
        this.financialsContainer.addChild(expenses);

        const profit = new Text(`Profit: $${financials.profit.toLocaleString()}`, { fontFamily: 'Arial', fontSize: 16, fill: 0xffffff, fontWeight: 'bold' });
        profit.position.y = 50;
        this.financialsContainer.addChild(profit);

        let yPos = 0;
        financials.reports.slice(0, 5).forEach(report => { // Display up to 5 reports
            const reportEntry = new Text(`${report.projectTitle}: $${report.moneyGained.toLocaleString()}`, {
                fontFamily: 'Arial',
                fontSize: 14,
                fill: 0xcccccc,
            });
            reportEntry.position.y = yPos;
            this.reportsContainer.addChild(reportEntry);
            yPos += 20;
        });
    }
}
