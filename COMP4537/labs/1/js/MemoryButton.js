export class MemoryButton {
    constructor(order) {
        this.order = order;
        this.color = this.getRandomColor();
        this.htmlElement = document.createElement("button");

        this.htmlElement.textContent = this.order;
        this.htmlElement.style.backgroundColor = this.color;

        //button styling
        this.htmlElement.style.width = "10em";
        this.htmlElement.style.height = "5em";
        this.htmlElement.style.border = "none";
        this.htmlElement.style.borderRadius = "5px";
        this.htmlElement.style.fontSize = "1.2em";
        this.htmlElement.style.fontWeight = "bold";
        this.htmlElement.style.cursor = "pointer";
        this.htmlElement.style.color = "#fff";
    }

    getRandomColor() {
        const r = Math.floor(Math.random() * 256);
        const g = Math.floor(Math.random() * 256);
        const b = Math.floor(Math.random() * 256);
        return `rgb(${r}, ${g}, ${b})`;
    }

    setLocation(x, y) {
        this.htmlElement.style.position = "absolute";
        this.htmlElement.style.left = `${x}px`;
        this.htmlElement.style.top = `${y}px`;
    }

    hideNumber() {
        this.htmlElement.textContent = "";
    }

    showNumber() {
        this.htmlElement.textContent = this.order;
    }
}
