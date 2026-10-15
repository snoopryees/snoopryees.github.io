export class Config {
    // Replace with the hosted server2 URL (no trailing slash)
    static API_BASE = "https://fabulous-delight-production-25d9.up.railway.app";
    static API_PATH = "/COMP4537/labs/5/api/v1/sql";

    static get endpoint() {
        return `${Config.API_BASE}${Config.API_PATH}`;
    }
}
