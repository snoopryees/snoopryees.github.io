/**
 * Writer class - handles the writer page logic.
 * Creates textareas dynamically, saves notes to localStorage,
 * and uses event-driven saving (on input) instead of blind 2s intervals.
 */
class Writer {
  constructor() {
    this.notes = [];
    this.container = document.getElementById("notes-container");
    this.ui = new UI();

    // Set the page title
    this.ui.setPageTitle(MESSAGES.WRITER_TITLE);

    this.loadExistingNotes();
    this.render();
    this.createAddButton();
    this.createBackButton();
  }

  // Load notes from localStorage if they exist
  loadExistingNotes() {
    const stored = localStorage.getItem(MESSAGES.STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      this.notes = parsed.map((item) => this.createNote(item.text));
    }
  }

  // Save current notes to localStorage and update timestamp
  save() {
    // Map the notes array to just the text property for storage
    const notesData = this.notes.map(note => ({ text: note.text }));
    localStorage.setItem(MESSAGES.STORAGE_KEY, JSON.stringify(notesData));
    this.ui.updateTimestamp(MESSAGES.STORED_AT);
  }

  // Create a note with proper callbacks
  createNote(text) {
    return new Note(
      text,
      (noteToRemove) => {
        // Remove callback: remove from array and save
        this.notes = this.notes.filter(n => n !== noteToRemove);
        this.save();
      },
      () => {
        // Save callback: trigger save on input
        this.save();
      }
    );
  }

  // Render all existing notes by appending their elements
  render() {
    this.container.innerHTML = "";
    this.notes.forEach((note) => {
      this.container.appendChild(note.getElement());
    });
  }

  // Create the "Add Note" button
  createAddButton() {
    const addBtn = this.ui.createButton(MESSAGES.ADD_NOTE, "action-btn add-btn", "add-btn", () => {
      const newNote = this.createNote("");
      this.notes.push(newNote);
      this.container.appendChild(newNote.getElement());
      this.save();
    });
    this.container.parentElement.appendChild(addBtn);
  }

  // Create the "Back" button
  createBackButton() {
    const backBtn = this.ui.createButton(MESSAGES.BACK, "action-btn back-btn", "back-btn", () => {
      window.location.href = "index.html";
    });
    this.container.parentElement.appendChild(backBtn);
  }
}

// Initialize writer when the page loads
document.addEventListener("DOMContentLoaded", () => {
  const writer = new Writer();
});
