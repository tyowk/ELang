import type { ASTNode } from '../parse';
import { Environment } from './envs';
export { Environment } from './envs';
export declare class Eval {
    readonly node: ASTNode;
    readonly env: Environment;
    constructor(node: ASTNode);
    static run(node: ASTNode): any;
    private evaluate;
}
//# sourceMappingURL=index.d.ts.map