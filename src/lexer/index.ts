import { TokenType, type Token, Operators, Keywords } from '../types';

export class Lexer<TToken extends Token = Token> {
    private readonly input: string;
    private index = 0;

    constructor(input: string) {
        this.input = input;
    }

    static run<T extends Token = Token>(input: string): T[] {
        return new Lexer<T>(input).tokenize();
    }

    public tokenize(): TToken[] {
        const tokens: TToken[] = [];

        while (this.index < this.input.length) {
            const char = this.current();

            if (this.isWhitespace(char)) {
                this.advance();
                continue;
            }

            if (this.isAlpha(char)) {
                tokens.push(this.readIdentifier() as TToken);
                continue;
            }

            if (this.isDigit(char) || (char === '.' && this.isDigit(this.peek(1)))) {
                tokens.push(this.readNumber() as TToken);
                continue;
            }

            if (char === '"' || char === "'") {
                tokens.push(this.readString(char) as TToken);
                continue;
            }

            if (char === '`') {
                tokens.push(this.readTemplate() as TToken);
                continue;
            }

            if (this.skipComments()) continue;

            if (char === '/' && this.isRegexContext(tokens)) {
                tokens.push(this.readRegex() as TToken);
                continue;
            }

            const operator = this.readOperator();
            if (operator) {
                tokens.push(operator as TToken);
                continue;
            }

            tokens.push({ type: TokenType.ILLEGAL, value: this.advance() } as TToken);
        }

        return tokens;
    }

    private readIdentifier(): Token {
        const value = this.readWhile(this.isAlphaNumeric);
        const type = Keywords.has(value) ? TokenType.KEYWORD : TokenType.IDENTIFIER;
        return { type, value };
    }

    private readNumber(): Token {
        let value = '';

        if (this.isDigit(this.current())) {
            value += this.readWhile(this.isDigit);

            if (this.current() === '.' && this.isDigit(this.peek(1))) {
                value += this.advance();
                value += this.readWhile(this.isDigit);
            }

            if (this.current().toLowerCase() === 'e') {
                value += this.advance();

                if (this.current() === '+' || this.current() === '-') {
                    value += this.advance();
                }

                if (!this.isDigit(this.current())) {
                    return { type: TokenType.ILLEGAL, value };
                }

                value += this.readWhile(this.isDigit);
            }

            return { type: TokenType.NUMBER, value };
        }

        return { type: TokenType.ILLEGAL, value: this.advance() };
    }

    private readString(quote: '"' | "'"): Token {
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
        return { type: TokenType.STRING, value };
    }

    private readTemplate(): Token {
        let value = '';
        this.advance();
        let depth = 1;

        while (this.index < this.input.length && depth > 0) {
            const char = this.current();

            if (char === '`') {
                this.advance();
                depth--;
                if (depth === 0) break;
                value += '`';
                continue;
            }

            if (char === '$' && this.peek(1) === '{') {
                value += this.advance();
                value += this.advance();
                value += this.readNestedTemplate();
                continue;
            }

            if (char === '\\') {
                value += this.advance();
                value += this.advance();
            } else {
                value += this.advance();
            }
        }

        return { type: TokenType.TEMPLATE, value };
    }

    private readNestedTemplate(): string {
        let result = '';
        let depth = 1;

        while (this.index < this.input.length && depth > 0) {
            const char = this.current();

            if (char === '{') {
                depth++;
                result += this.advance();
            } else if (char === '}') {
                depth--;
                result += this.advance();
            } else if (char === '`') {
                result += this.readTemplate().value;
            } else if (char === '"' || char === "'") {
                result += this.readString(char as '"' | "'").value;
            } else if (char === '/' && this.isRegexContext([])) {
                result += this.readRegex().value;
            } else if (char === '\\') {
                result += this.advance();
                result += this.advance();
            } else {
                result += this.advance();
            }
        }

        return result;
    }

    private readRegex(): Token {
        let value = this.advance();
        let inClass = false;

        while (this.index < this.input.length) {
            const char = this.current();

            if (char === '\\') {
                value += this.advance();
                value += this.advance();
            } else if (char === '[') {
                inClass = true;
                value += this.advance();
            } else if (char === ']' && inClass) {
                inClass = false;
                value += this.advance();
            } else if (char === '/' && !inClass) {
                value += this.advance();
                break;
            } else {
                value += this.advance();
            }
        }

        value += this.readWhile(/[a-z]/i.test);
        return { type: TokenType.REGEX, value };
    }

    private readOperator(): Token | null {
        const candidates = [
            this.current() + this.peek(1) + this.peek(2) + this.peek(3),
            this.current() + this.peek(1) + this.peek(2),
            this.current() + this.peek(1),
            this.current()
        ];

        const levels: (keyof typeof Operators)[] = ['FOUR', 'THREE', 'TWO', 'ONE'];

        for (let i = 0; i < 4; i++) {
            const candidate = candidates[i];
            const type = Operators[levels[i]][candidate];
            if (type) {
                const value = Array.from({ length: 4 - i }, () => this.advance()).join('');
                return { type, value };
            }
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
        while (this.index < this.input.length && predicate(this.current())) {
            result += this.advance();
        }
        return result;
    }

    private advance(): string {
        return this.input[this.index++] ?? '';
    }

    private current(): string {
        return this.input[this.index] ?? '';
    }

    private peek(offset = 0): string {
        return this.input[this.index + offset] ?? '';
    }

    private isWhitespace = (c: string): boolean => /\s/.test(c);
    private isAlpha = (c: string): boolean => /[a-zA-Z_$]/.test(c);
    private isDigit = (c: string): boolean => /\d/.test(c);
    private isAlphaNumeric = (c: string): boolean => /[a-zA-Z0-9_$]/.test(c);
}
