/**
 * Reader class - handles the reader page logic.
 * Retrieves notes from localStorage every 2 seconds
 * and displays them as read-only textareas.
 */
class Reader {
  constructor() {
    this.container = document.getElementById("notes-container");
    this.timestampEl = document.getElementById("timestamp");

    // Set the page title
    document.getElementById("page-title").textContent = MESSAGES.READER_TITLE;

    this.createBackButton();
    this.refresh(); // do an initial load right away
    this.startAutoRefresh();
  }

  // Poll localStorage every 2 seconds
  startAutoRefresh() {
    setInterval(() => {
      this.refresh();
    }, 2000);
  }

  // Read notes from localStorage and re-render
  refresh() {
    const stored = localStorage.getItem(MESSAGES.STORAGE_KEY);
    this.container.innerHTML = "";

    if (stored) {
      const parsed = JSON.parse(stored);
      const notes = parsed.map((item) => new Note(item.text));

      notes.forEach((note) => {
        this.createNoteRow(note.text);
      });
    }

    this.updateTimestamp();
  }

  // Create a read-only textarea row (no remove button)
  createNoteRow(text) {
    const row = document.createElement("div");
    row.className = "note-row";

    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.readOnly = true;
    row.appendChild(textarea);

    this.container.appendChild(row);
  }

  // Update the "updated at" timestamp
  updateTimestamp() {
    const now = new Date();
    this.timestampEl.textContent = MESSAGES.UPDATED_AT + this.formatTime(now);
  }

  // Format time to readable string
  formatTime(date) {
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const seconds = String(date.getSeconds()).padStart(2, "0");
    const ampm = hours >= 12 ? MESSAGES.TIME_PM : MESSAGES.TIME_AM;
    hours = hours % 12 || 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  }

  // Create the "Back" button
  createBackButton() {
    const backBtn = document.createElement("button");
    backBtn.textContent = MESSAGES.BACK;
    backBtn.className = "action-btn back-btn";
    backBtn.id = "back-btn";
    backBtn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
    this.container.parentElement.appendChild(backBtn);
  }
}

// Initialize reader when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const reader = new Reader();
});
