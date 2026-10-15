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
        this.ui.insertBtn.addEventListener("click", () => this.send(() => this.api.insertPatients()));
        this.ui.submitBtn.addEventListener("click", () => this.handleQuery());
    }

    handleQuery() {
        const sql = this.ui.queryInput.value.trim();
        if (sql === "") {
            this.ui.showMessage(STRINGS.EMPTY_QUERY);
            return;
        }
        this.send(() => this.api.runQuery(sql));
    }

    async send(makeRequest) {
        this.ui.setBusy(true);
        try {
            const result = await makeRequest();
            if (result.networkError) {
                this.ui.showMessage(STRINGS.NETWORK_ERROR);
            } else if (!result.body) {
                this.ui.showMessage(STRINGS.UNEXPECTED_RESPONSE);
            } else {
                this.ui.showResponse(result.body);
            }
        } finally {
            this.ui.setBusy(false);
        }
    }
}

const ui = new PatientUI(document.getElementById("app"));
const api = new ApiClient(Config.endpoint);
new App(ui, api).start();

// Claude was used to help develop this code.
