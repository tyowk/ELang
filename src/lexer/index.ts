export interface Token {
    type: string;
    value: string;
}

export const KEYWORDS = new Set([
    'whenever',
    'orwhat',
    'loopit',
    'aslongas',
    'make',
    'sendback',
    'thing',
    'lock',
    'maybe',
    'yes',
    'no',
    'nothing',
    'snapout',
    'keepgoing',
    'matchcase',
    'scenario',
    'otherwise',
    'attempt',
    'fresh',
    'myself',
    'whatis',
    'typeis',
    'within',
    'of',
    'risky',
    'grab',
    'cleanup',
    'boom',
    'blueprint',
    'buildon',
    'parentpower',
    'bringin',
    'sendout',
    'from',
    'giveback',
    'freezehere',
    'obliterate',
    'using',
    'void',
    'print',
    'builder'
]);

const MULTI_OPS: Record<string, string> = {
    '===': 'STRICT_EQUAL',
    '!==': 'STRICT_NOT_EQUAL',
    '>>>': 'ZERO_FILL_RIGHT_SHIFT'
};

const TWO_OPS: Record<string, string> = {
    '==': 'EQUAL',
    '!=': 'NOT_EQUAL',
    '>=': 'GTE',
    '<=': 'LTE',
    '++': 'INCREMENT',
    '--': 'DECREMENT',
    '&&': 'AND',
    '||': 'OR',
    '**': 'EXPONENT',
    '<<': 'LEFT_SHIFT',
    '>>': 'RIGHT_SHIFT',
    '=>': 'ARROW'
};

const ONE_OPS: Record<string, string> = {
    '=': 'ASSIGN',
    '+': 'PLUS',
    '-': 'MINUS',
    '*': 'MULTIPLY',
    '/': 'DIVIDE',
    '%': 'MODULO',
    '>': 'GT',
    '<': 'LT',
    '!': 'NOT',
    '&': 'BITWISE_AND',
    '|': 'BITWISE_OR',
    '^': 'BITWISE_XOR',
    '~': 'BITWISE_NOT',
    '?': 'QUESTION',
    ':': 'COLON',
    '.': 'DOT',
    ';': 'SEMICOLON',
    ',': 'COMMA',
    '(': 'LPAREN',
    ')': 'RPAREN',
    '{': 'LBRACE',
    '}': 'RBRACE',
    '[': 'LBRACKET',
    ']': 'RBRACKET'
};

export class Lexer {
    private input: string;
    private index: number;

    constructor(input: string) {
        this.input = input;
        this.index = 0;
    }

    static run(input: string): Token[] {
        return new Lexer(input).tokenize();
    }

    private tokenize(): Token[] {
        const tokens: Token[] = [];

        while (this.index < this.input.length) {
            const char = this.current();

            if (this.isWhitespace(char)) {
                this.advance();
                continue;
            }

            if (this.isAlpha(char)) {
                tokens.push(this.readIdentifier());
                continue;
            }

            if (this.isDigit(char) || (char === '.' && this.isDigit(this.peek(1)))) {
                tokens.push(this.readNumber());
                continue;
            }

            if (char === '"' || char === "'") {
                tokens.push(this.readString(char));
                continue;
            }

            if (char === '`') {
                tokens.push(this.readTemplate());
                continue;
            }

            if (this.skipComments()) continue;

            if (char === '/' && this.isRegexContext(tokens)) {
                tokens.push(this.readRegex());
                continue;
            }

            const operator = this.readOperator();
            if (operator) {
                tokens.push(operator);
                continue;
            }

            tokens.push({ type: 'ILLEGAL', value: this.advance() });
        }

        return tokens;
    }

    private readIdentifier(): Token {
        const value = this.readWhile((c) => this.isAlphaNumeric(c));
        return { type: KEYWORDS.has(value) ? 'KEYWORD' : 'IDENTIFIER', value };
    }

    private readNumber(): Token {
        let value = '';

        if (this.current() === '.') value += this.advance();
        value += this.readWhile((c) => this.isDigit(c));

        if (this.current() === '.') {
            value += this.advance();
            value += this.readWhile((c) => this.isDigit(c));
        }

        if (/e/i.test(this.current())) {
            value += this.advance();
            if (this.current() === '+' || this.current() === '-') {
                value += this.advance();
            }
            value += this.readWhile((c) => this.isDigit(c));
        }

        return { type: 'NUMBER', value };
    }

    private readString(quote: string): Token {
        this.advance();
        let value = '';

        while (this.index < this.input.length && this.current() !== quote) {
            if (this.current() === '\\') {
                value += this.advance();
                value += this.advance();
            } else {
                value += this.advance();
            }
        }

        this.advance();
        return { type: 'STRING', value };
    }

    private readTemplate(): Token {
        this.advance();
        let value = '';

        while (this.index < this.input.length && this.current() !== '`') {
            if (this.current() === '\\') {
                value += this.advance();
                value += this.advance();
            } else {
                value += this.advance();
            }
        }

        this.advance();
        return { type: 'TEMPLATE', value };
    }

    private readRegex(): Token {
        let value = this.advance();

        while (this.index < this.input.length) {
            const char = this.current();
            if (char === '\\') {
                value += this.advance();
                value += this.advance();
            } else if (char === '/') {
                value += this.advance();
                break;
            } else {
                value += this.advance();
            }
        }

        value += this.readWhile((c) => /[a-z]/i.test(c));
        return { type: 'REGEX', value };
    }

    private readOperator(): Token | null {
        const three = this.current() + this.peek(1) + this.peek(2);
        const two = this.current() + this.peek(1);
        const one = this.current();

        if (MULTI_OPS[three]) {
            return {
                type: MULTI_OPS[three],
                value: this.advance() + this.advance() + this.advance()
            };
        }
        if (TWO_OPS[two]) {
            return { type: TWO_OPS[two], value: this.advance() + this.advance() };
        }
        if (ONE_OPS[one]) {
            return { type: ONE_OPS[one], value: this.advance() };
        }

        return null;
    }

    private skipComments(): boolean {
        if (this.current() === '/' && this.peek(1) === '/') {
            this.advance();
            this.advance();
            while (this.current() !== '\n' && this.index < this.input.length) {
                this.advance();
            }
            return true;
        }

        if (this.current() === '/' && this.peek(1) === '*') {
            this.advance();
            this.advance();
            while (!(this.current() === '*' && this.peek(1) === '/') && this.index < this.input.length) {
                this.advance();
            }
            this.advance();
            this.advance();
            return true;
        }

        return false;
    }

    private isRegexContext(tokens: Token[]): boolean {
        if (tokens.length === 0) return true;
        const prev = tokens[tokens.length - 1].type;
        return ['ASSIGN', 'LPAREN', 'LBRACE', 'LBRACKET', 'COMMA', 'COLON', 'RETURN'].includes(prev);
    }

    private readWhile(predicate: (char: string) => boolean): string {
        let result = '';
        while (predicate(this.current()) && this.index < this.input.length) {
            result += this.advance();
        }
        return result;
    }

    private advance(): string {
        return this.input[this.index++];
    }

    private current(): string {
        return this.input[this.index] || '';
    }

    private peek(offset = 0): string {
        return this.input[this.index + offset] || '';
    }

    private isWhitespace(char: string): boolean {
        return /\s/.test(char);
    }

    private isAlpha(char: string): boolean {
        return /[a-zA-Z_$]/.test(char);
    }

    private isDigit(char: string): boolean {
        return /\d/.test(char);
    }

    private isAlphaNumeric(char: string): boolean {
        return /[a-zA-Z0-9_$]/.test(char);
    }
}
