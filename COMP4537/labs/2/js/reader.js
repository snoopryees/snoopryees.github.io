/**
 * Reader class - handles the reader page logic.
 * Retrieves notes from localStorage every 2 seconds
 * and displays them as read-only textareas.
 */
class Reader {
  constructor() {
    this.container = document.getElementById("notes-container");
    this.ui = new UI();

    // Set the page title
    this.ui.setPageTitle(MESSAGES.READER_TITLE);

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
      // Instantiate Note with text, null callbacks, and isReadOnly = true
      const notes = parsed.map((item) => new Note(item.text, null, null, true));

      notes.forEach((note) => {
        this.container.appendChild(note.getElement());
      });
    }

    this.ui.updateTimestamp(MESSAGES.UPDATED_AT);
  }

  // Create the "Back" button
  createBackButton() {
    const backBtn = this.ui.createButton(MESSAGES.BACK, "action-btn back-btn", "back-btn", () => {
      window.location.href = "index.html";
    });
    this.container.parentElement.appendChild(backBtn);
  }
}

// Initialize reader when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const reader = new Reader();
});
