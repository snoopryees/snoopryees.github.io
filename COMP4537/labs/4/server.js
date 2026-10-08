import http from "http";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import Utils from "./modules/utils.js";
import messages from "./lang/en/en.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class Lab4Server {
    static BASE = "/COMP4537/labs/4";

    constructor(port) {
        this.port = port;
        this.dataDir = path.join(__dirname, "data"); // only files in here can be read/written
        fs.mkdirSync(this.dataDir, { recursive: true });
        this.server = http.createServer((req, res) => this.handleRequest(req, res));
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`Server running on port ${this.port}`);
        });
    }

    handleRequest(req, res) {
        const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
        const pathname = url.pathname.replace(/\/+$/, ""); // ignore trailing slash

        if (req.method !== "GET") {
            return this.send(res, 405, "text/plain", "Method Not Allowed");
        }

        if (pathname === `${Lab4Server.BASE}/getDate`) {
            return this.getDate(res, url.searchParams);
        }
        if (pathname === `${Lab4Server.BASE}/writeFile`) {
            return this.writeFile(res, url.searchParams);
        }
        if (pathname.startsWith(`${Lab4Server.BASE}/readFile/`)) {
            let fileName;
            try {
                fileName = decodeURIComponent(pathname.slice(`${Lab4Server.BASE}/readFile/`.length));
            } catch {
                return this.send(res, 400, "text/plain", "Bad Request: malformed file name");
            }
            return this.readFile(res, fileName);
        }

        this.send(res, 404, "text/html", "<h1>404 Not Found</h1>");
    }

    // Part B
    getDate(res, params) {
        const name = Utils.escapeHtml(params.get("name") || "Guest");
        const message = messages.greeting
            .replace("%1", name)
            .replace("%2", Utils.getDate());
        this.send(res, 200, "text/html", `<p style="color:blue">${message}</p>`);
    }

    // Part C.1 - appendFile creates the file if it doesn't exist, otherwise appends
    writeFile(res, params) {
        const text = params.get("text");
        if (!text) {
            return this.send(res, 400, "text/plain", "Bad Request: missing ?text= parameter");
        }
        fs.appendFile(path.join(this.dataDir, "file.txt"), text + "\n", (err) => {
            if (err) {
                return this.send(res, 500, "text/plain", "Error writing to file");
            }
            this.send(res, 200, "text/html",
                `Appended "${Utils.escapeHtml(text)}" to file.txt`);
        });
    }

    // Part C.2
    readFile(res, fileName) {
        // basename() stops requests like readFile/../server.js from escaping the data folder
        const safeName = path.basename(fileName);
        if (!safeName) {
            return this.send(res, 400, "text/plain", "Bad Request: missing file name");
        }
        fs.readFile(path.join(this.dataDir, safeName), "utf8", (err, data) => {
            if (err) {
                return this.send(res, 404, "text/html",
                    `<h1>404 Not Found</h1><p>File "${Utils.escapeHtml(fileName)}" does not exist.</p>`);
            }
            // text/plain + no Content-Disposition => browser displays it instead of downloading
            this.send(res, 200, "text/plain; charset=utf-8", data);
        });
    }

    send(res, status, contentType, body) {
        res.writeHead(status, { "Content-Type": contentType });
        res.end(body);
    }
}

new Lab4Server(process.env.PORT || 3000).start();
