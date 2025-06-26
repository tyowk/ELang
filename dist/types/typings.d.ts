export declare enum TokenType {
    IDENTIFIER = "IDENTIFIER",
    KEYWORD = "KEYWORD",
    NUMBER = "NUMBER",
    STRING = "STRING",
    TEMPLATE = "TEMPLATE",
    REGEX = "REGEX",
    ILLEGAL = "ILLEGAL"
}
export interface Token {
    type: TokenType | string;
    value: string;
}
//# sourceMappingURL=typings.d.ts.map