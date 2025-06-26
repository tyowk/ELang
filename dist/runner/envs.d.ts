export declare class Environment {
    private variables;
    private parent;
    constructor(parent?: Environment | null);
    get(name: string): any;
    set(name: string, value: any): Environment;
    has(name: string): boolean;
    extend(): Environment;
    lookup(name: string): Environment | null;
    delete(name: string): boolean;
    clear(): boolean;
    get keys(): string[];
    get values(): any[];
    get entries(): [string, any][];
    get size(): number;
}
//# sourceMappingURL=envs.d.ts.map