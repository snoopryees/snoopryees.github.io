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

        // show numbers for n seconds, then start scrambling
        setTimeout(() => {
            this.startScramblePhase();
        }, n * 1000);
    }

    startScramblePhase() {
        let scrambleCount = 0;

        const intervalId = setInterval(() => {
            this.scrambleButtons();
            scrambleCount++;

            if (scrambleCount >= this.numberOfButtons) {
                clearInterval(intervalId);
                this.startPlayPhase();
            }
        }, 2000);
    }

    startPlayPhase() {
        for (const btn of this.buttonsArray) {
            btn.hideNumber();
            btn.htmlElement.addEventListener("click", () => {
                this.handleButtonClick(btn);
            });
        }
    }

    handleButtonClick(btn) {
        if (btn.order === this.expectedClickOrder) {
            btn.showNumber();
            this.expectedClickOrder++;

            if (this.expectedClickOrder > this.numberOfButtons) {
                this.ui.displayMessage(STRINGS.WIN);
            }
        } else {
            for (const b of this.buttonsArray) {
                b.showNumber();
            }
            this.ui.displayMessage(STRINGS.LOSE);
        }
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

        for (const btn of this.buttonsArray) {
            const btnWidth = btn.htmlElement.offsetWidth;
            const btnHeight = btn.htmlElement.offsetHeight;

            const x = Math.floor(Math.random() * (dimensions.width - btnWidth));
            const y = Math.floor(Math.random() * (dimensions.height - btnHeight));
            btn.setLocation(x, y);
        }
    }
}
