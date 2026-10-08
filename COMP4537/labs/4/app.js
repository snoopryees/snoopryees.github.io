// Part A - debugging demo. Put a breakpoint on the console.log line and press F5.
import MathOperations from "./math.js";

class App {
    constructor(name) {
        this.name = name;
        this.math = new MathOperations();
    }

    run() {
        const a = 5;
        const b = 3;
        const sum = this.math.add(a, b);
        const difference = this.math.subtract(a, b);
        console.log(`Hello ${this.name}! ${a} + ${b} = ${sum}, ${a} - ${b} = ${difference}`); // <-- breakpoint here
    }
}

new App("Nathan").run();
