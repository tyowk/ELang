export type OperatorMap = Record<string, string>;

export interface OperatorSet {
    ONE: OperatorMap;
    TWO: OperatorMap;
    THREE: OperatorMap;
    FOUR: OperatorMap;
}

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
    '=>': 'ARROW',
    '??': 'NULLISH_COALESCING',
    '?.': 'OPTIONAL_CHAINING',
    '+=': 'ADDITION_ASSIGN',
    '-=': 'SUBTRACTION_ASSIGN',
    '*=': 'MULTIPLICATION_ASSIGN',
    '/=': 'DIVISION_ASSIGN',
    '%=': 'MODULO_ASSIGN',
    '&=': 'BITWISE_AND_ASSIGN',
    '|=': 'BITWISE_OR_ASSIGN',
    '^=': 'BITWISE_XOR_ASSIGN'
};

const THREE_OPS: Record<string, string> = {
    '&&=': 'LOGICAL_AND_ASSIGN',
    '||=': 'LOGICAL_OR_ASSIGN',
    '??=': 'NULLISH_COALESCING_ASSIGN',
    '**=': 'EXPONENT_ASSIGN',
    '===': 'STRICT_EQUAL',
    '!==': 'STRICT_NOT_EQUAL',
    '>>>': 'ZERO_FILL_RIGHT_SHIFT',
    '<<=': 'LEFT_SHIFT_ASSIGN',
    '>>=': 'RIGHT_SHIFT_ASSIGN'
};

const FOUR_OPS: Record<string, string> = {
    '>>>=': 'UNSIGNED_RIGHT_SHIFT_ASSIGN'
};

export const Operators: OperatorSet = {
    ONE: ONE_OPS,
    TWO: TWO_OPS,
    THREE: THREE_OPS,
    FOUR: FOUR_OPS
};
