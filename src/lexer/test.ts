import { Lexer } from './';
main();

function main() {
    const input = `
    blueprint MyClass {
        builder(message) {
            myself.message = message;
            myself.name = "uwu";
        }
    }

    blueprint Error buildon MyClass {
        builder(message) {
            powerparent(message);
        }

        make add(a, b) {
            return a + b;
        }
    }

    boom fresh Error("Something went wrong!");

    make uwu() {
        return "uwu";
    }

    uwu();
    lock arrow = (a, b) => a + b;
    arrow(1, 2);
    `;

    const t = Lexer.run(input);
    console.log(JSON.stringify(t, null, 2));
}
