import { color, Color } from "../types/Color.js";
import { Texture } from "../types/Texture.js";
import { Transform } from "../types/Transforms.js";
import { mesh, Point, Tri } from "../types/Types.js";
import { Vector, Vector4 } from "../types/Vector.js";

export const ModelLoader = new class __ModelLoader {
    FilePath: string = '/3d_models/';

    async Load (name: string, scale: number = 1): Promise<mesh> {
        return await fetch(this.FilePath + name + ".obj").then((data) => data.text()).then((model) => {
            const verts: Array<Vector> = [];
            const tris: Array<Tri> = [];
            const uvs: Array<Tri> = [];
            const uvMap: Array<Point> = [];
            let mat: string = '';

            model.split('\n').forEach((line) => {
                const splt = line.split(' ');
                const t = splt.shift();
                switch(t) {
                    case 'v':
                        let vert = new Vector(+splt[0], +splt[1], +splt[2]);
                        vert = vert.Multiply(scale);
                        vert = vert.Project(Transform.RotatePitch(Math.PI)).Vector;
                        verts.push(vert);
                        break;
                    case 'f':
                        const fmt = splt.reduce((r: [Array<number>, Array<number>], v: string) => {
                            const s = v.split('/');
                            r[0].push(+s.shift()! - 1);
                            if (s.length) r[1].push(+s.shift()! - 1);
                            return r;
                        }, [[], []]) as [Tri, Tri]
                        tris.push(fmt[0]);
                        if (fmt[1] && fmt[1].length && fmt[1] != void 0) uvs.push(fmt[1]);
                        break;
                    case 'vt':
                        uvMap.push(splt.map((s) => +s) as Point);
                        break;
                    case 'usemtl':
                        mat = splt[0];
                        break;
                }
            });

            return new Promise((res) => {
                if (!mat || mat == '') res(Color.Transparent);
                else {
                    Texture.Create(mat).then((success) => {
                        if (success) res(mat);
                        else res(Color.Magenta);
                    })
                }
            }).then((tex: any) => {
                return {
                    Vertices: verts, 
                    Tris: tris, 
                    Texture: tex as string|Color,
                    UVMap: uvs.map((tI) => tI.map((i) => uvMap[i])) as Array<[Point, Point, Point]>,
                    Lighting: []
                }
            });
        });
    };
}();