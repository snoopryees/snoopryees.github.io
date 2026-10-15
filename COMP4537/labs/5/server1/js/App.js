import { Config } from "./Config.js";
import { ApiClient } from "./ApiClient.js";
import { PatientUI } from "./PatientUI.js";
import { STRINGS } from "../lang/messages/en/user.js";

class App {
    constructor(ui, api) {
        this.ui = ui;
        this.api = api;
    }

    start() {
        this.ui.render();
        this.ui.insertBtn.addEventListener("click", () => this.handleInsert());
        this.ui.submitBtn.addEventListener("click", () => this.handleQuery());
        this.ui.queryInput.addEventListener("keydown", e => {
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                this.handleQuery();
            }
        });
    }

    handleInsert() {
        this.send(() => this.api.insertPatients());
    }

    handleQuery() {
        const sql = this.ui.queryInput.value.trim();
        if (sql === "") {
            this.ui.showMessage(STRINGS.EMPTY_QUERY, "error");
            this.ui.queryInput.focus();
            return;
        }
        this.send(() => this.api.runQuery(sql));
    }

    // Runs one request at a time so a keyboard shortcut can't overlap a pending click
    async send(makeRequest) {
        if (this.busy) {
            return;
        }
        this.busy = true;
        this.ui.setBusy(true);
        try {
            const result = await makeRequest();
            this.displayResult(result);
        } finally {
            this.busy = false;
            this.ui.setBusy(false);
        }
    }

    displayResult(result) {
        if (result.networkError) {
            this.ui.showMessage(STRINGS.NETWORK_ERROR, "error");
            return;
        }

        const body = result.body;
        if (!body) {
            this.ui.showMessage(STRINGS.UNEXPECTED_RESPONSE, "error", result.status);
            return;
        }

        if (result.ok && Array.isArray(body.data)) {
            this.ui.showRows(body.data, result.status);
        } else {
            const state = result.ok ? "success" : "error";
            this.ui.showMessage(body.message || STRINGS.UNEXPECTED_RESPONSE, state, result.status);
        }
    }
}

const ui = new PatientUI(document.getElementById("app"));
const api = new ApiClient(Config.endpoint);
new App(ui, api).start();

// Claude was used to help develop this code.
