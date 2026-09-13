import { MemoryButton } from "./MemoryButton.js";
import { STRINGS } from "../lang/en/strings.js";

export class GameEngine {
    constructor(ui) {
        this.ui = ui;
        this.buttonsArray = [];
        this.numberOfButtons = 0;
        this.expectedClickOrder = 1;
    }

    startGame(n) {
        if (!this.validateInput(n)) {
            return;
        }

        this.resetState(n);
        this.createButtons(n);
        this.scrambleButtons();
    }

    validateInput(n) {
        if (isNaN(n) || n < 3 || n > 7) {
            this.ui.displayMessage(STRINGS.ERROR);
            return false;
        }
        return true;
    }

    resetState(n) {
        this.numberOfButtons = n;
        this.expectedClickOrder = 1;
        this.buttonsArray = [];
        this.ui.clearGameArea();
        this.ui.displayMessage("");
    }

    createButtons(n) {
        for (let i = 1; i <= n; i++) {
            const btn = new MemoryButton(i);
            this.buttonsArray.push(btn);
            this.ui.addGameButton(btn.htmlElement);
        }
    }

    scrambleButtons() {
        const dimensions = this.ui.getBrowserDimensions();
        const buttonSize = 80;

        for (const btn of this.buttonsArray) {
            const x = Math.floor(Math.random() * (dimensions.width - buttonSize));
            const y = Math.floor(Math.random() * (dimensions.height - buttonSize - 100));
            btn.setLocation(x, y);
        }
    }
}
