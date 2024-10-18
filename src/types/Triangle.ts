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

        const dist = (p: Vector) => plane.DotProduct(p.Normal) - plane.DotProduct(vector);
        const line = (outI: number, inI: number) => tex.outside[outI].Subtract(tex.inside[inI]).Multiply(t).Subtract(tex.inside[inI]);
        
        let wch: 'inside'|'outside';
        const keys = ['P','Q','R'] as ['P','Q','R'];
        keys.forEach((key) => {
            wch = dist(this[key]) < 0 ? 'outside' : 'inside';
            verts[wch].push(this[key]);
            if (this.UV) tex[wch].push(this.UV[key]);
        });

        switch(verts.inside.length) {
            case 1:
                this.P = verts.inside[0];
                if (this.UV) this.UV.P = tex.inside[0];
    
                [this.Q, t] = vector.Intersect(plane, verts.inside[0], verts.outside[0]);
                if (this.UV) this.UV.Q = line(0, 0);
    
                [this.R, t] = vector.Intersect(plane, verts.inside[0], verts.outside[1]);
                if (this.UV) this.UV.R = line(1, 0);
            case 3:
                return [this];
            case 2:
                const newTri = new Triangle(Vector.Zero, Vector.Zero, Vector.Zero);

                this.P = verts.inside[0];
                this.Q = verts.inside[1];
                [this.R, t] = vector.Intersect(plane, verts.inside[0], verts.outside[0]);
                if (this.UV) {
                    this.UV.P = tex.inside[0];
                    this.UV.Q = tex.inside[1];
                    this.UV.R = line(0, 0);
                }

                newTri.P = verts.inside[1];
                newTri.Q = this.R;
                [newTri.R, t] = vector.Intersect(plane, verts.inside[1], verts.outside[0]);
                if (this.UV) newTri.UV = {
                    P: tex.inside[1],
                    Q: this.UV!.R,
                    R: line(0, 1)
                };

                return [this, newTri];
        }
    }
}