/**
 * NOT FINISHED YET!
 */

import type { ASTNode } from '../parse';
import { Environment } from './envs';
export { Environment } from './envs';

export class Eval {
    public readonly node: ASTNode;
    public readonly env: Environment;

    constructor(node: ASTNode) {
        this.node = node;
        this.env = new Environment();
    }

    public static run(node: ASTNode): any {
        return new Eval(node).evaluate();
    }

    private evaluate(): any {}
}
