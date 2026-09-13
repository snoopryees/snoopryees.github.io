import { STRINGS } from "../lang/messages/en/user.js";

export class UserInterface {
    constructor() {
        this.gameArea = document.getElementById("game-area");
        this.messageDisplay = document.getElementById("message");
        this.numButtonsInput = document.getElementById("numButtons");
        this.goButton = document.getElementById("goBtn");
        this.promptLabel = document.getElementById("promptLabel");

        this.promptLabel.textContent = STRINGS.PROMPT;
        this.goButton.textContent = STRINGS.GO_BTN;
    }

    getNumberOfButtons() {
        return parseInt(this.numButtonsInput.value);
    }

    displayMessage(text) {
        this.messageDisplay.textContent = text;
    }

    clearGameArea() {
        this.gameArea.innerHTML = "";
    }

    addGameButton(buttonElement) {
        this.gameArea.appendChild(buttonElement);
    }

    getBrowserDimensions() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }
}
