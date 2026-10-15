export class ApiClient {
    constructor(endpoint) {
        this.endpoint = endpoint;
    }

    insertPatients() {
        return this.request(this.endpoint, { method: "POST" });
    }

    runQuery(sql) {
        return this.request(`${this.endpoint}/${encodeURIComponent(sql)}`, { method: "GET" });
    }

    async request(url, options) {
        let response;
        try {
            response = await fetch(url, options);
        } catch (err) {
            return { ok: false, status: 0, body: null, networkError: true };
        }

        let body = null;
        try {
            body = await response.json();
        } catch (err) {
            body = null;
        }
        return { ok: response.ok, status: response.status, body, networkError: false };
    }
}
