import { type Token } from '../types';
export declare class Lexer<TToken extends Token = Token> {
    private readonly input;
    private index;
    constructor(input: string);
    static run<T extends Token = Token>(input: string): T[];
    tokenize(): TToken[];
    private readIdentifier;
    private readNumber;
    private readString;
    private readTemplate;
    private readNestedTemplate;
    private readRegex;
    private readOperator;
    private skipComments;
    private isRegexContext;
    private readWhile;
    private advance;
    private current;
    private peek;
    private isWhitespace;
    private isAlpha;
    private isDigit;
    private isAlphaNumeric;
}
//# sourceMappingURL=index.d.ts.map