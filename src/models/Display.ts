import { SETTINGS } from "../index.js";
import { coord, Coord, Vector } from "../types/Vector.js";
import { Color } from "../types/Color.js";
import { Engine } from "../Engine.js";
import { Rotation } from "../types/Rotation.js";
import { Tri, mesh } from "../types/Types.js";
import { Triangle } from "../types/Triangle.js";
import { Texture } from "../types/Texture.js";
import { Transform } from "../types/Transforms.js";

/*export const Display = new class __Display {
    private Scale: number = 1;

    private __Canvas: HTMLCanvasElement|undefined;
    get Canvas() { return this.__Canvas!; }
    private set Canvas(v) { this.__Canvas = v; }

    private __Ctx: CanvasRenderingContext2D|undefined;
    get Ctx() { return this.__Ctx!; }
    private set Ctx(v) { this.__Ctx = v; }

    get Height() { return this.Canvas.height; }
    get Width() { return this.Canvas.width; }

    private clearColor: Color = Color.Black;
    private splashImage: ImageBitmap|undefined;

    constructor() {}

    Init() {
        fetch('/images/logo.png').then((data) => data.blob()).then((blob) => createImageBitmap(blob)).then((img) => this.splashImage = img);
        let canvas: HTMLCanvasElement|null = document.getElementById('display') as HTMLCanvasElement|null;
        if (!canvas) {
            canvas = document.createElement('canvas') as HTMLCanvasElement;
            document.appendChild(canvas);
        }

        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        
        this.Canvas = canvas;
        this.Ctx = canvas.getContext('2d')!;

        window.addEventListener('resize', this.ResizeListener.bind(this));
        this.ResizeListener();
    }

    Exit() {
        window.removeEventListener('resize', this.ResizeListener.bind(this));
    }

    Fill(color: Color) {
        this.Ctx.save();

        this.Ctx.fillStyle = color.ToString();

        this.Ctx.beginPath();
        this.Ctx.rect(0, 0, this.Width, this.Height);
        this.Ctx.closePath();
        this.Ctx.fill();

        this.Ctx.restore();
    }

    Clear() {
        this.Fill(this.clearColor);
    }

    SetClearColor(newColor: Color) {
        this.clearColor = newColor;
    }

    DrawMesh(mesh: mesh, location: Vector, rotation: Rotation) {
        const cameraLoc = Engine.Player.Location;
        const target = cameraLoc.Add(Engine.Player.Rotation.Apply(Vector.Out));
        const cameraMatrix = Transform.LookAt(cameraLoc, target, Vector.Up);
        const triBuffer = new Array<Triangle>();

        mesh.Tris.forEach((tri: Tri, i: number) => {
            const triangle = new Triangle(
                ...tri.map((idx) => rotation.Apply(mesh.Vertices[idx]).Add(location)) as [Vector, Vector, Vector],
                mesh.UVMap?.length ? mesh.UVMap[i].map((uv) => new Coord(uv[0], uv[1], 1)) as [Coord, Coord, Coord] : void 0
            );
            const normal = triangle.Q.Subtract(triangle.P).CrossProduct(triangle.R.Subtract(triangle.P)).Normal;

            if (normal.DotProduct(triangle.P.Subtract(cameraLoc).Normal) > 0) return;

            //triangle.Apply((v: Vector) => v.Project(cameraMatrix).Vector);
            
            // Clip Z
            (triangle.Clip(new Vector(0, 0, 0.25), Vector.Out) ?? []).forEach((clip) => {
                const projP = clip.P.Project(Transform.To2D());
                const projQ = clip.Q.Project(Transform.To2D());
                const projR = clip.R.Project(Transform.To2D());

                const projTri = new Triangle(
                    projP.Vector, 
                    projQ.Vector, 
                    projR.Vector,
                    clip.UV ? [
                        Coord.Divide(clip.UV.P, projP.W),
                        Coord.Divide(clip.UV.Q, projQ.W),
                        new Coord(1/projR.W, 1/projR.W, 1/projR.W)
                    ] : void 0
                );

                const offset = {X:1, Y:1, Z:0};
                const correction = {X:this.Width/2, Y:this.Height/2, Z:1};
                projTri.Apply((v: Vector) => v.Multiply(-1).Add(offset).Multiply(correction));
                
                triBuffer.push(projTri);
            });
        });

        const toDist = (v: Triangle) => v.ToArray().reduce((r, ve) => r.Add(ve)).Divide(3).Distance(cameraLoc);
        const edge = [
            [Vector.Zero, Vector.Down],
            [new Vector(0, this.Height - 1, 0), Vector.Up],
            [Vector.Zero, Vector.Right],
            [new Vector(this.Width - 1, 0, 0), Vector.Left]
        ] as Array<[Vector, Vector]>;

        triBuffer.sort((a, b) => toDist(b) - toDist(a)).forEach((tri) => {
            const triList = new Array<Triangle>();
            triList.push(tri);

            let newTris = 1;
            for (let i = 0; i < 4; i++) {
                while (newTris > 0) {
                    const subj = triList.shift();
                    newTris--;

                    (subj!.Clip(...edge[i]) ?? []).forEach((clip) => triList.push(clip));
                }
                newTris = triList.length;
            }

            triList.forEach((triDraw) => {
                if (typeof mesh.Texture != 'string') this.ColorTri(triDraw, mesh.Texture);
                else this.TextureTri(tri, mesh.Texture);
            });
        });
    }

    DrawText(text: string, color: Color = Color.White) {
        this.Ctx.save();

        this.Ctx.font = "50px VT323";
        this.Ctx.fillStyle = color.ToString();
        this.Ctx.textAlign = "center";
        this.Ctx.fillText(text, this.Width/2, this.Height/2 - 25, this.Width);

        this.Ctx.restore();
    }

    async DrawSplash() {
        const splashImg: ImageBitmap = await new Promise((res, _) => {
            const wait = () => {
                if (this.splashImage) res(this.splashImage);
                setTimeout(wait, 100);
            };
            wait();
        });
        this.Ctx.save();

        this.Ctx.drawImage(splashImg, this.Width / 2 - 250, this.Height / 2 - 250, 500, 500);
        
        this.Ctx.restore();

        this.Fill(new Color(0, 0, 0, 0.6));
    }

    private ColorTri(tri: Triangle, color: Color, light: number = 1) {
        console.log('DRAW TRIANGLE', tri);
        light = 1;
        this.Ctx.save();

        const colorStr = color.ApplyLight(light).ToString();
        this.Ctx.fillStyle = colorStr;
        this.Ctx.strokeStyle = colorStr;

        this.Ctx.beginPath();
        this.Ctx.moveTo(tri.P.X, tri.P.Y);
        this.Ctx.lineTo(tri.Q.X, tri.Q.Y);
        this.Ctx.lineTo(tri.R.X, tri.R.Y);
        this.Ctx.closePath();
        
        this.Ctx.fill();
        this.Ctx.stroke();

        this.Ctx.restore();
    }

    private TextureTri(tri: Triangle, texture: string, light: number = 1) {
        light = 1;
        this.Ctx.save();

        if (tri.Q.Y < tri.P.Y) tri.Swap('Q', 'P');
        if (tri.R.Y < tri.P.Y) tri.Swap('R', 'P');
        if (tri.R.Y < tri.Q.Y) tri.Swap('R', 'Q');

        const deltaXY1 = Vector.Subtract(tri.Q, tri.P);
        const deltaUV1 = Coord.Subtract(tri.UV!.Q, tri.UV!.P);
        const deltaXY2 = Vector.Subtract(tri.R, tri.P);
        const deltaUV2 = Coord.Subtract(tri.UV!.R, tri.UV!.P);

        const tex: coord = {U: 0, V: 0, W: 0};

        const deltaStep1 = {X:0, U:0, V:0, W:0} as coord & {X: number};
        const deltaStep2 = Object.assign({}, deltaStep1) as coord & {X: number};

        if (deltaXY2.Y) {
            const dy2 = Math.abs(deltaXY2.Y);
            deltaStep2.X = deltaXY2.X / dy2;
            deltaStep2.U = deltaUV2.U / dy2;
            deltaStep2.V = deltaUV2.V / dy2;
            deltaStep2.W = deltaUV2.W / dy2;
        }

        if (deltaXY1.Y) {
            const dy1 = Math.abs(deltaXY1.Y);
            deltaStep1.X = deltaXY1.X / dy1;
            deltaStep1.U = deltaUV1.U / dy1;
            deltaStep1.V = deltaUV1.V / dy1;
            deltaStep1.W = deltaUV1.W / dy1;

            for (let y = tri.P.Y; y < tri.Q.Y; y++) {
                const yDiff = (y - tri.P.Y);

                let aX = tri.P.X + yDiff * deltaStep1.X;
                let bX = tri.P.X + yDiff * deltaStep2.X;
                let texStart = Coord.Add(tri.UV!.P, Coord.Multiply(deltaStep1, yDiff));
                let texEnd = Coord.Add(tri.UV!.P, Coord.Multiply(deltaStep2, yDiff));

                if (aX > bX) {
                    const t1 = aX;
                    aX = bX;
                    bX = t1;

                    const t2 = texStart;
                    texStart = texEnd;
                    texEnd = t2;
                }

                tex.U = texStart.U;
                tex.V = texStart.V;
                tex.W = texStart.W;

                let t = 0;
                const tStep = 1/(bX - aX);

                for (let x = aX; x < bX; x++) {
                    tex.U = (1 - t) * texStart.U + t * texEnd.U;
                    tex.V = (1 - t) * texStart.V + t * texEnd.V;
                    tex.W = (1 - t) * texStart.W + t * texEnd.W;

                    const pixel = Texture.GetPixel(texture, tex.U/tex.W, tex.V/tex.W);
                    this.Ctx.fillStyle = `rgba(${(pixel[0] * light)|0}, ${(pixel[1] * light)|0}, ${(pixel[2] * light)|0}, ${pixel[3]})`;
                    this.Ctx.fillRect(x, y, 1, 1);

                    t += tStep;
                }
            }
        }

        deltaXY1.Y = tri.R.Y - tri.Q.Y;
        deltaXY1.X = tri.R.X - tri.Q.X;
        deltaUV1.U = tri.UV!.R.U - tri.UV!.Q.U;
        deltaUV1.V = tri.UV!.R.V - tri.UV!.Q.V;
        deltaUV1.W = tri.UV!.R.W - tri.UV!.Q.W;

        if (deltaXY2.Y) deltaStep2.X = deltaXY2.X / Math.abs(deltaXY2.Y);
        deltaStep1.U = deltaStep1.V = 0;

        if (deltaXY1.Y) {
            const dy1 = Math.abs(deltaXY1.Y);
            deltaStep1.X = deltaXY1.X / dy1;
            deltaStep1.U = deltaUV1.U / dy1;
            deltaStep1.V = deltaUV1.V / dy1;
            deltaStep1.W = deltaUV1.W / dy1;

            for (let y = tri.Q.Y; y < tri.R.Y; y++) {
                const yDiff1 = (y - tri.P.Y);
                const yDiff2 = (y - tri.Q.Y);

                let aX = tri.Q.X + yDiff2 * deltaStep1.X;
                let bX = tri.P.X + yDiff1 * deltaStep2.X;
                let texStart = Coord.Add(tri.UV!.Q, Coord.Multiply(deltaStep1, yDiff2));
                let texEnd = Coord.Add(tri.UV!.P, Coord.Multiply(deltaStep2, yDiff1));

                if (aX > bX) {
                    const t1 = aX;
                    aX = bX;
                    bX = t1;

                    const t2 = texStart;
                    texStart = texEnd;
                    texEnd = t2;
                }

                tex.U = texStart.U;
                tex.V = texStart.V;
                tex.W = texStart.W;

                let t = 0;
                const tStep = 1/(bX - aX);

                for (let x = aX; x < bX; x++) {
                    tex.U = (1 - t) * texStart.U + t * texEnd.U;
                    tex.V = (1 - t) * texStart.V + t * texEnd.V;
                    tex.W = (1 - t) * texStart.W + t * texEnd.W;

                    const pixel = Texture.GetPixel(texture, tex.U/tex.W, tex.V/tex.W);
                    this.Ctx.fillStyle = `rgba(${(pixel[0] * light)|0}, ${(pixel[1] * light)|0}, ${(pixel[2] * light)|0}, ${pixel[3]})`;
                    this.Ctx.fillRect(x, y, 1, 1);

                    t += tStep;
                }
            }
        }

        this.Ctx.restore();
    }

    private ResizeListener() {
        const fillHeight: boolean = window.innerHeight / SETTINGS.Ratio[1] <= window.innerWidth / SETTINGS.Ratio[0];
        const newHeight = fillHeight ? window.innerHeight : window.innerWidth / SETTINGS.Ratio[0] * SETTINGS.Ratio[1];
        const newWidth = fillHeight ? window.innerHeight / SETTINGS.Ratio[1] * SETTINGS.Ratio[0] : window.innerWidth;

        if (SETTINGS.DEBUG) {
            console.table({
                'Fill Height': [fillHeight],
                'Ratio': [`X: ${SETTINGS.Ratio[0]} | Y: ${SETTINGS.Ratio[1]}`],
                'Window Height': [window.innerHeight],
                'New Height': [newHeight],
                'Window Width': [window.innerWidth],
                'New Width': [newWidth],
                'Scale': [newHeight / (SETTINGS.Ratio[1] * 100)]
            });
        }

        this.Canvas.height = newHeight;
        this.Canvas.width = newWidth;
        this.Canvas.setAttribute('style', `width:${newWidth}px; height:${newHeight}px;`);
        this.Scale = newHeight / (SETTINGS.Ratio[1] * 100);
    }
};*/

export const Display = new class __Display {
    private Scale: number = 1;

    private __Canvas: HTMLCanvasElement|undefined;
    get Canvas() { return this.__Canvas!; }
    private set Canvas(v) { this.__Canvas = v; }

    private __Ctx: CanvasRenderingContext2D|undefined;
    get Ctx() { return this.__Ctx!; }
    private set Ctx(v) { this.__Ctx = v; }

    get Height() { return this.Canvas.height; }
    get Width() { return this.Canvas.width; }

    private clearColor: Color = Color.Black;
    private splashImage: ImageBitmap|undefined;

    constructor() {}

    Init() {
        fetch('/images/logo.png').then((data) => data.blob()).then((blob) => createImageBitmap(blob)).then((img) => this.splashImage = img);
        let canvas: HTMLCanvasElement|null = document.getElementById('display') as HTMLCanvasElement|null;
        if (!canvas) {
            canvas = document.createElement('canvas') as HTMLCanvasElement;
            document.appendChild(canvas);
        }

        canvas.width = document.body.clientWidth;
        canvas.height = document.body.clientHeight;
        
        this.Canvas = canvas;
        this.Ctx = canvas.getContext('2d')!;

        window.addEventListener('resize', this.ResizeListener.bind(this));
        this.ResizeListener();
    }

    Fill(color: Color) {
        this.Ctx.save();

        this.Ctx.fillStyle = color.ToString();
        this.Ctx.fillRect(0, 0, this.Width, this.Height);

        this.Ctx.restore();
    }

    Clear() {
        this.Fill(this.clearColor);
    }
    
    DrawText(text: string, color: Color = Color.White) {
        this.Ctx.save();

        this.Ctx.font = "50px VT323";
        this.Ctx.fillStyle = color.ToString();
        this.Ctx.textAlign = "center";
        this.Ctx.fillText(text, this.Width/2, this.Height/2 - 25, this.Width);

        this.Ctx.restore();
    }

    DrawMesh(mesh: mesh, location: Vector, rotation: Rotation) {
        const cameraLoc = Engine.Player.Location;
        const target = cameraLoc.Add(Engine.Player.Rotation.Apply(Vector.Out));
        const cameraMatrix = Transform.LookAt(cameraLoc, target, Vector.Up);
        const triBuffer = new Array<[Triangle, number]>();

        mesh.Tris.forEach((tri, i) => {
            const triangle = new Triangle(
                ...tri.map((idx) => rotation.Apply(mesh.Vertices[idx]).Add(location)) as [Vector, Vector, Vector],
                mesh.UVMap?.length ? mesh.UVMap[i].map((uv) => new Coord(uv[0], uv[1], 1)) as [Coord, Coord, Coord] : void 0
            );
            const normal = triangle.Q.Subtract(triangle.P).CrossProduct(triangle.R.Subtract(triangle.P)).Normal;

            if (normal.DotProduct(triangle.P.Subtract(cameraLoc).Normal) > 0) return;

            triangle.Apply((v: Vector) => v.Project(cameraMatrix).Vector);

            const clippedTris = triangle.Clip(new Vector(0, 0, 0.25), Vector.Out) ?? [];
            clippedTris.forEach((clipped) => {
                const projP = clipped.P.Project(Transform.To2D());
                const projQ = clipped.Q.Project(Transform.To2D());
                const projR = clipped.R.Project(Transform.To2D());

                const offset = {X:1, Y:1, Z:0};
                const flip = {X:-1, Y:-1, Z: 1};
                const correction = {X:this.Width/2, Y:this.Height/2, Z:1};

                const projTri = new Triangle(
                    projP.Vector.Multiply(flip).Add(offset).Multiply(correction),
                    projQ.Vector.Multiply(flip).Add(offset).Multiply(correction),
                    projR.Vector.Multiply(flip).Add(offset).Multiply(correction),
                    clipped.UV ? [clipped.UV.P, clipped.UV.Q, clipped.UV.R] : void 0
                );

                triBuffer.push([projTri, mesh.Lighting[i]]);
            });
        });

        const edge = [
            [Vector.Zero, Vector.Down],
            [new Vector(0, this.Height - 1, 0), Vector.Up],
            [Vector.Zero, Vector.Right],
            [new Vector(this.Width - 1, 0, 0), Vector.Left]
        ] as Array<[Vector, Vector]>;

        const dist = (t: Triangle) => (t.P.Z + t.Q.Z + t.R.Z) / 3;
        triBuffer.sort((a, b) => dist(a[0]) - dist(b[0])).forEach(([tri, light]) => {
            let newTris = 1;
            const triList = new Array<Triangle>();
            triList.push(tri);
            
            edge.forEach(([start, end]) => {
                while (newTris > 0) {
                    const bTri = triList.shift();
                    newTris--;

                    (bTri!.Clip(start, end) ?? []).forEach((nTri) => triList.push(nTri));
                }
                newTris = triList.length;
            });
            
            triList.forEach((drawTri) => {
                this.ColorTri(drawTri, new Color(120, 120, 120), light);
            })
        });
    }

    private ColorTri(tri: Triangle, color: Color, light: number = 1) {
        console.log('DRAW TRIANGLE', tri);
        light = 1;
        this.Ctx.save();

        const colorStr = color.ApplyLight(light).ToString();
        this.Ctx.fillStyle = colorStr;
        this.Ctx.strokeStyle = colorStr;

        this.Ctx.beginPath();
        this.Ctx.moveTo(tri.P.X, tri.P.Y);
        this.Ctx.lineTo(tri.Q.X, tri.Q.Y);
        this.Ctx.lineTo(tri.R.X, tri.R.Y);
        this.Ctx.closePath();
        
        this.Ctx.fill();
        this.Ctx.stroke();

        this.Ctx.restore();
    }

    async DrawSplash() {
        await new Promise((res: (img: ImageBitmap) => void, rej: () => void) => {
            const wait = (count = 0) => {
                if (this.splashImage) res(this.splashImage);
                else if (count > 50) rej();
                else setTimeout(() => wait(count+1), 100);
            };
            wait();
        }).then((img: ImageBitmap) => {
            this.Ctx.save();

            this.Ctx.drawImage(img, this.Width / 2 - 250, this.Height / 2 - 250, 500, 500);
            
            this.Ctx.restore();

            this.Fill(new Color(0, 0, 0, 0.6));
        }, () => console.warn("Couldn't load splash image!"));
    }

    private ResizeListener() {
        const fillHeight: boolean = window.innerHeight / SETTINGS.Ratio[1] <= window.innerWidth / SETTINGS.Ratio[0];
        const newHeight = fillHeight ? window.innerHeight : window.innerWidth / SETTINGS.Ratio[0] * SETTINGS.Ratio[1];
        const newWidth = fillHeight ? window.innerHeight / SETTINGS.Ratio[1] * SETTINGS.Ratio[0] : window.innerWidth;

        if (SETTINGS.DEBUG) {
            console.table({
                'Fill Height': [fillHeight],
                'Ratio': [`X: ${SETTINGS.Ratio[0]} | Y: ${SETTINGS.Ratio[1]}`],
                'Window Height': [window.innerHeight],
                'New Height': [newHeight],
                'Window Width': [window.innerWidth],
                'New Width': [newWidth],
                'Scale': [newHeight / (SETTINGS.Ratio[1] * 100)]
            });
        }

        this.Canvas.height = newHeight;
        this.Canvas.width = newWidth;
        this.Canvas.setAttribute('style', `width:${newWidth}px; height:${newHeight}px;`);
        this.Scale = newHeight / (SETTINGS.Ratio[1] * 100);
    }
}