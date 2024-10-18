import { TransformMatrix } from "./Types.js";

export type vector = {X: number, Y: number, Z: number};
export type coord = {U: number, V: number, W: number};
export type vector4 = vector & {W: number};

export class Vector implements vector {
    protected data = new Float32Array(3);

    protected __Magnitude: number = -1;
    get Magnitude() {
        if (this.__Magnitude < 0) this.__Magnitude = Math.max(0.001, Math.sqrt(this.DotProduct(this)));
        return this.__Magnitude;
    }

    get X() { return this.data[0]; }
    set X(v) { 
        this.data[0] = v; 
        this.__Magnitude = -1; 
    }

    get Y() { return this.data[1]; }
    set Y(v) { 
        this.data[1] = v; 
        this.__Magnitude = -1; 
    }

    get Z() { return this.data[2]; }
    set Z(v) { 
        this.data[2] = v;
        this.__Magnitude = -1;
    }

    get Normal() {
        return new Vector(
            this.X / this.Magnitude, 
            this.Y / this.Magnitude,
            this.Z / this.Magnitude
        );
    }

    constructor(v: vector);
    constructor(x: number, y: number, z: number);
    constructor(vx: vector|number, y: number|undefined = void 0, z: number|undefined = void 0) {
        const isNum = typeof vx == 'number';
        this.data[0] = (isNum ? vx : vx.X); 
        this.data[1] = (isNum ? y! : vx.Y);
        this.data[2] = (isNum ? z! : vx.Z);

        if ((typeof vx == 'number' && Number.isNaN(vx)) || (y != null && Number.isNaN(y)) || (z != null && Number.isNaN(z))) {
            console.trace('1');
        }

        if (vx.hasOwnProperty('X') && (Number.isNaN((vx as vector).X) || Number.isNaN((vx as vector).Y) || Number.isNaN((vx as vector).Z))) {
            console.trace('2');
        }

        if (vx == null) {
            console.trace('3');
        }
    }

    ToArray = () => this.data;

    static DotProduct = (a: vector, b: vector) => a.X * b.X + a.Y * b.Y + a.Z * b.Z;
    DotProduct = (other: vector) => Vector.DotProduct(this, other);

    static CrossProduct(p: vector, q: vector, r: vector|undefined = void 0): Vector {
        const a = !r ? p : Vector.Subtract(q, p);
        const b = !r ? q : Vector.Subtract(r, p);
        return new Vector(
            a.Y * b.Z - a.Z * b.Y,
            a.Z * b.X - a.X * b.Z,
            a.X * b.Y - a.Y * b.X
        ).Normal;
    }
    CrossProduct = (q: vector, r: vector|undefined = void 0) => Vector.CrossProduct(this, q, r);

    static Equal = (a: vector, b: vector) => a.X == b.X && a.Y == b.Y && a.Z == b.Z;
    Equal = (other: vector) => Vector.Equal(this, other);

    static Add(a: vector, b: vector|number): Vector {
        const isNum = typeof b == 'number';
        return new Vector(
            a.X + (isNum ? b : b.X),
            a.Y + (isNum ? b : b.Y),
            a.Z + (isNum ? b : b.Z)
        );
    }
    Add = (other: vector|number) => Vector.Add(this, other);

    static Subtract(a: vector, b: vector|number): Vector {
        const isNum = typeof b == 'number';
        return new Vector(
            a.X - (isNum ? b : b.X),
            a.Y - (isNum ? b : b.Y),
            a.Z - (isNum ? b : b.Z)
        );
    }
    Subtract = (other: vector|number) => Vector.Subtract(this, other);

    static Multiply(a: vector, b: vector|number): Vector {
        const isNum = typeof b == 'number';
        return new Vector(
            a.X * (isNum ? b : b.X),
            a.Y * (isNum ? b : b.Y),
            a.Z * (isNum ? b : b.Z)
        );
    }
    Multiply = (other: vector|number) => Vector.Multiply(this, other);

    static Divide(a: vector, b: vector|number): Vector {
        const isNum = typeof b == 'number';
        return new Vector(
            a.X / (isNum ? b : b.X),
            a.Y / (isNum ? b : b.Y),
            a.Z / (isNum ? b : b.Z)
        );
    }
    Divide = (other: vector|number) => Vector.Divide(this, other);

    static Distance = (a: vector, b: vector) => Math.sqrt((a.X - b.X) ** 2 + (a.Y - b.Y) ** 2 + (a.Z - b.Z) ** 2);
    Distance = (other: vector) => Vector.Distance(this, other);

    Project(matrix: TransformMatrix): Vector4 {
        const values = Array.from({length: 4}, (_, i) => this.X * matrix[0][i] + this.Y * matrix[1][i] + this.Z * matrix[2][i] + matrix[3][i]);
        return new Vector4(values[0], values[1], values[2], Math.max(0.001, values[3]));
    }

    Intersect(plane: Vector, lineStart: Vector, lineEnd: Vector): [Vector, number] {
        plane = plane.Normal;
        const startDot = lineStart.DotProduct(plane);
        const endDot = lineEnd.DotProduct(plane);
        const t = (plane.DotProduct(this) - startDot) / (endDot - startDot);
        const intersect = lineEnd.Subtract(lineStart).Multiply(t);
        return [lineStart.Add(intersect), t];
    }

    CenterZero(vertices: Array<vector>): Array<Vector> {
        let avg = {X: 0, Y: 0, Z: 0};
        vertices.forEach((vert) => avg = Vector.Add(avg, vert));
        avg = Vector.Divide(avg, vertices.length);
        return vertices.map((vert) => Vector.Subtract(vert, avg));
    }

    static Up = new Vector(0, -1, 0);
    static Down = new Vector(0, 1, 0);
    static Left = new Vector(-1, 0, 0);
    static Right = new Vector(1, 0, 0);
    static In = new Vector(0, 0, -1);
    static Out = new Vector(0, 0, 1);
    static Zero = new Vector(0, 0, 0);
}

export class Vector4 extends Vector implements vector4 {
    protected data = new Float32Array(4);

    get W() { return this.data[3]; }
    set W(v) { this.data[3] = v; }

    get Normal() {
        return new Vector4(
            this.X / this.Magnitude, 
            this.Y / this.Magnitude,
            this.Z / this.Magnitude,
            this.W / this.Magnitude
        );
    }

    get Vector() {
        return new Vector(this.X/this.W, this.Y/this.W, this.Z/this.W);
    }

    constructor(x: number, y: number, z: number, w: number) {
        super(Vector.Zero);
        this.data[0] = x;
        this.data[1] = y;
        this.data[2] = z;
        this.data[3] = w;
    }
}

export class Coord implements coord {
    protected data: Float32Array = new Float32Array(3);

    get U() { return this.data[0]; }
    set U(v) { this.data[0] = v; }

    get V() { return this.data[1]; }
    set V(v) { this.data[1] = v; }

    get W() { return this.data[2]; }
    set W(v) { this.data[2] = v; }

    constructor(c: coord);
    constructor(u: number, v: number, w: number);
    constructor(cu: coord|number, v: number|undefined = void 0, w: number|undefined = void 0) {
        const isNum = typeof cu == 'number';
        this.data[0] = (isNum ? cu : cu.U);
        this.data[1] = (isNum ? v! : cu.V);
        this.data[2] = (isNum ? w! : cu.W);
    }

    static Add(a: coord, b: coord|number): Coord {
        const isNum = typeof b == 'number';
        return new Coord(
            a.U + (isNum ? b : b.U),
            a.V + (isNum ? b : b.V),
            a.W + (isNum ? b : b.W)
        );
    }
    Add = (other: coord|number) => Coord.Add(this, other);

    static Subtract(a: coord, b: coord|number): Coord {
        const isNum = typeof b == 'number';
        return new Coord(
            a.U - (isNum ? b : b.U),
            a.V - (isNum ? b : b.V),
            a.W - (isNum ? b : b.W)
        );
    }
    Subtract = (other: coord|number) => Coord.Subtract(this, other);

    static Multiply(a: coord, b: coord|number): Coord {
        const isNum = typeof b == 'number';
        return new Coord(
            a.U * (isNum ? b : b.U),
            a.V * (isNum ? b : b.V),
            a.W * (isNum ? b : b.W)
        );
    }
    Multiply = (other: coord|number) => Coord.Multiply(this, other);

    static Divide(a: coord, b: coord|number): Coord {
        const isNum = typeof b == 'number';
        return new Coord(
            a.U / (isNum ? b : b.U),
            a.V / (isNum ? b : b.V),
            a.W / (isNum ? b : b.W)
        );
    }
    Divide = (other: coord|number) => Coord.Divide(this, other);

    static Empty = new Coord(0, 0, 0);
}