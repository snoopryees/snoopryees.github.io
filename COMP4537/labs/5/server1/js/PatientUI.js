import { STRINGS } from "../lang/messages/en/user.js";

export class PatientUI {
    constructor(rootElement) {
        this.root = rootElement;
    }

    render() {
        document.title = STRINGS.PAGE_TITLE;
        this.root.appendChild(this.createElement("h1", STRINGS.APP_TITLE));

        this.insertBtn = this.createElement("button", STRINGS.INSERT_BTN);
        this.root.appendChild(this.insertBtn);

        this.queryInput = this.createElement("textarea");
        this.queryInput.rows = 5;
        this.queryInput.cols = 60;
        this.queryInput.placeholder = STRINGS.QUERY_PLACEHOLDER;
        this.root.appendChild(this.createElement("p"));
        this.root.lastChild.appendChild(this.queryInput);

        this.submitBtn = this.createElement("button", STRINGS.SUBMIT_BTN);
        this.root.appendChild(this.submitBtn);

        this.responseArea = this.createElement("pre");
        this.root.appendChild(this.responseArea);
    }

    setBusy(isBusy) {
        this.insertBtn.disabled = isBusy;
        this.submitBtn.disabled = isBusy;
    }

    showMessage(text) {
        this.responseArea.textContent = text;
    }

    showResponse(body) {
        this.responseArea.textContent = JSON.stringify(body, null, 2);
    }

    createElement(tag, text) {
        const el = document.createElement(tag);
        if (text !== undefined) {
            el.textContent = text;
        }
        return el;
    }
}
