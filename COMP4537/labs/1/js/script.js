import { UserInterface } from "./UserInterface.js";
import { STRINGS } from "../lang/en/strings.js";

const ui = new UserInterface();

// testing buttons
ui.goButton.addEventListener("click", () => {
    const n = ui.getNumberOfButtons();
    ui.displayMessage(`You entered: ${n}`);
    console.log("Browser dimensions:", ui.getBrowserDimensions());
});
