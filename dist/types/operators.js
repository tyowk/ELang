"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Operators = void 0;
const ONE_OPS = {
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
const TWO_OPS = {
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
const THREE_OPS = {
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
const FOUR_OPS = {
    '>>>=': 'UNSIGNED_RIGHT_SHIFT_ASSIGN'
};
exports.Operators = {
    ONE: ONE_OPS,
    TWO: TWO_OPS,
    THREE: THREE_OPS,
    FOUR: FOUR_OPS
};
