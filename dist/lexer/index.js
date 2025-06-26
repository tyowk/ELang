"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Lexer = void 0;
const types_1 = require("../types");
class Lexer {
    input;
    index = 0;
    constructor(input) {
        this.input = input;
    }
    static run(input) {
        return new Lexer(input).tokenize();
    }
    tokenize() {
        const tokens = [];
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
            if (this.skipComments())
                continue;
            if (char === '/' && this.isRegexContext(tokens)) {
                tokens.push(this.readRegex());
                continue;
            }
            const operator = this.readOperator();
            if (operator) {
                tokens.push(operator);
                continue;
            }
            tokens.push({ type: types_1.TokenType.ILLEGAL, value: this.advance() });
        }
        return tokens;
    }
    readIdentifier() {
        const value = this.readWhile(this.isAlphaNumeric);
        const type = types_1.Keywords.has(value) ? types_1.TokenType.KEYWORD : types_1.TokenType.IDENTIFIER;
        return { type, value };
    }
    readNumber() {
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
                    return { type: types_1.TokenType.ILLEGAL, value };
                }
                value += this.readWhile(this.isDigit);
            }
            return { type: types_1.TokenType.NUMBER, value };
        }
        return { type: types_1.TokenType.ILLEGAL, value: this.advance() };
    }
    readString(quote) {
        this.advance();
        let value = '';
        while (this.index < this.input.length && this.current() !== quote) {
            if (this.current() === '\\') {
                value += this.advance();
                value += this.advance();
            }
            else {
                value += this.advance();
            }
        }
        this.advance();
        return { type: types_1.TokenType.STRING, value };
    }
    readTemplate() {
        let value = '';
        this.advance();
        let depth = 1;
        while (this.index < this.input.length && depth > 0) {
            const char = this.current();
            if (char === '`') {
                this.advance();
                depth--;
                if (depth === 0)
                    break;
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
            }
            else {
                value += this.advance();
            }
        }
        return { type: types_1.TokenType.TEMPLATE, value };
    }
    readNestedTemplate() {
        let result = '';
        let depth = 1;
        while (this.index < this.input.length && depth > 0) {
            const char = this.current();
            if (char === '{') {
                depth++;
                result += this.advance();
            }
            else if (char === '}') {
                depth--;
                result += this.advance();
            }
            else if (char === '`') {
                result += this.readTemplate().value;
            }
            else if (char === '"' || char === "'") {
                result += this.readString(char).value;
            }
            else if (char === '/' && this.isRegexContext([])) {
                result += this.readRegex().value;
            }
            else if (char === '\\') {
                result += this.advance();
                result += this.advance();
            }
            else {
                result += this.advance();
            }
        }
        return result;
    }
    readRegex() {
        let value = this.advance();
        let inClass = false;
        while (this.index < this.input.length) {
            const char = this.current();
            if (char === '\\') {
                value += this.advance();
                value += this.advance();
            }
            else if (char === '[') {
                inClass = true;
                value += this.advance();
            }
            else if (char === ']' && inClass) {
                inClass = false;
                value += this.advance();
            }
            else if (char === '/' && !inClass) {
                value += this.advance();
                break;
            }
            else {
                value += this.advance();
            }
        }
        value += this.readWhile(/[a-z]/i.test);
        return { type: types_1.TokenType.REGEX, value };
    }
    readOperator() {
        const candidates = [
            this.current() + this.peek(1) + this.peek(2) + this.peek(3),
            this.current() + this.peek(1) + this.peek(2),
            this.current() + this.peek(1),
            this.current()
        ];
        const levels = ['FOUR', 'THREE', 'TWO', 'ONE'];
        for (let i = 0; i < 4; i++) {
            const candidate = candidates[i];
            const type = types_1.Operators[levels[i]][candidate];
            if (type) {
                const value = Array.from({ length: 4 - i }, () => this.advance()).join('');
                return { type, value };
            }
        }
        return null;
    }
    skipComments() {
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
    isRegexContext(tokens) {
        if (tokens.length === 0)
            return true;
        const prev = tokens[tokens.length - 1].type;
        return ['ASSIGN', 'LPAREN', 'LBRACE', 'LBRACKET', 'COMMA', 'COLON', 'RETURN'].includes(prev);
    }
    readWhile(predicate) {
        let result = '';
        while (this.index < this.input.length && predicate(this.current())) {
            result += this.advance();
        }
        return result;
    }
    advance() {
        return this.input[this.index++] ?? '';
    }
    current() {
        return this.input[this.index] ?? '';
    }
    peek(offset = 0) {
        return this.input[this.index + offset] ?? '';
    }
    isWhitespace = (c) => /\s/.test(c);
    isAlpha = (c) => /[a-zA-Z_$]/.test(c);
    isDigit = (c) => /\d/.test(c);
    isAlphaNumeric = (c) => /[a-zA-Z0-9_$]/.test(c);
}
exports.Lexer = Lexer;
