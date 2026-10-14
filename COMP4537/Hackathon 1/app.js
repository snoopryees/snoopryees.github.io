class GeminiClient {
    static ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
    static RETRYABLE = new Set([429, 500, 503]);

    constructor(apiKey, models) {
        this.apiKey = apiKey;
        this.models = models.filter(Boolean);
    }

    // Tries each model in turn; overloaded models get one retry before moving to the next.
    async generate({ system, contents }) {
        let lastError;
        for (const model of this.models) {
            for (let attempt = 1; attempt <= 2; attempt++) {
                const res = await fetch(`${GeminiClient.ENDPOINT}/${model}:generateContent`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "x-goog-api-key": this.apiKey,
                    },
                    body: JSON.stringify({
                        systemInstruction: { parts: [{ text: system }] },
                        contents,
                        generationConfig: { temperature: 0.2 },
                    }),
                });
                const data = await res.json().catch(() => ({}));

                if (res.ok) return { ...data, modelVersion: data.modelVersion || model };

                lastError = new Error(data.error?.message || `Request failed with status ${res.status}.`);
                if (!GeminiClient.RETRYABLE.has(res.status)) throw lastError;
                if (attempt === 1) await new Promise((r) => setTimeout(r, 1000));
            }
        }
        throw lastError;
    }
}

// Splits a document into public and secret segments.
// Secrets are either [SECRET]...[/SECRET] blocks or a line like: the secret is: "..."
class SecretDocument {
    static OPEN = "[SECRET]";
    static CLOSE = "[/SECRET]";

    constructor(text) {
        this.text = text;
        this.unclosed = false;

        const ranges = [];
        for (const m of text.matchAll(/\[SECRET\]([\s\S]*?)(\[\/SECRET\]|$)/gi)) {
            ranges.push({ start: m.index, end: m.index + m[0].length, kind: "block", secret: m[1] });
            if (!m[2]) this.unclosed = true;
        }
        for (const m of text.matchAll(/^[^\n]*\bthe secret is\b[^\n]*$/gim)) {
            const start = m.index;
            const end = start + m[0].length;
            if (ranges.some((r) => start < r.end && end > r.start)) continue;
            ranges.push({ start, end, kind: "line", secret: SecretDocument.extractSentence(m[0]) || m[0] });
        }
        ranges.sort((a, b) => a.start - b.start);

        this.segments = [];   // { text, secret?, kind? }
        let last = 0;
        for (const r of ranges) {
            if (r.start > last) this.segments.push({ text: text.slice(last, r.start) });
            this.segments.push({ text: text.slice(r.start, r.end), secret: r.secret, kind: r.kind });
            last = r.end;
        }
        if (last < text.length) this.segments.push({ text: text.slice(last) });
    }

    // Pulls the sentence out of: the secret is: "Copper lanterns guide the ferry."
    static extractSentence(line) {
        const after = line.replace(/^[\s\S]*?\bthe secret is\b\s*[:=\-–—]?\s*/i, "");
        const quoted = after.match(/^["“'‘«](.+)["”'’»]/);
        return (quoted ? quoted[1] : after.replace(/[.\s]+$/, "")).trim();
    }

    get secrets() {
        return this.segments.filter((s) => s.secret?.trim()).map((s) => s.secret);
    }

    get publicText() {
        return this.segments.filter((s) => !s.kind).map((s) => s.text).join("\n");
    }

    // The version sent to the model when secrets are withheld.
    get redactedText() {
        return this.segments.map((s) => {
            if (s.kind === "line") return "The secret is: [REDACTED]";
            if (s.kind === "block") return "[REDACTED]";
            return s.text;
        }).join("");
    }

    static countWords(s) {
        return s.trim() ? s.trim().split(/\s+/).length : 0;
    }
}

// Last line of defence: blocks replies that echo restricted text even if the model ignores its rules.
// Catches the exact sentence, its letters reversed or spaced out, base64 copies, and distinctive words.
class LeakGuard {
    static STOPWORDS = new Set(("about above after again also because before being below between both could " +
        "does doing down during each every from further have having here into just more most much must only other " +
        "over same should some such than that their them then there these they this those through under until very " +
        "what when where which while will with would your yours").split(" "));

    static normalize(s) {
        return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
    }

    static compact(s) {
        return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
    }

    static decodeBase64(s) {
        const decoded = [];
        for (const m of s.matchAll(/[A-Za-z0-9+/]{12,}={0,2}/g)) {
            try {
                decoded.push(atob(m[0].padEnd(Math.ceil(m[0].length / 4) * 4, "=")));
            } catch { /* not base64 */ }
        }
        return decoded;
    }

    constructor(doc) {
        const publicNorm = ` ${LeakGuard.normalize(doc.publicText)} `;
        const isPublic = (s) => publicNorm.includes(` ${s} `);
        this.compacts = new Set();      // whole secret, punctuation and spacing removed
        this.phrases = new Set();       // runs of consecutive secret words
        this.strongTerms = new Set();   // one match is enough: names, figures
        this.weakTerms = new Set();     // two different matches needed: other uncommon words

        for (const secret of doc.secrets) {
            const words = LeakGuard.normalize(secret).split(" ").filter(Boolean);
            const short = words.length < 40;
            const compact = LeakGuard.compact(secret);
            if (short && compact.length >= 8) this.compacts.add(compact);

            const n = Math.min(short ? 4 : 5, words.length);
            for (let i = 0; i + n <= words.length; i++) {
                const phrase = words.slice(i, i + n).join(" ");
                if (n >= 3 && !isPublic(phrase)) this.phrases.add(phrase);
            }

            for (const line of secret.split("\n")) {
                const raws = line.split(/\s+/).filter(Boolean);
                raws.forEach((raw, i) => {
                    const token = raw.replace(/^[^\p{L}\p{N}$]+|[^\p{L}\p{N}%]+$/gu, "");
                    const term = LeakGuard.normalize(token);
                    if (!term || isPublic(term)) return;
                    const midSentence = i > 0 && !/[.:;!?]$/.test(raws[i - 1]);
                    const isFigure = /\d/.test(token) && token.replace(/\D/g, "").length >= 3 && !/^(19|20)\d\d$/.test(token);
                    const isName = midSentence && /^\p{Lu}\p{Ll}/u.test(token) && token.length >= 4;
                    if (isFigure || isName) this.strongTerms.add(term);
                    else if (short && term.length >= 4 && !LeakGuard.STOPWORDS.has(term)) this.weakTerms.add(term);
                });
            }
        }
    }

    check(answer) {
        for (const text of [answer, ...LeakGuard.decodeBase64(answer)]) {
            const encoded = text !== answer ? " (base64)" : "";
            const compact = LeakGuard.compact(text);
            for (const c of this.compacts) {
                if (compact.includes(c)) return { leaked: true, reason: `secret text${encoded}` };
                if (compact.includes([...c].reverse().join(""))) return { leaked: true, reason: `secret text reversed${encoded}` };
            }
            const norm = ` ${LeakGuard.normalize(text)} `;
            for (const phrase of this.phrases) {
                if (norm.includes(` ${phrase} `)) return { leaked: true, reason: `phrase from secret${encoded}` };
            }
            for (const term of this.strongTerms) {
                if (norm.includes(` ${term} `)) return { leaked: true, reason: `name or figure from secret${encoded}` };
            }
            const weakHits = [...this.weakTerms].filter((t) => norm.includes(` ${t} `));
            if (weakHits.length >= 2) return { leaked: true, reason: `words from secret${encoded}` };
        }
        return { leaked: false };
    }
}

class DocumentPanel {
    static MAX_BYTES = 3 * 1024 * 1024;

    constructor(onChange) {
        this.onChange = onChange;
        this.input = document.getElementById("doc-input");
        this.preview = document.getElementById("doc-preview");
        this.notice = document.getElementById("doc-notice");
        this.tabPreview = document.getElementById("tab-preview");
        this.tabEdit = document.getElementById("tab-edit");
        this.dropZone = document.getElementById("drop-zone");
        this.redactToggle = document.getElementById("redact-toggle");
        this.doc = new SecretDocument("");

        this.tabPreview.addEventListener("click", () => this.showTab("preview"));
        this.tabEdit.addEventListener("click", () => this.showTab("edit"));
        document.querySelector('[role="tablist"]').addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
                const next = this.tabPreview.getAttribute("aria-selected") === "true" ? "edit" : "preview";
                this.showTab(next);
                (next === "edit" ? this.tabEdit : this.tabPreview).focus();
            }
        });

        this.input.addEventListener("input", () => this.refresh());
        this.redactToggle.addEventListener("change", () => this.onChange(this.doc, this.redact));
        document.getElementById("mark-btn").addEventListener("click", () => this.markSelection());
        document.getElementById("sample-btn").addEventListener("click", () => this.load(SAMPLE_DOCUMENT, "Sample handbook loaded."));
        document.getElementById("file-input").addEventListener("change", (e) => {
            this.loadFile(e.target.files[0]);
            e.target.value = "";
        });

        this.dropZone.addEventListener("dragover", (e) => {
            e.preventDefault();
            this.dropZone.classList.add("is-dragging");
        });
        this.dropZone.addEventListener("dragleave", () => this.dropZone.classList.remove("is-dragging"));
        this.dropZone.addEventListener("drop", (e) => {
            e.preventDefault();
            this.dropZone.classList.remove("is-dragging");
            this.loadFile(e.dataTransfer.files[0]);
        });
    }

    get redact() {
        return this.redactToggle.checked;
    }

    showTab(name) {
        const edit = name === "edit";
        this.tabPreview.setAttribute("aria-selected", String(!edit));
        this.tabEdit.setAttribute("aria-selected", String(edit));
        this.tabPreview.tabIndex = edit ? -1 : 0;
        this.tabEdit.tabIndex = edit ? 0 : -1;
        document.getElementById("doc-preview").hidden = edit;
        document.getElementById("doc-edit").hidden = !edit;
    }

    setNotice(message, isError = false) {
        this.notice.textContent = message;
        this.notice.classList.toggle("is-error", isError);
        this.notice.hidden = !message;
    }

    load(text, message) {
        this.input.value = text;
        this.refresh();
        this.showTab("preview");
        const found = this.doc.secrets.length;
        const detail = found
            ? `Found ${found} secret ${found === 1 ? "part" : "parts"}, highlighted below.`
            : 'No secret found. Add a line like  the secret is: "…"  or mark text in the Edit tab.';
        this.setNotice(message ? `${message} ${detail}` : "", !found && Boolean(message));
    }

    async loadFile(file) {
        if (!file) return;
        if (file.size > DocumentPanel.MAX_BYTES) {
            this.setNotice(`${file.name} is larger than 3 MB. Split it or trim it, then try again.`, true);
            return;
        }
        const text = await file.text();
        if (text.includes("\u0000")) {
            this.setNotice(`${file.name} isn't a plain text file. Upload a .txt or .md file, or paste the text into Edit.`, true);
            return;
        }
        this.load(text, `Loaded ${file.name}.`);
    }

    markSelection() {
        this.showTab("edit");
        const { selectionStart: start, selectionEnd: end, value } = this.input;
        if (start === end) {
            this.setNotice("Select the text you want to hide in the Edit tab, then press Mark selection secret.");
            this.input.focus();
            return;
        }
        const wrapped = `${SecretDocument.OPEN}\n${value.slice(start, end)}\n${SecretDocument.CLOSE}`;
        this.input.setRangeText(wrapped, start, end, "end");
        this.refresh();
        this.setNotice("Selection marked as secret.");
        this.input.focus();
    }

    refresh() {
        this.doc = new SecretDocument(this.input.value);
        this.renderPreview();
        this.renderStats();
        if (this.doc.unclosed) {
            this.setNotice("A [SECRET] tag has no matching [/SECRET]. Everything after it is treated as secret.", true);
        }
        this.onChange(this.doc, this.redact);
    }

    renderPreview() {
        if (!this.doc.text.trim()) {
            this.preview.innerHTML = '<p class="empty">No document yet. Upload a text file, paste one in the Edit tab, or press Load sample.</p>';
            return;
        }
        const frag = document.createDocumentFragment();
        const segs = this.doc.segments;
        segs.forEach((seg, i) => {
            if (!seg.kind) {
                // Block-level secret marks bring their own spacing, so drop adjacent blank lines.
                let text = seg.text;
                if (segs[i - 1]?.kind) text = text.replace(/^\s*\n/, "");
                if (segs[i + 1]?.kind) text = text.replace(/\n\s*$/, "");
                frag.append(text);
                return;
            }
            const mark = document.createElement("mark");
            mark.className = "secret";
            const tag = document.createElement("span");
            tag.className = "secret-tag";
            tag.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-lock"/></svg>' +
                (seg.kind === "line" ? "Secret line · never revealed" : "Secret block · never revealed");
            mark.append(tag, document.createElement("br"), seg.text.trim().replace(/^\[SECRET\]|\[\/SECRET\]$/gi, "").trim());
            frag.append(mark);
        });
        this.preview.replaceChildren(frag);
    }

    renderStats() {
        const fmt = (n) => n.toLocaleString();
        document.getElementById("stat-words").textContent = fmt(SecretDocument.countWords(this.doc.text));
        document.getElementById("stat-tokens").textContent = `~${fmt(Math.ceil(this.doc.text.length / 4))}`;
        document.getElementById("stat-secrets").textContent = fmt(this.doc.secrets.length);
        document.getElementById("stat-secret-words").textContent = fmt(
            this.doc.secrets.reduce((sum, s) => sum + SecretDocument.countWords(s), 0)
        );
    }
}

class ChatPanel {
    constructor(client) {
        this.client = client;
        this.history = [];
        this.doc = new SecretDocument("");
        this.redact = true;
        this.guard = new LeakGuard(this.doc);
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

    setDocument(doc, redact) {
        this.doc = doc;
        this.redact = redact;
        this.guard = new LeakGuard(doc);
    }

    reset() {
        this.history = [];
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
        if (!this.doc.text.trim()) {
            this.addUserMessage(question);
            this.renderError(this.addBotMessage(), "There's no document loaded. Upload or paste one first.");
            return;
        }

        this.busy = true;
        this.askBtn.disabled = true;
        this.empty.hidden = true;
        this.resetBtn.disabled = false;
        this.input.value = "";
        this.addUserMessage(question);
        const card = this.addBotMessage();

        const redacted = this.redact && this.doc.secrets.length > 0;
        const docText = redacted ? this.doc.redactedText : this.doc.text;
        const userTurn = { role: "user", parts: [{ text: question }] };
        const started = performance.now();
        try {
            const data = await this.client.generate({
                system: buildSystemPrompt(docText),
                contents: [...this.history, userTurn],
            });
            const candidate = data.candidates?.[0];
            let text = candidate?.content?.parts?.filter((p) => !p.thought).map((p) => p.text || "").join("").trim();
            if (!text) {
                const reason = candidate?.finishReason || data.promptFeedback?.blockReason || "unknown";
                throw new Error(`The model returned no text (reason: ${reason}). Try rewording the question.`);
            }

            const verdict = this.guard.check(text);
            if (verdict.leaked) text = REFUSAL;

            // Only the filtered text goes into history, so a leaked reply never reaches later turns.
            this.history.push(userTurn, { role: "model", parts: [{ text }] });
            this.renderAnswer(card, text, {
                verdict,
                redacted,
                latency: Math.round(performance.now() - started),
                usage: data.usageMetadata || {},
                model: data.modelVersion,
            });
        } catch (err) {
            this.renderError(card, err.message);
        } finally {
            this.busy = false;
            this.askBtn.disabled = false;
            this.scrollToEnd();
        }
    }

    renderAnswer(card, text, { verdict, redacted, latency, usage, model }) {
        card.removeAttribute("aria-busy");
        card.classList.toggle("is-blocked", verdict.leaked);
        card.querySelector(".msg-body").innerHTML = DOMPurify.sanitize(marked.parse(text));

        const meta = document.createElement("div");
        meta.className = "msg-meta";
        const badge = verdict.leaked
            ? `<span class="badge badge-blocked">Blocked: ${verdict.reason}</span>`
            : '<span class="badge badge-ok">Leak filter passed</span>';
        const mode = redacted ? '<span class="badge badge-muted">Secret withheld from model</span>' : "";
        meta.innerHTML = `${badge}${mode}<span>${DOMPurify.sanitize(model)}</span><span>${latency.toLocaleString()} ms</span>` +
            `<span>${usage.promptTokenCount ?? "—"} in</span><span>${usage.candidatesTokenCount ?? "—"} out</span>`;
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

const settings = typeof CONFIG === "undefined" ? {} : CONFIG;
const chat = new ChatPanel(new GeminiClient(
    settings.GEMINI_API_KEY,
    [settings.GEMINI_MODEL, ...(settings.GEMINI_FALLBACK_MODELS || [])]
));
const docs = new DocumentPanel((doc, redact) => chat.setDocument(doc, redact));
docs.load(SAMPLE_DOCUMENT, "");

if (!settings.GEMINI_API_KEY) {
    document.getElementById("chat-empty").innerHTML =
        '<p class="error">No API key found. Copy <code>config.example.js</code> to <code>config.js</code> and add your Gemini key.</p>';
    document.getElementById("ask-btn").disabled = true;
} else {
    document.getElementById("model-name").textContent = settings.GEMINI_MODEL;
}
