/**
 * Note class - represents a single note object.
 * Used to form the array of objects stored in localStorage.
 */
class Note {
  constructor(text, removeCallback, saveCallback, isReadOnly = false) {
    this.text = text;
    this.removeCallback = removeCallback;
    this.saveCallback = saveCallback;
    this.isReadOnly = isReadOnly;

    this.container = document.createElement("div");
    this.container.className = "note-row";

    this.textarea = document.createElement("textarea");
    this.textarea.value = this.text;
    
    if (this.isReadOnly) {
      this.textarea.readOnly = true;
    } else {
      this.textarea.addEventListener("input", () => {
        this.text = this.textarea.value;
        if (this.saveCallback) this.saveCallback();
      });
    }
    this.container.appendChild(this.textarea);

    if (!this.isReadOnly) {
      this.removeBtn = document.createElement("button");
      // Fallback to "remove" string in case MESSAGES is not loaded properly in some context
      this.removeBtn.textContent = typeof MESSAGES !== 'undefined' ? MESSAGES.REMOVE : "remove";
      this.removeBtn.addEventListener("click", () => {
        this.remove();
      });
      this.container.appendChild(this.removeBtn);
    }
  }

  getElement() {
    return this.container;
  }

  remove() {
    this.container.remove();
    if (this.removeCallback) this.removeCallback(this);
  }
}
