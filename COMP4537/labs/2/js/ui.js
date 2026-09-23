/**
 * UI class - handles common UI tasks like setting titles, timestamps, and creating buttons.
 */
class UI {
  constructor() {
    this.timestampEl = document.getElementById("timestamp");
    this.pageTitleEl = document.getElementById("page-title");
  }

  setPageTitle(title) {
    if (this.pageTitleEl) {
      this.pageTitleEl.textContent = title;
    }
  }

  updateTimestamp(prefixText) {
    if (this.timestampEl) {
      const now = new Date();
      this.timestampEl.textContent = prefixText + this.formatTime(now);
    }
  }

  formatTime(date) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? MESSAGES.TIME_PM : MESSAGES.TIME_AM;
    hours = hours % 12 || 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  }

  createButton(text, className, id, onClick) {
    const btn = document.createElement("button");
    btn.textContent = text;
    if (className) btn.className = className;
    if (id) btn.id = id;
    if (onClick) btn.addEventListener("click", onClick);
    return btn;
  }
}
