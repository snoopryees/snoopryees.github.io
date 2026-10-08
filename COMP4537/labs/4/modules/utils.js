export default class Utils {
    static getDate() {
        return new Date().toString();
    }

    // Prevent user input from being interpreted as HTML (e.g. ?name=<script>...)
    static escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }
}
