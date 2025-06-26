import type { Token } from '../types';

export interface ASTNode {
    type: string;
    [key: string]: any;
}

const STATEMENT_KEYWORDS = new Map([
    ['whenever', 'parseIfStatement'],
    ['loopit', 'parseForStatement'],
    ['aslongas', 'parseWhileStatement'],
    ['attempt', 'parseDoWhileStatement'],
    ['make', 'parseFunctionDeclaration'],
    ['sendback', 'parseReturnStatement'],
    ['lock', 'parseVariableDeclaration'],
    ['thing', 'parseVariableDeclaration'],
    ['maybe', 'parseVariableDeclaration'],
    ['snapout', 'parseBreakStatement'],
    ['keepgoing', 'parseContinueStatement'],
    ['matchcase', 'parseSwitchStatement'],
    ['boom', 'parseThrowStatement'],
    ['risky', 'parseTryCatchFinally'],
    ['blueprint', 'parseClassDeclaration'],
    ['bringin', 'parseImportStatement'],
    ['sendout', 'parseExportStatement']
]);

export class Parser {
    private tokens: Token[];
    private position: number;

    constructor(tokens: Token[]) {
        this.tokens = tokens;
        this.position = 0;
    }

    static run(tokens: Token[]): ASTNode {
        return new Parser(tokens).parseProgram();
    }

    parseProgram(): ASTNode {
        const statements: ASTNode[] = [];
        while (!this.isAtEnd()) {
            statements.push(this.parseStatement());
        }

        return { type: 'Program', body: statements };
    }

    private parseStatement(): ASTNode {
        if (this.match('KEYWORD')) {
            const keyword = this.current().value;
            const methodName = STATEMENT_KEYWORDS.get(keyword);
            if (methodName) {
                return (this as any)[methodName]();
            }

            const expressionKeywords = ['myself', 'yes', 'no', 'nothing', 'fresh'];
            if (expressionKeywords.includes(keyword)) {
                return this.parseExpressionStatement();
            }

            throw new SyntaxError(`Unexpected keyword: ${keyword}`);
        }

        if (this.match('LBRACE')) {
            return this.parseBlockStatement();
        }

        return this.parseExpressionStatement();
    }

    private parseIfStatement(): ASTNode {
        this.consume('KEYWORD', 'whenever');
        this.consume('LPAREN');
        const test = this.parseExpression();
        this.consume('RPAREN');
        const consequent = this.parseStatement();

        let alternate: any = null;
        if (this.match('KEYWORD', 'orwhat')) {
            this.advance();
            alternate = this.match('KEYWORD', 'whenever') ? this.parseIfStatement() : this.parseStatement();
        }

        return { type: 'IfStatement', test, consequent, alternate };
    }

    private parseWhileStatement(): ASTNode {
        this.consume('KEYWORD', 'aslongas');
        this.consume('LPAREN');
        const test = this.parseExpression();
        this.consume('RPAREN');
        const body = this.parseStatement();
        return { type: 'WhileStatement', test, body };
    }

    private parseDoWhileStatement(): ASTNode {
        this.consume('KEYWORD', 'attempt');
        const body = this.parseStatement();
        this.consume('KEYWORD', 'aslongas');
        this.consume('LPAREN');
        const test = this.parseExpression();
        this.consume('RPAREN');
        this.consumeOptional('SEMICOLON');
        return { type: 'DoWhileStatement', body, test };
    }

    private parseForStatement(): ASTNode {
        this.consume('KEYWORD', 'loopit');
        this.consume('LPAREN');

        let init: any = null;
        if (!this.match('SEMICOLON')) {
            init =
                this.match('KEYWORD', 'thing') || this.match('KEYWORD', 'lock') || this.match('KEYWORD', 'maybe')
                    ? this.parseVariableDeclaration(true)
                    : this.parseExpression();
            if (!this.match('SEMICOLON')) this.consume('SEMICOLON');
        } else {
            this.consume('SEMICOLON');
        }

        const test = this.match('SEMICOLON') ? null : this.parseExpression();
        this.consume('SEMICOLON');

        const update = this.match('RPAREN') ? null : this.parseExpression();
        this.consume('RPAREN');

        const body = this.parseStatement();
        return { type: 'ForStatement', init, test, update, body };
    }

    private parseFunctionDeclaration(): ASTNode {
        this.consume('KEYWORD', 'make');
        const id = this.parseIdentifier();
        this.consume('LPAREN');

        const params: ASTNode[] = [];
        if (!this.match('RPAREN')) {
            do {
                params.push(this.parseIdentifier());
                if (!this.match('COMMA')) break;
                this.consume('COMMA');
            } while (!this.match('RPAREN'));
        }

        this.consume('RPAREN');
        const body = this.parseBlockStatement();
        return { type: 'FunctionDeclaration', id, params, body };
    }

    private parseReturnStatement(): ASTNode {
        this.consume('KEYWORD', 'sendback');
        const argument = this.match('SEMICOLON') ? null : this.parseExpression();
        this.consumeOptional('SEMICOLON');
        return { type: 'ReturnStatement', argument };
    }

    private parseVariableDeclaration(inForInit = false): ASTNode {
        const kind = this.consume('KEYWORD').value;
        const declarations: ASTNode[] = [];
        let isBreak = false;

        do {
            const id = this.parseIdentifier();
            let init: ASTNode | null = null;

            if (this.match('ASSIGN')) {
                this.advance();
                init = this.parseAssignmentExpression();
            }

            declarations.push({ type: 'VariableDeclarator', id, init });
            if (!this.match('COMMA')) isBreak = true;
            this.advance();
        } while (isBreak === false);

        if (!inForInit) this.consumeOptional('SEMICOLON');
        return { type: 'VariableDeclaration', kind, declarations };
    }

    private parseAssignmentExpression(): ASTNode {
        if (this.match('KEYWORD', 'make')) {
            return this.parseFunctionExpression();
        }

        if (this.match('KEYWORD', 'blueprint')) {
            return this.parseClassExpression();
        }

        if (this.match('LPAREN') || this.match('IDENTIFIER')) {
            const checkpoint = this.position;
            try {
                return this.parseArrowFunction();
            } catch {
                this.position = checkpoint;
                return this.parseExpression();
            }
        }

        return this.parseExpression();
    }

    private parseBlockStatement(): ASTNode {
        this.consume('LBRACE');
        const body: ASTNode[] = [];
        while (!this.match('RBRACE') && !this.isAtEnd()) {
            body.push(this.parseStatement());
        }
        this.consume('RBRACE');
        return { type: 'BlockStatement', body };
    }

    private parseExpressionStatement(): ASTNode {
        const expression = this.parseExpression();
        this.consumeOptional('SEMICOLON');
        return { type: 'ExpressionStatement', expression };
    }

    private parseExpression(): ASTNode {
        return this.parseAssignment();
    }

    private parseAssignment(): ASTNode {
        const left = this.parseLogicalOr();
        if (this.match('ASSIGN')) {
            this.advance();
            const right = this.parseAssignment();
            return { type: 'AssignmentExpression', operator: '=', left, right };
        }
        return left;
    }

    private parseLogicalOr(): ASTNode {
        let left = this.parseLogicalAnd();
        while (this.match('OR')) {
            const operator = this.advance().value;
            const right = this.parseLogicalAnd();
            left = { type: 'LogicalExpression', operator, left, right };
        }
        return left;
    }

    private parseLogicalAnd(): ASTNode {
        let left = this.parseBitwiseOr();
        while (this.match('AND')) {
            const operator = this.advance().value;
            const right = this.parseBitwiseOr();
            left = { type: 'LogicalExpression', operator, left, right };
        }
        return left;
    }

    private parseBitwiseOr(): ASTNode {
        return this.parseBinaryExpression(() => this.parseBitwiseXor(), ['BITWISE_OR']);
    }

    private parseBitwiseXor(): ASTNode {
        return this.parseBinaryExpression(() => this.parseBitwiseAnd(), ['BITWISE_XOR']);
    }

    private parseBitwiseAnd(): ASTNode {
        return this.parseBinaryExpression(() => this.parseEquality(), ['BITWISE_AND']);
    }

    private parseEquality(): ASTNode {
        return this.parseBinaryExpression(
            () => this.parseRelational(),
            ['EQUAL', 'NOT_EQUAL', 'STRICT_EQUAL', 'STRICT_NOT_EQUAL']
        );
    }

    private parseRelational(): ASTNode {
        return this.parseBinaryExpression(() => this.parseAdditive(), ['LT', 'LTE', 'GT', 'GTE', 'INSTANCEOF', 'IN']);
    }

    private parseAdditive(): ASTNode {
        return this.parseBinaryExpression(() => this.parseMultiplicative(), ['PLUS', 'MINUS']);
    }

    private parseMultiplicative(): ASTNode {
        return this.parseBinaryExpression(() => this.parseUnary(), ['MULTIPLY', 'DIVIDE', 'MODULO']);
    }

    private parseBinaryExpression(parseNext: () => ASTNode, operators: string[]): ASTNode {
        let left = parseNext();
        while (operators.some((op) => this.match(op))) {
            const operator = this.advance().value;
            const right = parseNext();
            left = { type: 'BinaryExpression', operator, left, right };
        }
        return left;
    }

    private parseUnary(): ASTNode {
        const unaryOps = ['NOT', 'PLUS', 'MINUS', 'BITWISE_NOT', 'DELETE', 'VOID', 'TYPEOF'];
        if (unaryOps.some((op) => this.match(op))) {
            const operator = this.advance().value;
            const argument = this.parseUnary();
            return { type: 'UnaryExpression', operator, argument, prefix: true };
        }
        return this.parsePrimary();
    }

    private parsePrimary(): ASTNode {
        let node: ASTNode;

        if (this.match('NUMBER') || this.match('STRING') || this.match('TEMPLATE')) {
            node = this.parseLiteral();
        } else if (this.match('KEYWORD', 'yes')) {
            this.advance();
            node = { type: 'Literal', value: true };
        } else if (this.match('KEYWORD', 'no')) {
            this.advance();
            node = { type: 'Literal', value: false };
        } else if (this.match('KEYWORD', 'nothing')) {
            this.advance();
            node = { type: 'Literal', value: null };
        } else if (this.match('KEYWORD', 'myself')) {
            this.advance();
            node = { type: 'ThisExpression' };
        } else if (this.match('KEYWORD', 'make')) {
            return this.parseFunctionExpression();
        } else if (this.match('KEYWORD', 'blueprint')) {
            return this.parseClassExpression();
        } else if (this.match('KEYWORD', 'fresh')) {
            return this.parseNewExpression();
        } else if (this.match('LBRACKET')) {
            node = this.parseArrayExpression();
        } else if (this.match('LBRACE')) {
            node = this.parseObjectExpression();
        } else if (this.match('IDENTIFIER')) {
            node = this.parseIdentifier();
        } else if (this.match('LPAREN')) {
            this.advance();
            node = this.parseExpression();
            this.consume('RPAREN');
        } else {
            throw new SyntaxError(`Unexpected token: ${this.current().type} ${this.current().value}`);
        }

        return this.parsePostfixOperations(node);
    }

    private parsePostfixOperations(_node: ASTNode): ASTNode {
        let node = _node;
        while (true) {
            if (this.match('LPAREN')) {
                node = this.parseCallExpression(node);
            } else if (this.match('DOT')) {
                this.advance();
                const property = this.parseIdentifier();
                node = {
                    type: 'MemberExpression',
                    object: node,
                    property,
                    computed: false
                };
            } else if (this.match('LBRACKET')) {
                this.advance();
                const property = this.parseExpression();
                this.consume('RBRACKET');
                node = {
                    type: 'MemberExpression',
                    object: node,
                    property,
                    computed: true
                };
            } else {
                break;
            }
        }
        return node;
    }

    private parseNewExpression(): ASTNode {
        this.consume('KEYWORD', 'fresh');
        const callee = this.parsePrimary();

        const args: ASTNode[] = [];
        if (this.match('LPAREN')) {
            this.advance();
            if (!this.match('RPAREN')) {
                do {
                    args.push(this.parseExpression());
                    if (!this.match('COMMA')) break;
                    this.advance();
                } while (!this.match('RPAREN'));
            }
            this.consume('RPAREN');
        }

        return { type: 'NewExpression', callee, arguments: args };
    }

    private parseArrayExpression(): ASTNode {
        this.consume('LBRACKET');
        const elements: (ASTNode | null)[] = [];

        if (!this.match('RBRACKET')) {
            do {
                if (this.match('COMMA')) {
                    elements.push(null);
                } else {
                    elements.push(this.parseExpression());
                }

                if (!this.match('COMMA')) break;
                this.advance();
            } while (!this.match('RBRACKET'));
        }

        this.consume('RBRACKET');
        return { type: 'ArrayExpression', elements };
    }

    private parseObjectExpression(): ASTNode {
        this.consume('LBRACE');
        const properties: ASTNode[] = [];

        if (!this.match('RBRACE')) {
            do {
                const property = this.parseProperty();
                properties.push(property);

                if (!this.match('COMMA')) break;
                this.advance();
            } while (!this.match('RBRACE'));
        }

        this.consume('RBRACE');
        return { type: 'ObjectExpression', properties };
    }

    private parseProperty(): ASTNode {
        let key: ASTNode;
        let computed = false;

        if (this.match('LBRACKET')) {
            this.advance();
            key = this.parseExpression();
            this.consume('RBRACKET');
            computed = true;
        } else if (this.match('STRING') || this.match('NUMBER')) {
            key = this.parseLiteral();
        } else {
            key = this.parseIdentifier();
        }

        if (this.match('COLON')) {
            this.advance();
            const value = this.parseExpression();
            return { type: 'Property', key, value, kind: 'init', computed };
        }
        return {
            type: 'Property',
            key,
            value: key,
            kind: 'init',
            computed: false
        };
    }

    private parseLiteral(): ASTNode {
        const token = this.advance();
        let value: any = token.value;

        if (token.type === 'NUMBER') {
            value = Number(token.value);
        } else if (token.type === 'TEMPLATE') {
            return {
                type: 'TemplateLiteral',
                quasis: [
                    {
                        type: 'TemplateElement',
                        value: { raw: token.value, cooked: token.value }
                    }
                ],
                expressions: []
            };
        }

        return { type: 'Literal', value };
    }

    private parseIdentifier(): ASTNode {
        const token = this.consume('IDENTIFIER');
        return { type: 'Identifier', name: token.value };
    }

    private parsePostfixExpression(): ASTNode {
        const node = this.parseIdentifier();
        return this.parsePostfixOperations(node);
    }

    private parseCallExpression(callee: ASTNode): ASTNode {
        this.consume('LPAREN');
        const args: ASTNode[] = [];

        if (!this.match('RPAREN')) {
            do {
                args.push(this.parseExpression());
                if (!this.match('COMMA')) break;
                this.advance();
            } while (!this.match('RPAREN'));
        }

        this.consume('RPAREN');
        return { type: 'CallExpression', callee, arguments: args };
    }

    private parseBreakStatement(): ASTNode {
        this.consume('KEYWORD', 'snapout');
        this.consumeOptional('SEMICOLON');
        return { type: 'BreakStatement' };
    }

    private parseContinueStatement(): ASTNode {
        this.consume('KEYWORD', 'keepgoing');
        this.consumeOptional('SEMICOLON');
        return { type: 'ContinueStatement' };
    }

    private parseSwitchStatement(): ASTNode {
        this.consume('KEYWORD', 'matchcase');
        this.consume('LPAREN');
        const discriminant = this.parseExpression();
        this.consume('RPAREN');
        this.consume('LBRACE');

        const cases: ASTNode[] = [];
        while (!this.match('RBRACE')) {
            if (this.match('KEYWORD', 'scenario')) {
                this.advance();
                const test = this.parseExpression();
                this.consume('COLON');
                const consequent = this.parseStatementList(['scenario', 'otherwise'], 'RBRACE');
                cases.push({ type: 'SwitchCase', test, consequent });
            } else if (this.match('KEYWORD', 'otherwise')) {
                this.advance();
                this.consume('COLON');
                const consequent = this.parseStatementList(['scenario'], 'RBRACE');
                cases.push({ type: 'SwitchCase', test: null, consequent });
            } else {
                throw new SyntaxError(`Unexpected token in switch: ${this.current().type} ${this.current().value}`);
            }
        }

        this.consume('RBRACE');
        return { type: 'SwitchStatement', discriminant, cases };
    }

    private parseThrowStatement(): ASTNode {
        this.consume('KEYWORD', 'boom');
        const argument = this.parseExpression();
        this.consumeOptional('SEMICOLON');
        return { type: 'ThrowStatement', argument };
    }

    private parseTryCatchFinally(): ASTNode {
        this.consume('KEYWORD', 'risky');
        const block = this.parseBlockStatement();

        let handler: any = null;
        if (this.match('KEYWORD', 'grab')) {
            this.advance();
            this.consume('LPAREN');
            const param = this.parseIdentifier();
            this.consume('RPAREN');
            const body = this.parseBlockStatement();
            handler = { type: 'CatchClause', param, body };
        }

        let finalizer: any = null;
        if (this.match('KEYWORD', 'cleanup')) {
            this.advance();
            finalizer = this.parseBlockStatement();
        }

        return { type: 'TryStatement', block, handler, finalizer };
    }

    private parseClassDeclaration(): ASTNode {
        this.consume('KEYWORD', 'blueprint');
        const id = this.parseIdentifier();

        let superClass: ASTNode | null = null;
        if (this.match('KEYWORD', 'buildon')) {
            this.advance();
            superClass = this.parseIdentifier();
        }

        this.consume('LBRACE');
        const body = this.parseClassBody();
        this.consume('RBRACE');

        return { type: 'ClassDeclaration', id, superClass, body };
    }

    private parseClassExpression(): ASTNode {
        this.consume('KEYWORD', 'blueprint');

        let id: ASTNode | null = null;
        if (this.match('IDENTIFIER')) {
            id = this.parseIdentifier();
        }

        let superClass: ASTNode | null = null;
        if (this.match('KEYWORD', 'buildon')) {
            this.advance();
            superClass = this.parseIdentifier();
        }

        this.consume('LBRACE');
        const body = this.parseClassBody();
        this.consume('RBRACE');

        return { type: 'ClassExpression', id, superClass, body };
    }

    private parseClassBody(): ASTNode {
        const body: ASTNode[] = [];

        while (!this.match('RBRACE') && !this.isAtEnd()) {
            if (this.match('KEYWORD', 'make')) {
                body.push(this.parseMethodDefinition());
            } else if (this.match('IDENTIFIER')) {
                if (this.current().value === 'builder') {
                    body.push(this.parseConstructorDefinition());
                } else {
                    body.push(this.parsePropertyDefinition());
                }
            } else if (this.match('KEYWORD', 'builder')) {
                body.push(this.parseConstructorDefinition());
            } else {
                throw new SyntaxError(`Unexpected token in class body: ${this.current().type} ${this.current().value}`);
            }
        }

        return { type: 'ClassBody', body };
    }

    private parseConstructorDefinition(): ASTNode {
        let key: ASTNode;
        if (this.match('KEYWORD', 'builder')) {
            const token = this.advance();
            key = { type: 'Identifier', name: token.value };
        } else {
            key = this.parseIdentifier();
        }

        this.consume('LPAREN');

        const params: ASTNode[] = [];
        if (!this.match('RPAREN')) {
            do {
                params.push(this.parseIdentifier());
                if (!this.match('COMMA')) break;
                this.consume('COMMA');
            } while (!this.match('RPAREN'));
        }

        this.consume('RPAREN');
        const value = {
            type: 'FunctionExpression',
            id: null,
            params,
            body: this.parseBlockStatement()
        };

        return {
            type: 'MethodDefinition',
            key,
            value,
            kind: 'builder',
            static: false
        };
    }

    private parseMethodDefinition(): ASTNode {
        const isStatic = false;
        this.consume('KEYWORD', 'make');
        const key = this.parseIdentifier();
        this.consume('LPAREN');

        const params: ASTNode[] = [];
        if (!this.match('RPAREN')) {
            do {
                params.push(this.parseIdentifier());
                if (!this.match('COMMA')) break;
                this.consume('COMMA');
            } while (!this.match('RPAREN'));
        }

        this.consume('RPAREN');
        const value = {
            type: 'FunctionExpression',
            id: null,
            params,
            body: this.parseBlockStatement()
        };

        return {
            type: 'MethodDefinition',
            key,
            value,
            kind: 'method',
            static: isStatic
        };
    }

    private parsePropertyDefinition(): ASTNode {
        const key = this.parseIdentifier();
        let value: ASTNode | null = null;

        if (this.match('ASSIGN')) {
            this.advance();
            value = this.parseAssignmentExpression();
        }

        this.consumeOptional('SEMICOLON');

        return {
            type: 'PropertyDefinition',
            key,
            value,
            static: false
        };
    }

    private parseFunctionExpression(): ASTNode {
        this.consume('KEYWORD', 'make');

        let id: ASTNode | null = null;
        if (this.match('IDENTIFIER')) {
            id = this.parseIdentifier();
        }

        this.consume('LPAREN');

        const params: ASTNode[] = [];
        if (!this.match('RPAREN')) {
            do {
                params.push(this.parseIdentifier());
                if (!this.match('COMMA')) break;
                this.consume('COMMA');
            } while (!this.match('RPAREN'));
        }

        this.consume('RPAREN');
        const body = this.parseBlockStatement();

        return { type: 'FunctionExpression', id, params, body };
    }

    private parseArrowFunction(): ASTNode {
        const params: ASTNode[] = [];

        if (this.match('LPAREN')) {
            this.advance();
            if (!this.match('RPAREN')) {
                do {
                    params.push(this.parseIdentifier());
                    if (!this.match('COMMA')) break;
                    this.advance();
                } while (!this.match('RPAREN'));
            }
            this.consume('RPAREN');
        } else {
            params.push(this.parseIdentifier());
        }

        this.consume('ARROW');

        let body: ASTNode;
        if (this.match('LBRACE')) {
            body = this.parseBlockStatement();
        } else {
            const expression = this.parseExpression();
            body = {
                type: 'BlockStatement',
                body: [{ type: 'ReturnStatement', argument: expression }]
            };
        }

        return { type: 'ArrowFunctionExpression', params, body };
    }

    private parseImportStatement(): ASTNode {
        this.consume('KEYWORD', 'bringin');

        const specifiers: ASTNode[] = [];

        if (this.match('IDENTIFIER')) {
            const local = this.parseIdentifier();
            specifiers.push({ type: 'ImportDefaultSpecifier', local });
        } else if (this.match('LBRACE')) {
            this.advance();
            if (!this.match('RBRACE')) {
                do {
                    const imported = this.parseIdentifier();
                    let local = imported;

                    if (this.match('KEYWORD', 'using')) {
                        this.advance();
                        local = this.parseIdentifier();
                    }

                    specifiers.push({ type: 'ImportSpecifier', imported, local });
                    if (!this.match('COMMA')) break;
                    this.advance();
                } while (!this.match('RBRACE'));
            }
            this.consume('RBRACE');
        }

        this.consume('KEYWORD', 'from');
        const source = this.parseLiteral();
        this.consumeOptional('SEMICOLON');

        return { type: 'ImportDeclaration', specifiers, source };
    }

    private parseExportStatement(): ASTNode {
        this.consume('KEYWORD', 'sendout');

        if (this.match('KEYWORD', 'giveback')) {
            this.advance();
            const declaration = this.parseAssignmentExpression();
            this.consumeOptional('SEMICOLON');
            return { type: 'ExportDefaultDeclaration', declaration };
        }
        if (this.match('LBRACE')) {
            this.advance();
            const specifiers: ASTNode[] = [];

            if (!this.match('RBRACE')) {
                do {
                    const local = this.parseIdentifier();
                    let exported = local;

                    if (this.match('KEYWORD', 'using')) {
                        this.advance();
                        exported = this.parseIdentifier();
                    }

                    specifiers.push({ type: 'ExportSpecifier', local, exported });
                    if (!this.match('COMMA')) break;
                    this.advance();
                } while (!this.match('RBRACE'));
            }

            this.consume('RBRACE');
            this.consumeOptional('SEMICOLON');
            return {
                type: 'ExportNamedDeclaration',
                specifiers,
                declaration: null,
                source: null
            };
        }
        const declaration = this.parseStatement();
        return {
            type: 'ExportNamedDeclaration',
            specifiers: [],
            declaration,
            source: null
        };
    }

    private parseStatementList(stopKeywords: string[], stopToken: string): ASTNode[] {
        const statements: ASTNode[] = [];
        while (!this.match(stopToken) && !stopKeywords.some((kw) => this.match('KEYWORD', kw))) {
            statements.push(this.parseStatement());
        }
        return statements;
    }

    private match(type: string, value?: string): boolean {
        if (this.isAtEnd()) return false;
        const token = this.current();
        return token.type === type && (value === undefined || token.value === value);
    }

    private consume(type: string, value?: string): Token {
        if (this.isAtEnd()) {
            throw new SyntaxError(`Unexpected end of input, expected ${type} ${value || ''}`);
        }

        const token = this.current();
        if (token.type !== type) {
            throw new SyntaxError(`Expected ${type} but got ${token.type}`);
        }
        if (value !== undefined && token.value !== value) {
            throw new SyntaxError(`Expected '${value}' but got '${token.value}'`);
        }

        this.position++;
        return token;
    }

    private consumeOptional(type: string): boolean {
        if (this.match(type)) {
            this.advance();
            return true;
        }
        return false;
    }

    private advance(): Token {
        if (this.isAtEnd()) {
            throw new SyntaxError('Unexpected end of input');
        }
        return this.tokens[this.position++];
    }

    private current(): Token {
        if (this.isAtEnd()) {
            throw new SyntaxError('Unexpected end of input');
        }
        return this.tokens[this.position];
    }

    private isAtEnd(): boolean {
        return this.position >= this.tokens.length;
    }
}
