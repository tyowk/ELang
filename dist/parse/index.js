"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
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
class Parser {
    tokens;
    position;
    constructor(tokens) {
        this.tokens = tokens;
        this.position = 0;
    }
    static run(tokens) {
        return new Parser(tokens).parseProgram();
    }
    parseProgram() {
        const statements = [];
        while (!this.isAtEnd()) {
            statements.push(this.parseStatement());
        }
        return { type: 'Program', body: statements };
    }
    parseStatement() {
        if (this.match('KEYWORD')) {
            const keyword = this.current().value;
            const methodName = STATEMENT_KEYWORDS.get(keyword);
            if (methodName) {
                return this[methodName]();
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
    parseIfStatement() {
        this.consume('KEYWORD', 'whenever');
        this.consume('LPAREN');
        const test = this.parseExpression();
        this.consume('RPAREN');
        const consequent = this.parseStatement();
        let alternate = null;
        if (this.match('KEYWORD', 'orwhat')) {
            this.advance();
            alternate = this.match('KEYWORD', 'whenever') ? this.parseIfStatement() : this.parseStatement();
        }
        return { type: 'IfStatement', test, consequent, alternate };
    }
    parseWhileStatement() {
        this.consume('KEYWORD', 'aslongas');
        this.consume('LPAREN');
        const test = this.parseExpression();
        this.consume('RPAREN');
        const body = this.parseStatement();
        return { type: 'WhileStatement', test, body };
    }
    parseDoWhileStatement() {
        this.consume('KEYWORD', 'attempt');
        const body = this.parseStatement();
        this.consume('KEYWORD', 'aslongas');
        this.consume('LPAREN');
        const test = this.parseExpression();
        this.consume('RPAREN');
        this.consumeOptional('SEMICOLON');
        return { type: 'DoWhileStatement', body, test };
    }
    parseForStatement() {
        this.consume('KEYWORD', 'loopit');
        this.consume('LPAREN');
        let init = null;
        if (!this.match('SEMICOLON')) {
            init =
                this.match('KEYWORD', 'thing') || this.match('KEYWORD', 'lock') || this.match('KEYWORD', 'maybe')
                    ? this.parseVariableDeclaration(true)
                    : this.parseExpression();
            if (!this.match('SEMICOLON'))
                this.consume('SEMICOLON');
        }
        else {
            this.consume('SEMICOLON');
        }
        const test = this.match('SEMICOLON') ? null : this.parseExpression();
        this.consume('SEMICOLON');
        const update = this.match('RPAREN') ? null : this.parseExpression();
        this.consume('RPAREN');
        const body = this.parseStatement();
        return { type: 'ForStatement', init, test, update, body };
    }
    parseFunctionDeclaration() {
        this.consume('KEYWORD', 'make');
        const id = this.parseIdentifier();
        this.consume('LPAREN');
        const params = [];
        if (!this.match('RPAREN')) {
            do {
                params.push(this.parseIdentifier());
                if (!this.match('COMMA'))
                    break;
                this.consume('COMMA');
            } while (!this.match('RPAREN'));
        }
        this.consume('RPAREN');
        const body = this.parseBlockStatement();
        return { type: 'FunctionDeclaration', id, params, body };
    }
    parseReturnStatement() {
        this.consume('KEYWORD', 'sendback');
        const argument = this.match('SEMICOLON') ? null : this.parseExpression();
        this.consumeOptional('SEMICOLON');
        return { type: 'ReturnStatement', argument };
    }
    parseVariableDeclaration(inForInit = false) {
        const kind = this.consume('KEYWORD').value;
        const declarations = [];
        let isBreak = false;
        do {
            const id = this.parseIdentifier();
            let init = null;
            if (this.match('ASSIGN')) {
                this.advance();
                init = this.parseAssignmentExpression();
            }
            declarations.push({ type: 'VariableDeclarator', id, init });
            if (!this.match('COMMA'))
                isBreak = true;
            this.advance();
        } while (isBreak === false);
        if (!inForInit)
            this.consumeOptional('SEMICOLON');
        return { type: 'VariableDeclaration', kind, declarations };
    }
    parseAssignmentExpression() {
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
            }
            catch {
                this.position = checkpoint;
                return this.parseExpression();
            }
        }
        return this.parseExpression();
    }
    parseBlockStatement() {
        this.consume('LBRACE');
        const body = [];
        while (!this.match('RBRACE') && !this.isAtEnd()) {
            body.push(this.parseStatement());
        }
        this.consume('RBRACE');
        return { type: 'BlockStatement', body };
    }
    parseExpressionStatement() {
        const expression = this.parseExpression();
        this.consumeOptional('SEMICOLON');
        return { type: 'ExpressionStatement', expression };
    }
    parseExpression() {
        return this.parseAssignment();
    }
    parseAssignment() {
        const left = this.parseLogicalOr();
        if (this.match('ASSIGN')) {
            this.advance();
            const right = this.parseAssignment();
            return { type: 'AssignmentExpression', operator: '=', left, right };
        }
        return left;
    }
    parseLogicalOr() {
        let left = this.parseLogicalAnd();
        while (this.match('OR')) {
            const operator = this.advance().value;
            const right = this.parseLogicalAnd();
            left = { type: 'LogicalExpression', operator, left, right };
        }
        return left;
    }
    parseLogicalAnd() {
        let left = this.parseBitwiseOr();
        while (this.match('AND')) {
            const operator = this.advance().value;
            const right = this.parseBitwiseOr();
            left = { type: 'LogicalExpression', operator, left, right };
        }
        return left;
    }
    parseBitwiseOr() {
        return this.parseBinaryExpression(() => this.parseBitwiseXor(), ['BITWISE_OR']);
    }
    parseBitwiseXor() {
        return this.parseBinaryExpression(() => this.parseBitwiseAnd(), ['BITWISE_XOR']);
    }
    parseBitwiseAnd() {
        return this.parseBinaryExpression(() => this.parseEquality(), ['BITWISE_AND']);
    }
    parseEquality() {
        return this.parseBinaryExpression(() => this.parseRelational(), ['EQUAL', 'NOT_EQUAL', 'STRICT_EQUAL', 'STRICT_NOT_EQUAL']);
    }
    parseRelational() {
        return this.parseBinaryExpression(() => this.parseAdditive(), ['LT', 'LTE', 'GT', 'GTE', 'INSTANCEOF', 'IN']);
    }
    parseAdditive() {
        return this.parseBinaryExpression(() => this.parseMultiplicative(), ['PLUS', 'MINUS']);
    }
    parseMultiplicative() {
        return this.parseBinaryExpression(() => this.parseUnary(), ['MULTIPLY', 'DIVIDE', 'MODULO']);
    }
    parseBinaryExpression(parseNext, operators) {
        let left = parseNext();
        while (operators.some((op) => this.match(op))) {
            const operator = this.advance().value;
            const right = parseNext();
            left = { type: 'BinaryExpression', operator, left, right };
        }
        return left;
    }
    parseUnary() {
        const unaryOps = ['NOT', 'PLUS', 'MINUS', 'BITWISE_NOT', 'DELETE', 'VOID', 'TYPEOF'];
        if (unaryOps.some((op) => this.match(op))) {
            const operator = this.advance().value;
            const argument = this.parseUnary();
            return { type: 'UnaryExpression', operator, argument, prefix: true };
        }
        return this.parsePrimary();
    }
    parsePrimary() {
        let node;
        if (this.match('NUMBER') || this.match('STRING') || this.match('TEMPLATE')) {
            node = this.parseLiteral();
        }
        else if (this.match('KEYWORD', 'yes')) {
            this.advance();
            node = { type: 'Literal', value: true };
        }
        else if (this.match('KEYWORD', 'no')) {
            this.advance();
            node = { type: 'Literal', value: false };
        }
        else if (this.match('KEYWORD', 'nothing')) {
            this.advance();
            node = { type: 'Literal', value: null };
        }
        else if (this.match('KEYWORD', 'myself')) {
            this.advance();
            node = { type: 'ThisExpression' };
        }
        else if (this.match('KEYWORD', 'make')) {
            return this.parseFunctionExpression();
        }
        else if (this.match('KEYWORD', 'blueprint')) {
            return this.parseClassExpression();
        }
        else if (this.match('KEYWORD', 'fresh')) {
            return this.parseNewExpression();
        }
        else if (this.match('LBRACKET')) {
            node = this.parseArrayExpression();
        }
        else if (this.match('LBRACE')) {
            node = this.parseObjectExpression();
        }
        else if (this.match('IDENTIFIER')) {
            node = this.parseIdentifier();
        }
        else if (this.match('LPAREN')) {
            this.advance();
            node = this.parseExpression();
            this.consume('RPAREN');
        }
        else {
            throw new SyntaxError(`Unexpected token: ${this.current().type} ${this.current().value}`);
        }
        return this.parsePostfixOperations(node);
    }
    parsePostfixOperations(_node) {
        let node = _node;
        while (true) {
            if (this.match('LPAREN')) {
                node = this.parseCallExpression(node);
            }
            else if (this.match('DOT')) {
                this.advance();
                const property = this.parseIdentifier();
                node = {
                    type: 'MemberExpression',
                    object: node,
                    property,
                    computed: false
                };
            }
            else if (this.match('LBRACKET')) {
                this.advance();
                const property = this.parseExpression();
                this.consume('RBRACKET');
                node = {
                    type: 'MemberExpression',
                    object: node,
                    property,
                    computed: true
                };
            }
            else {
                break;
            }
        }
        return node;
    }
    parseNewExpression() {
        this.consume('KEYWORD', 'fresh');
        const callee = this.parsePrimary();
        const args = [];
        if (this.match('LPAREN')) {
            this.advance();
            if (!this.match('RPAREN')) {
                do {
                    args.push(this.parseExpression());
                    if (!this.match('COMMA'))
                        break;
                    this.advance();
                } while (!this.match('RPAREN'));
            }
            this.consume('RPAREN');
        }
        return { type: 'NewExpression', callee, arguments: args };
    }
    parseArrayExpression() {
        this.consume('LBRACKET');
        const elements = [];
        if (!this.match('RBRACKET')) {
            do {
                if (this.match('COMMA')) {
                    elements.push(null);
                }
                else {
                    elements.push(this.parseExpression());
                }
                if (!this.match('COMMA'))
                    break;
                this.advance();
            } while (!this.match('RBRACKET'));
        }
        this.consume('RBRACKET');
        return { type: 'ArrayExpression', elements };
    }
    parseObjectExpression() {
        this.consume('LBRACE');
        const properties = [];
        if (!this.match('RBRACE')) {
            do {
                const property = this.parseProperty();
                properties.push(property);
                if (!this.match('COMMA'))
                    break;
                this.advance();
            } while (!this.match('RBRACE'));
        }
        this.consume('RBRACE');
        return { type: 'ObjectExpression', properties };
    }
    parseProperty() {
        let key;
        let computed = false;
        if (this.match('LBRACKET')) {
            this.advance();
            key = this.parseExpression();
            this.consume('RBRACKET');
            computed = true;
        }
        else if (this.match('STRING') || this.match('NUMBER')) {
            key = this.parseLiteral();
        }
        else {
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
    parseLiteral() {
        const token = this.advance();
        let value = token.value;
        if (token.type === 'NUMBER') {
            value = Number(token.value);
        }
        else if (token.type === 'TEMPLATE') {
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
    parseIdentifier() {
        const token = this.consume('IDENTIFIER');
        return { type: 'Identifier', name: token.value };
    }
    parsePostfixExpression() {
        const node = this.parseIdentifier();
        return this.parsePostfixOperations(node);
    }
    parseCallExpression(callee) {
        this.consume('LPAREN');
        const args = [];
        if (!this.match('RPAREN')) {
            do {
                args.push(this.parseExpression());
                if (!this.match('COMMA'))
                    break;
                this.advance();
            } while (!this.match('RPAREN'));
        }
        this.consume('RPAREN');
        return { type: 'CallExpression', callee, arguments: args };
    }
    parseBreakStatement() {
        this.consume('KEYWORD', 'snapout');
        this.consumeOptional('SEMICOLON');
        return { type: 'BreakStatement' };
    }
    parseContinueStatement() {
        this.consume('KEYWORD', 'keepgoing');
        this.consumeOptional('SEMICOLON');
        return { type: 'ContinueStatement' };
    }
    parseSwitchStatement() {
        this.consume('KEYWORD', 'matchcase');
        this.consume('LPAREN');
        const discriminant = this.parseExpression();
        this.consume('RPAREN');
        this.consume('LBRACE');
        const cases = [];
        while (!this.match('RBRACE')) {
            if (this.match('KEYWORD', 'scenario')) {
                this.advance();
                const test = this.parseExpression();
                this.consume('COLON');
                const consequent = this.parseStatementList(['scenario', 'otherwise'], 'RBRACE');
                cases.push({ type: 'SwitchCase', test, consequent });
            }
            else if (this.match('KEYWORD', 'otherwise')) {
                this.advance();
                this.consume('COLON');
                const consequent = this.parseStatementList(['scenario'], 'RBRACE');
                cases.push({ type: 'SwitchCase', test: null, consequent });
            }
            else {
                throw new SyntaxError(`Unexpected token in switch: ${this.current().type} ${this.current().value}`);
            }
        }
        this.consume('RBRACE');
        return { type: 'SwitchStatement', discriminant, cases };
    }
    parseThrowStatement() {
        this.consume('KEYWORD', 'boom');
        const argument = this.parseExpression();
        this.consumeOptional('SEMICOLON');
        return { type: 'ThrowStatement', argument };
    }
    parseTryCatchFinally() {
        this.consume('KEYWORD', 'risky');
        const block = this.parseBlockStatement();
        let handler = null;
        if (this.match('KEYWORD', 'grab')) {
            this.advance();
            this.consume('LPAREN');
            const param = this.parseIdentifier();
            this.consume('RPAREN');
            const body = this.parseBlockStatement();
            handler = { type: 'CatchClause', param, body };
        }
        let finalizer = null;
        if (this.match('KEYWORD', 'cleanup')) {
            this.advance();
            finalizer = this.parseBlockStatement();
        }
        return { type: 'TryStatement', block, handler, finalizer };
    }
    parseClassDeclaration() {
        this.consume('KEYWORD', 'blueprint');
        const id = this.parseIdentifier();
        let superClass = null;
        if (this.match('KEYWORD', 'buildon')) {
            this.advance();
            superClass = this.parseIdentifier();
        }
        this.consume('LBRACE');
        const body = this.parseClassBody();
        this.consume('RBRACE');
        return { type: 'ClassDeclaration', id, superClass, body };
    }
    parseClassExpression() {
        this.consume('KEYWORD', 'blueprint');
        let id = null;
        if (this.match('IDENTIFIER')) {
            id = this.parseIdentifier();
        }
        let superClass = null;
        if (this.match('KEYWORD', 'buildon')) {
            this.advance();
            superClass = this.parseIdentifier();
        }
        this.consume('LBRACE');
        const body = this.parseClassBody();
        this.consume('RBRACE');
        return { type: 'ClassExpression', id, superClass, body };
    }
    parseClassBody() {
        const body = [];
        while (!this.match('RBRACE') && !this.isAtEnd()) {
            if (this.match('KEYWORD', 'make')) {
                body.push(this.parseMethodDefinition());
            }
            else if (this.match('IDENTIFIER')) {
                if (this.current().value === 'builder') {
                    body.push(this.parseConstructorDefinition());
                }
                else {
                    body.push(this.parsePropertyDefinition());
                }
            }
            else if (this.match('KEYWORD', 'builder')) {
                body.push(this.parseConstructorDefinition());
            }
            else {
                throw new SyntaxError(`Unexpected token in class body: ${this.current().type} ${this.current().value}`);
            }
        }
        return { type: 'ClassBody', body };
    }
    parseConstructorDefinition() {
        let key;
        if (this.match('KEYWORD', 'builder')) {
            const token = this.advance();
            key = { type: 'Identifier', name: token.value };
        }
        else {
            key = this.parseIdentifier();
        }
        this.consume('LPAREN');
        const params = [];
        if (!this.match('RPAREN')) {
            do {
                params.push(this.parseIdentifier());
                if (!this.match('COMMA'))
                    break;
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
    parseMethodDefinition() {
        const isStatic = false;
        this.consume('KEYWORD', 'make');
        const key = this.parseIdentifier();
        this.consume('LPAREN');
        const params = [];
        if (!this.match('RPAREN')) {
            do {
                params.push(this.parseIdentifier());
                if (!this.match('COMMA'))
                    break;
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
    parsePropertyDefinition() {
        const key = this.parseIdentifier();
        let value = null;
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
    parseFunctionExpression() {
        this.consume('KEYWORD', 'make');
        let id = null;
        if (this.match('IDENTIFIER')) {
            id = this.parseIdentifier();
        }
        this.consume('LPAREN');
        const params = [];
        if (!this.match('RPAREN')) {
            do {
                params.push(this.parseIdentifier());
                if (!this.match('COMMA'))
                    break;
                this.consume('COMMA');
            } while (!this.match('RPAREN'));
        }
        this.consume('RPAREN');
        const body = this.parseBlockStatement();
        return { type: 'FunctionExpression', id, params, body };
    }
    parseArrowFunction() {
        const params = [];
        if (this.match('LPAREN')) {
            this.advance();
            if (!this.match('RPAREN')) {
                do {
                    params.push(this.parseIdentifier());
                    if (!this.match('COMMA'))
                        break;
                    this.advance();
                } while (!this.match('RPAREN'));
            }
            this.consume('RPAREN');
        }
        else {
            params.push(this.parseIdentifier());
        }
        this.consume('ARROW');
        let body;
        if (this.match('LBRACE')) {
            body = this.parseBlockStatement();
        }
        else {
            const expression = this.parseExpression();
            body = {
                type: 'BlockStatement',
                body: [{ type: 'ReturnStatement', argument: expression }]
            };
        }
        return { type: 'ArrowFunctionExpression', params, body };
    }
    parseImportStatement() {
        this.consume('KEYWORD', 'bringin');
        const specifiers = [];
        if (this.match('IDENTIFIER')) {
            const local = this.parseIdentifier();
            specifiers.push({ type: 'ImportDefaultSpecifier', local });
        }
        else if (this.match('LBRACE')) {
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
                    if (!this.match('COMMA'))
                        break;
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
    parseExportStatement() {
        this.consume('KEYWORD', 'sendout');
        if (this.match('KEYWORD', 'giveback')) {
            this.advance();
            const declaration = this.parseAssignmentExpression();
            this.consumeOptional('SEMICOLON');
            return { type: 'ExportDefaultDeclaration', declaration };
        }
        if (this.match('LBRACE')) {
            this.advance();
            const specifiers = [];
            if (!this.match('RBRACE')) {
                do {
                    const local = this.parseIdentifier();
                    let exported = local;
                    if (this.match('KEYWORD', 'using')) {
                        this.advance();
                        exported = this.parseIdentifier();
                    }
                    specifiers.push({ type: 'ExportSpecifier', local, exported });
                    if (!this.match('COMMA'))
                        break;
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
    parseStatementList(stopKeywords, stopToken) {
        const statements = [];
        while (!this.match(stopToken) && !stopKeywords.some((kw) => this.match('KEYWORD', kw))) {
            statements.push(this.parseStatement());
        }
        return statements;
    }
    match(type, value) {
        if (this.isAtEnd())
            return false;
        const token = this.current();
        return token.type === type && (value === undefined || token.value === value);
    }
    consume(type, value) {
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
    consumeOptional(type) {
        if (this.match(type)) {
            this.advance();
            return true;
        }
        return false;
    }
    advance() {
        if (this.isAtEnd()) {
            throw new SyntaxError('Unexpected end of input');
        }
        return this.tokens[this.position++];
    }
    current() {
        if (this.isAtEnd()) {
            throw new SyntaxError('Unexpected end of input');
        }
        return this.tokens[this.position];
    }
    isAtEnd() {
        return this.position >= this.tokens.length;
    }
}
exports.Parser = Parser;
