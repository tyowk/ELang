import type { Token } from '../types';
export interface ASTNode {
    type: string;
    [key: string]: any;
}
export declare class Parser {
    private tokens;
    private position;
    constructor(tokens: Token[]);
    static run(tokens: Token[]): ASTNode;
    parseProgram(): ASTNode;
    private parseStatement;
    private parseIfStatement;
    private parseWhileStatement;
    private parseDoWhileStatement;
    private parseForStatement;
    private parseFunctionDeclaration;
    private parseReturnStatement;
    private parseVariableDeclaration;
    private parseAssignmentExpression;
    private parseBlockStatement;
    private parseExpressionStatement;
    private parseExpression;
    private parseAssignment;
    private parseLogicalOr;
    private parseLogicalAnd;
    private parseBitwiseOr;
    private parseBitwiseXor;
    private parseBitwiseAnd;
    private parseEquality;
    private parseRelational;
    private parseAdditive;
    private parseMultiplicative;
    private parseBinaryExpression;
    private parseUnary;
    private parsePrimary;
    private parsePostfixOperations;
    private parseNewExpression;
    private parseArrayExpression;
    private parseObjectExpression;
    private parseProperty;
    private parseLiteral;
    private parseIdentifier;
    private parsePostfixExpression;
    private parseCallExpression;
    private parseBreakStatement;
    private parseContinueStatement;
    private parseSwitchStatement;
    private parseThrowStatement;
    private parseTryCatchFinally;
    private parseClassDeclaration;
    private parseClassExpression;
    private parseClassBody;
    private parseConstructorDefinition;
    private parseMethodDefinition;
    private parsePropertyDefinition;
    private parseFunctionExpression;
    private parseArrowFunction;
    private parseImportStatement;
    private parseExportStatement;
    private parseStatementList;
    private match;
    private consume;
    private consumeOptional;
    private advance;
    private current;
    private isAtEnd;
}
//# sourceMappingURL=index.d.ts.map