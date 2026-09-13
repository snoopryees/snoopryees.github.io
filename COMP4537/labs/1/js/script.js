// AI was used to assist with this assignment

import { UserInterface } from "./UserInterface.js";
import { GameEngine } from "./GameEngine.js";

const ui = new UserInterface();
const game = new GameEngine(ui);

ui.goButton.addEventListener("click", () => {
    const n = ui.getNumberOfButtons();
    game.startGame(n);
});
