import { Engine } from "../Engine.js";
import { SETTINGS } from "../index.js";
import { Color } from "../types/Color.js";
import { Texture } from "../types/Texture.js";
import { light, mesh, Tri } from "../types/Types.js";
import { vector, Vector } from "../types/Vector.js";
import { Display } from "./Display.js";
import { Entity } from "./Entity.js";
import { ModelLoader } from "./ModelLoader.js";

type LevelData = {
    meshes: Array<{
        model: string,
        texture: Tri|string
        location: Tri
    }>,
    lights: Array<{
        location: Tri,
        falloff: [number, number]
    }>
};

export class Level extends Entity {
    private Meshes: Array<mesh> = [];
    private Lights: Array<light> = [];

    AddMesh(mesh: mesh, location: vector) {
        mesh.Vertices = mesh.Vertices.map((vert) => Vector.Add(vert, location));
        this.Meshes.push(mesh);
    }

    AddLight(light: light) {
        this.Lights.push(light);
    }

    Update(deltaTime: number): void { }
    Draw(): void {
        this.Meshes.forEach((mesh) => Display.DrawMesh(mesh, this.Location, this.Rotation));
    }

    async BuildLights() {
        return new Promise<void>((resolve, _) => {
            this.Meshes.forEach((mesh) => {
                mesh.Tris.forEach((tri, i) => {
                    const start = mesh.Vertices.reduce((r, vert) => r.Add(vert)).Divide(3);
                    const normal = Vector.CrossProduct(mesh.Vertices[tri[0]], mesh.Vertices[tri[1]], mesh.Vertices[tri[2]]).Normal;
                    
                    mesh.Lighting[i] = 0;
    
                    this.Lights.some((light) => {
                        if (mesh.Lighting[i] >= 1) return true;
                        const end = light.Location;
                        const dist = Vector.Distance(start, end);
                        if (dist > light.FallOff.End) return false;
    
                        if (this.Meshes.some((meshC) => meshC.Tris.some((triC) => {
                            const checkV = triC.map((tC) =>  meshC.Vertices[tC]) as [Vector, Vector, Vector];
                            if (this.SignedVol(start, ...checkV) == this.SignedVol(end, ...checkV)) return false;
                            const s1 = this.SignedVol(start, end, checkV[0], checkV[1]);
                            const s2 = this.SignedVol(start, end, checkV[1], checkV[2]);
                            const s3 = this.SignedVol(start, end, checkV[2], checkV[1]);
                            return s1 == s2 && s1 == s3;
                        }))) return;

                        let co = 1;
                        if (dist > light.FallOff.Start) co = (dist - light.FallOff.Start) / (light.FallOff.End - light.FallOff.Start);
                        mesh.Lighting[i] = Math.min(1, mesh.Lighting[i] + ((Vector.DotProduct(Vector.In, normal.Normal) + 1) / 2) * co);
                    });

                    mesh.Lighting[i] = Math.min(SETTINGS.AmbientLight, mesh.Lighting[i]);
                })
            });
            resolve();
        });
    }

    static async Load(level: string): Promise<Level> {
        const levelObj = new Level();
        return fetch(`/levels/${level}.json`)
            .then((data) => data.json())
            .then((json: LevelData) => {
                json.lights.forEach((lightData) => levelObj.AddLight({
                    Location: new Vector(...lightData.location), 
                    FallOff: {
                        Start: lightData.falloff[0], 
                        End: lightData.falloff[1]
                    }
                }));
                return Promise.all(json.meshes.map(async (meshData) => {
                    await ModelLoader.Load(meshData.model, 8).then(
                        (mesh: mesh) => {
                            return new Promise<mesh>((res, _) => {
                                if (meshData.texture && Array.isArray(meshData.texture)) {
                                    mesh.Texture = new Color(...meshData.texture);
                                    res(mesh);
                                } else if (typeof meshData.texture == 'string' && !(mesh.Texture instanceof Texture)) {
                                    Texture.Create(meshData.texture).then((success) => {
                                        if (success) mesh.Texture = meshData.texture as string;
                                        else mesh.Texture = Color.Magenta;
                                    }).then(() => res(mesh));
                                } else res(mesh);
                            });
                        }
                    ).then((mesh) => levelObj.AddMesh(mesh, Vector.Multiply(new Vector(...meshData.location), {X: 1, Y: -1, Z: 1})))
                }));
            })
            .then(() => levelObj.BuildLights())
            .then(() => Engine.AddEntity(levelObj))
            .then(() => levelObj);
    }

    private SignedVol(p: Vector, q: Vector, r: Vector, s: Vector) {
        Math.sign(q.Subtract(p).CrossProduct(r.Subtract(p)).DotProduct(Vector.Subtract(s, p)));
    }
};