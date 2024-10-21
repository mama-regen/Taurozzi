import { Coord, coord, vector, Vector } from "./Vector.js";

export type triangle = {
    P: vector;
    Q: vector;
    R: vector;
    UV?: {
        P: coord,
        Q: coord,
        R: coord
    }|undefined;
}

export class Triangle implements triangle {
    P: Vector;
    Q: Vector;
    R: Vector;

    UV: {
        P: Coord,
        Q: Coord,
        R: Coord
    }|undefined;

    constructor(p: Vector, q: Vector, r: Vector, uv: Array<Coord>|undefined = void 0) {
        this.P = p;
        this.Q = q;
        this.R = r;
        if (uv) this.UV = {
            P: uv[0],
            Q: uv[1],
            R: uv[2]
        };
    }

    ToArray = () => [this.P, this.Q, this.R] as [Vector, Vector, Vector];

    Area = () => (this.P.X * (this.Q.Y - this.R.Y) + this.Q.X * (this.R.Y - this.P.Y) + this.R.X * (this.P.Y - this.Q.Y)) * 0.5;

    Apply(fn: (v: Vector) => Vector): Triangle {
        this.P = fn(this.P);
        this.Q = fn(this.Q);
        this.R = fn(this.R);
        return this;
    }

    Swap(a: 'P'|'Q'|'R', b: 'P'|'Q'|'R') {
        const t1 = new Vector(this[a]);
        this[a] = this[b];
        this[b] = t1;

        if (this.UV) {
            const t2 = new Coord(this.UV[a]);
            this.UV[a] = this.UV[b];
            this.UV[b] = t2;
        }
    }

    Clip(vector: Vector, plane: Vector): [Triangle, Triangle]|[Triangle]|void {
        plane = plane.Normal;

        const verts = {
            inside: new Array<Vector>(),
            outside: new Array<Vector>()
        };
        const tex = {
            inside: new Array<Coord>(),
            outside: new Array<Coord>()
        };

        let t = 0;

        const dist = (p: Vector) => plane.DotProduct(p) - plane.DotProduct(vector);
        const line = (outI: number, inI: number) => tex.outside[outI].Subtract(tex.inside[inI]).Multiply(t).Add(tex.inside[inI]);
        
        let wch: 'inside'|'outside';
        const keys = ['P','Q','R'] as ['P','Q','R'];
        keys.forEach((key) => {
            wch = dist(this[key]) < 0 ? 'outside' : 'inside';
            verts[wch].push(this[key]);
            if (this.UV) tex[wch].push(this.UV[key]);
        });

        let newTriA: Triangle = new Triangle(this.P, this.Q, this.R, this.UV ? [this.UV.P, this.UV.Q, this.UV.R] : void 0);
        let newTriB: Triangle;

        switch(verts.inside.length) {
            case 1:
                newTriA.P = verts.inside[0];
                if (this.UV) newTriA.UV!.P = tex.inside[0];
    
                [newTriA.Q, t] = vector.Intersect(plane, verts.inside[0], verts.outside[0]);
                if (this.UV) newTriA.UV!.Q = line(0, 0);
    
                [newTriA.R, t] = vector.Intersect(plane, verts.inside[0], verts.outside[1]);
                if (this.UV) newTriA.UV!.R = line(1, 0);
            case 3:
                return [newTriA];
            case 2:
                newTriA.P = verts.inside[0];
                newTriA.Q = verts.inside[1];
                [newTriA.R, t] = vector.Intersect(plane, verts.inside[0], verts.outside[0]);
                if (this.UV) {
                    newTriA.UV!.P = tex.inside[0];
                    newTriA.UV!.Q = tex.inside[1];
                    newTriA.UV!.R = line(0, 0);
                }

                let newR: Vector;
                [newR, t] = vector.Intersect(plane, verts.inside[1], verts.outside[0]);
                newTriB = new Triangle(verts.inside[1], newTriA.R, newR, this.UV ? [tex.inside[1], newTriA.UV!.R, line(0, 1)] : void 0);

                return [newTriA, newTriB];
        }
    }
}