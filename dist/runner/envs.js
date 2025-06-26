"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Environment = void 0;
class Environment {
    variables;
    parent;
    constructor(parent = null) {
        this.variables = new Map();
        this.parent = parent;
    }
    get(name) {
        if (this.variables.has(name))
            return this.variables.get(name);
        if (this.parent)
            return this.parent.get(name);
        throw new ReferenceError(`Variable ${name} is not defined`);
    }
    set(name, value) {
        this.variables.set(name, value);
        return this;
    }
    has(name) {
        return this.variables.has(name) || (this.parent ? this.parent.has(name) : false);
    }
    extend() {
        return new Environment(this);
    }
    lookup(name) {
        if (this.variables.has(name))
            return this;
        if (this.parent)
            return this.parent.lookup(name);
        return null;
    }
    delete(name) {
        if (this.variables.has(name)) {
            this.variables.delete(name);
            return true;
        }
        if (this.parent)
            return this.parent.delete(name);
        return false;
    }
    clear() {
        this.variables.clear();
        return true;
    }
    get keys() {
        return Array.from(this.variables.keys());
    }
    get values() {
        return Array.from(this.variables.values());
    }
    get entries() {
        return Array.from(this.variables.entries());
    }
    get size() {
        return this.variables.size;
    }
}
exports.Environment = Environment;
