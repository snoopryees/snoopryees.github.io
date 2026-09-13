export class UserInterface {
    constructor() {
        this.gameArea = document.getElementById("game-area");
        this.messageDisplay = document.getElementById("message");
        this.numButtonsInput = document.getElementById("numButtons");
        this.goButton = document.getElementById("goBtn");
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
