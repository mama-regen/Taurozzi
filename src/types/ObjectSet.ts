export class ObjectSet<T extends {id: number}> {
    private value: Map<number, T>;
    
    get length() { return this.value.size; }
    get size() { return this.length; }
    get next() {
        const curr = Math.max(...this.value.keys(), -1) + 1;
        this.value.set(curr, {id: curr} as T);
        return curr;
    }

    constructor(arg: Array<T> = [], key: string = 'id') {
        this.value = new Map<number, T>();
        arg.forEach(this.add.bind(this));
    }

    add(object: T): ObjectSet<T> {
        this.value.set(object.id, object);
        return this;
    }

    has(object: T): boolean {
        return this.value.has(object.id);
    }

    remove(object: T) {
        if (!this.has(object)) return;
        this.value.delete(object.id);
    }

    clear() {
        this.value = new Map<number, T>();
    }

    difference(other: ObjectSet<T>): ObjectSet<T> {
        const result = new Array<T>();
        this.value.keys().forEach((key) => {
            if (!other.has({id: key} as T)) result.push(this.value.get(key)!);
        });
        return new ObjectSet<T>(result);
    }

    intersection(other: ObjectSet<T>): ObjectSet<T> {
        const result = new Array<T>();
        this.value.keys().forEach((key) => {
            if (other.has({id: key} as T)) result.push(this.value.get(key)!);
        })
        return new ObjectSet<T>(result);
    }

    symmetricDifference(other: ObjectSet<T>): ObjectSet<T> {
        const result = new Array<T>();
        this.value.keys().forEach((key) => {
            if (!other.has({id: key} as T)) result.push(this.value.get(key)!);
        });
        other.value.keys().forEach((key) => {
            if (!this.has({id: key} as T)) result.push(other.value.get(key)!);
        });
        return new ObjectSet<T>(result);
    }

    union(other: ObjectSet<T>): ObjectSet<T> {
        const result = new Map<number, T>();
        other.value.keys().forEach((key) => result.set(key, other.value.get(key)!));
        this.value.keys().forEach((key) => result.set(key, this.value.get(key)!));
        return new ObjectSet([...result.values()]);
    }

    isDisjointFrom(other: ObjectSet<T>): boolean {
        return this.intersection(other).length == 0;
    }

    isSubsetOf(other: ObjectSet<T>): boolean {
        return this.difference(other).length == 0;
    }

    isSupersetOf(other: ObjectSet<T>): boolean {
        return other.difference(this).length == 0;
    }

    keys(): Set<number> {
        return new Set([...this.value.keys()]);
    }

    values(): Set<T> {
        return new Set([...this.value.values()]);
    }

    forEach(fn: (object: T, key: number, self: ObjectSet<T>) => void) {
        Array.from(this.value.keys(), (k) => fn(this.value.get(k)!, k, this));
    }
}