"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Eval = exports.Environment = void 0;
const envs_1 = require("./envs");
const envs_2 = require("./envs");
Object.defineProperty(exports, "Environment", { enumerable: true, get: function () { return envs_2.Environment; } });
class Eval {
    node;
    env;
    constructor(node) {
        this.node = node;
        this.env = new envs_1.Environment();
    }
    static run(node) {
        return new Eval(node).evaluate();
    }
    evaluate() { }
}
exports.Eval = Eval;
