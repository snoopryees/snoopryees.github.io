import { STRINGS } from "../lang/messages/en/user.js";

export class PatientUI {
    constructor(rootElement) {
        this.root = rootElement;
    }

    render() {
        document.title = STRINGS.PAGE_TITLE;

        const header = this.createElement("header", "page-header");
        header.appendChild(this.createElement("h1", "", STRINGS.APP_TITLE));
        header.appendChild(this.createElement("p", "subtitle", STRINGS.SUBTITLE));
        this.root.appendChild(header);

        const main = this.createElement("main", "layout");
        main.appendChild(this.buildInsertCard());
        main.appendChild(this.buildQueryCard());
        main.appendChild(this.buildResponseCard());
        this.root.appendChild(main);
    }

    buildInsertCard() {
        const card = this.createElement("section", "card");
        card.appendChild(this.createElement("h2", "", STRINGS.INSERT_HEADING));
        card.appendChild(this.createElement("p", "muted", STRINGS.INSERT_DESC));

        this.insertBtn = this.createElement("button", "btn btn-primary", STRINGS.INSERT_BTN);
        this.insertBtn.type = "button";
        card.appendChild(this.insertBtn);
        return card;
    }

    buildQueryCard() {
        const card = this.createElement("section", "card");
        card.appendChild(this.createElement("h2", "", STRINGS.QUERY_HEADING));

        const label = this.createElement("label", "field-label", STRINGS.QUERY_LABEL);
        label.htmlFor = "sql-query";
        card.appendChild(label);

        this.queryInput = this.createElement("textarea", "sql-input");
        this.queryInput.id = "sql-query";
        this.queryInput.rows = 5;
        this.queryInput.spellcheck = false;
        this.queryInput.placeholder = STRINGS.QUERY_PLACEHOLDER;
        this.queryInput.setAttribute("aria-describedby", "sql-hint");
        card.appendChild(this.queryInput);

        const hint = this.createElement("p", "hint", STRINGS.QUERY_HINT);
        hint.id = "sql-hint";
        card.appendChild(hint);

        this.submitBtn = this.createElement("button", "btn btn-primary", STRINGS.SUBMIT_BTN);
        this.submitBtn.type = "button";
        card.appendChild(this.submitBtn);
        return card;
    }

    buildResponseCard() {
        const card = this.createElement("section", "card card-wide");
        card.appendChild(this.createElement("h2", "", STRINGS.RESPONSE_HEADING));

        this.responseArea = this.createElement("div", "response");
        this.responseArea.setAttribute("aria-live", "polite");
        card.appendChild(this.responseArea);

        this.showMessage(STRINGS.RESPONSE_EMPTY, "idle");
        return card;
    }

    setBusy(isBusy) {
        this.insertBtn.disabled = isBusy;
        this.submitBtn.disabled = isBusy;
        if (isBusy) {
            this.showMessage(STRINGS.SENDING, "idle");
        }
    }

    // state is one of: "idle", "success", "error"
    showMessage(text, state, status) {
        this.responseArea.replaceChildren();

        const message = this.createElement("p", `message message-${state}`);
        if (status !== undefined) {
            message.appendChild(this.createElement("span", "status", `${STRINGS.STATUS_PREFIX}${status}`));
        }
        message.appendChild(document.createTextNode(text));
        this.responseArea.appendChild(message);
    }

    showRows(rows, status) {
        if (rows.length === 0) {
            this.showMessage(STRINGS.NO_ROWS, "success", status);
            return;
        }

        this.showMessage(`${rows.length} ${STRINGS.ROWS_RETURNED}`, "success", status);

        const columns = Object.keys(rows[0]);
        const wrapper = this.createElement("div", "table-wrap");
        const table = this.createElement("table");

        const headRow = this.createElement("tr");
        columns.forEach(col => {
            const th = this.createElement("th", "", col);
            th.scope = "col";
            headRow.appendChild(th);
        });
        const thead = this.createElement("thead");
        thead.appendChild(headRow);
        table.appendChild(thead);

        const tbody = this.createElement("tbody");
        rows.forEach(row => {
            const tr = this.createElement("tr");
            columns.forEach(col => {
                tr.appendChild(this.createElement("td", "", this.formatCell(row[col])));
            });
            tbody.appendChild(tr);
        });
        table.appendChild(tbody);

        wrapper.appendChild(table);
        this.responseArea.appendChild(wrapper);
    }

    formatCell(value) {
        if (value === null || value === undefined) {
            return "NULL";
        }
        if (typeof value === "object") {
            return JSON.stringify(value);
        }
        return String(value);
    }

    createElement(tag, className, text) {
        const el = document.createElement(tag);
        if (className) {
            el.className = className;
        }
        if (text !== undefined) {
            el.textContent = text;
        }
        return el;
    }
}
