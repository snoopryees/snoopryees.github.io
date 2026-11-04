// Talks only to our own server. The page never holds the secret, the full prompt or the API key.
class ApiClient {
    // On GitHub Pages there is no backend, so calls go to Railway. Served by our own server, paths stay relative.
    static BASE = location.hostname.endsWith("github.io")
        ? "https://comp4537-hackaton-production.up.railway.app/"
        : "";

    async request(path, options) {
        const res = await fetch(ApiClient.BASE + path, options);
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error?.message || `Request failed with status ${res.status}.`);
        return data;
    }

    ask(question) {
        return this.request("api/ask", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ question }),
        });
    }

    verify(secret) {
        return this.request("api/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ secret }),
        });
    }

    status() {
        return this.request("api/status");
    }

    document() {
        return this.request("api/document");
    }
}

// Shows the standard file as stored, with the placeholder drawn as a locked box.
class DocumentPanel {
    constructor() {
        this.preview = document.getElementById("doc-preview");
    }

    render({ name, template, placeholder, placeholderCount }) {
        document.getElementById("doc-name").textContent = name;
        const frag = document.createDocumentFragment();
        template.split(placeholder).forEach((part, i) => {
            if (i > 0) {
                const mark = document.createElement("mark");
                mark.className = "secret";
                mark.title = `${placeholder}: replaced with the team secret on the server`;
                mark.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-lock"/></svg>Team secret';
                frag.append(mark);
            }
            frag.append(part);
        });
        this.preview.replaceChildren(frag);

        const fmt = (n) => n.toLocaleString();
        document.getElementById("stat-words").textContent = fmt(template.trim().split(/\s+/).length);
        document.getElementById("stat-chars").textContent = fmt(template.length);
        document.getElementById("stat-tokens").textContent = `~${fmt(Math.ceil(template.length / 4))}`;
        document.getElementById("stat-placeholders").textContent = fmt(placeholderCount);
    }

    showError(message) {
        this.preview.innerHTML = "";
        const p = document.createElement("p");
        p.className = "error";
        p.textContent = message;
        this.preview.append(p);
    }
}

class ChatPanel {
    constructor(client) {
        this.client = client;
        this.busy = false;

        this.log = document.getElementById("chat-log");
        this.empty = document.getElementById("chat-empty");
        this.form = document.getElementById("ask-form");
        this.input = document.getElementById("question-input");
        this.askBtn = document.getElementById("ask-btn");
        this.resetBtn = document.getElementById("reset-btn");

        this.form.addEventListener("submit", (e) => {
            e.preventDefault();
            this.ask(this.input.value);
        });
        this.input.addEventListener("keydown", (e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
                e.preventDefault();
                this.form.requestSubmit();
            }
        });
        document.getElementById("suggestions").addEventListener("click", (e) => {
            const chip = e.target.closest(".chip");
            if (chip) this.ask(chip.textContent);
        });
        this.resetBtn.addEventListener("click", () => this.reset());
    }

    reset() {
        this.log.replaceChildren(this.empty);
        this.empty.hidden = false;
        this.resetBtn.disabled = true;
        this.input.focus();
    }

    addUserMessage(text) {
        const el = document.createElement("div");
        el.className = "msg msg-user";
        el.textContent = text;
        this.log.append(el);
    }

    addBotMessage() {
        const el = document.createElement("article");
        el.className = "msg msg-bot";
        el.setAttribute("aria-busy", "true");
        el.innerHTML = '<div class="msg-body"><div class="skeleton" aria-label="Reading the document"><span></span><span></span><span></span></div></div>';
        this.log.append(el);
        this.scrollToEnd();
        return el;
    }

    scrollToEnd() {
        this.log.scrollTop = this.log.scrollHeight;
    }

    async ask(rawQuestion) {
        const question = rawQuestion.trim();
        if (this.busy || !question) return;

        this.busy = true;
        this.askBtn.disabled = true;
        this.empty.hidden = true;
        this.resetBtn.disabled = false;
        this.input.value = "";
        this.addUserMessage(question);
        const card = this.addBotMessage();

        try {
            this.renderAnswer(card, await this.client.ask(question));
        } catch (err) {
            this.renderError(card, err.message);
        } finally {
            this.busy = false;
            this.askBtn.disabled = false;
            this.scrollToEnd();
        }
    }

    renderAnswer(card, { answer, model, promptTokens, outputTokens, ms }) {
        card.removeAttribute("aria-busy");
        card.querySelector(".msg-body").innerHTML = DOMPurify.sanitize(marked.parse(answer));
        if (!model) return;

        const meta = document.createElement("div");
        meta.className = "msg-meta";
        for (const text of [model, `${ms.toLocaleString()} ms`, `${promptTokens ?? "—"} tokens in`, `${outputTokens ?? "—"} out`]) {
            const span = document.createElement("span");
            span.textContent = text;
            meta.append(span);
        }
        card.append(meta);
    }

    renderError(card, message) {
        card.removeAttribute("aria-busy");
        card.classList.add("is-error");
        const p = document.createElement("p");
        p.className = "error";
        p.textContent = message;
        card.querySelector(".msg-body").replaceChildren(p);
    }
}

class VerifyPanel {
    constructor(client) {
        this.client = client;
        this.input = document.getElementById("verify-input");
        this.button = document.getElementById("verify-btn");
        this.result = document.getElementById("verify-result");

        document.getElementById("verify-form").addEventListener("submit", (e) => {
            e.preventDefault();
            this.verify();
        });
    }

    async verify() {
        const secret = this.input.value;
        if (!secret.trim()) {
            this.input.focus();
            return;
        }
        this.button.disabled = true;
        this.result.className = "verify-result";
        this.result.textContent = "Checking…";
        try {
            const data = await this.client.verify(secret);
            if (typeof data.verify !== "string") throw new Error("The verification response was invalid.");
            this.result.textContent = JSON.stringify(data, null, 2);
            this.result.classList.add(data.verify === "Correct" ? "is-correct" : data.verify === "Incorrect" ? "is-incorrect" : "is-hello");
        } catch (err) {
            this.result.textContent = err.message;
            this.result.classList.add("is-incorrect");
        } finally {
            this.button.disabled = false;
        }
    }
}

const api = new ApiClient();
const docs = new DocumentPanel();
new ChatPanel(api);
new VerifyPanel(api);

api.document().then((doc) => docs.render(doc)).catch((err) => docs.showError(`Couldn't load the document: ${err.message}`));

api.status().catch(() => ({ ready: false })).then(({ ready, model, secretConfigured }) => {
    const banner = document.getElementById("config-banner");
    if (!ready) {
        banner.textContent = "The server has no GEMINI_API_KEY set, so questions will fail.";
        banner.hidden = false;
        document.getElementById("ask-btn").disabled = true;
        return;
    }
    document.getElementById("model-name").textContent = model;
    if (!secretConfigured) {
        banner.textContent = "TEAM_SECRET is not set on the server, so a random secret is in use. Set it before the hackathon.";
        banner.hidden = false;
    }
});
