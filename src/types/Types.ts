import { Color } from "./Color.js";
import { Vector, vector } from "./Vector.js";

export type Obj<T = any> = {[key: string]: T};
export type TransformMatrix = [Float32Array, Float32Array, Float32Array, Float32Array];
export type Point = [number, number];
export type Tri = [number, number, number];

export type light = {
    Location: Vector,
    FallOff: {
        Start: number,
        End: number
    }
};

export type mesh = {
    Tris: Array<Tri>,
    Vertices: Array<Vector>,
    Lighting: Array<number>,
    Texture: Color|string,
    UVMap: Array<[Point, Point, Point]>
}