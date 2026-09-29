const http = require("http");
const url = require("url");
const fs = require("fs");
const path = require("path");
const Utils = require("./modules/utils");
const langMap = require("./lang/en/en.json");

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query;

    if (pathname === "/COMP4537/labs/4/getDate/" || pathname === "/COMP4537/labs/4/getDate") {
        const name = query.name || "Guest";
        const dateStr = Utils.getDate();
        let message = langMap.greeting;
        message = message.replace("%1", name).replace("%2", dateStr);
        const htmlResponse = `<span style="color:blue">${message}</span>`;
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(htmlResponse);
        return;
    }

    if (pathname === "/COMP4537/labs/4/writeFile/" || pathname === "/COMP4537/labs/4/writeFile") {
        const textToAppend = query.text || "";
        const filePath = path.join(__dirname, "file.txt");
        fs.appendFile(filePath, textToAppend + "\n", (err) => {
            if (err) {
                res.writeHead(500, { "Content-Type": "text/plain" });
                res.end("Error writing to file");
                return;
            }
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(`Appended text to file.txt`);
        });
        return;
    }

    if (pathname.startsWith("/COMP4537/labs/4/readFile/")) {
        const parts = pathname.split("/");
        const filename = parts[parts.length - 1]; 
        if (!filename) {
            res.writeHead(400, { "Content-Type": "text/plain" });
            res.end("Bad Request: Missing filename");
            return;
        }
        const filePath = path.join(__dirname, filename);
        fs.readFile(filePath, "utf8", (err, data) => {
            if (err) {
                res.writeHead(404, { "Content-Type": "text/plain" });
                res.end(`404 Error: File '${filename}' does not exist.`);
                return;
            }
            res.writeHead(200, { "Content-Type": "text/plain" });
            res.end(data);
        });
        return;
    }

    res.writeHead(404, { "Content-Type": "text/html" });
    res.end("<h1>404 Not Found</h1>");
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
