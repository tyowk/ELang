export class Environment {
    private variables: Map<string, any>;
    private parent: Environment | null;

    constructor(parent: Environment | null = null) {
        this.variables = new Map<string, any>();
        this.parent = parent;
    }

    public get(name: string): any {
        if (this.variables.has(name)) return this.variables.get(name);
        if (this.parent) return this.parent.get(name);
        throw new ReferenceError(`Variable ${name} is not defined`);
    }

    public set(name: string, value: any): Environment {
        this.variables.set(name, value);
        return this;
    }

    public has(name: string): boolean {
        return this.variables.has(name) || (this.parent ? this.parent.has(name) : false);
    }

    public extend(): Environment {
        return new Environment(this);
    }

    public lookup(name: string): Environment | null {
        if (this.variables.has(name)) return this;
        if (this.parent) return this.parent.lookup(name);
        return null;
    }

    public delete(name: string): boolean {
        if (this.variables.has(name)) {
            this.variables.delete(name);
            return true;
        }
        if (this.parent) return this.parent.delete(name);
        return false;
    }

    public clear(): boolean {
        this.variables.clear();
        return true;
    }

    public get keys(): string[] {
        return Array.from(this.variables.keys());
    }

    public get values(): any[] {
        return Array.from(this.variables.values());
    }

    public get entries(): [string, any][] {
        return Array.from(this.variables.entries());
    }

    public get size(): number {
        return this.variables.size;
    }
}
