import { Transform } from "./Transforms.js";
import { Vector } from "./Vector.js";

export type rotation = {Pitch: number, Yaw: number, Roll: number};

export class Rotation implements rotation {
    private data = new Float32Array(3);

    get Pitch() { return this.data[0]; }
    set Pitch(v) { this.data[0] = v; }

    get Yaw() { return this.data[1]; }
    set Yaw(v) { this.data[1] = v; }

    get Roll() { return this.data[2]; }
    set Roll(v) { this.data[2] = v; }

    constructor(pitch: number|undefined = void 0, yaw: number|undefined = void 0, roll: number|undefined = void 0) {
        if (pitch != null) {
            this.Pitch = pitch;
            this.Yaw = yaw!;
            this.Roll = roll!;
        }
    }

    static Equal = (rotA: rotation, rotB: rotation) => rotA.Pitch == rotB.Pitch && rotA.Yaw == rotB.Yaw && rotA.Roll == rotB.Roll;
    Equal = (other: rotation) => Rotation.Equal(this, other);

    Apply(vert: Vector): Vector {
        vert = vert.Project(Transform.RotatePitch(this.Pitch)).Vector;
        vert = vert.Project(Transform.RotateYaw(this.Yaw)).Vector;
        vert = vert.Project(Transform.RotateRoll(this.Roll)).Vector;
        return vert;
    }
}