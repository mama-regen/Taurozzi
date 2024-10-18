import { SETTINGS } from "../index.js";
import { Obj, TransformMatrix } from "./Types.js";
import { Vector, vector } from "./Vector.js";

const cache: Obj<number|undefined> = {
    fov: void 0,
    zScale: void 0,
    aspectRation: void 0
};

const newTransform = () => Array.from({length: 4}, (_) => new Float32Array(4).fill(0)) as [Float32Array, Float32Array, Float32Array, Float32Array];

const COS = Math.cos;
const SIN = Math.sin;
const TAN = Math.tan;
const PI = Math.PI;

export class Transform {
    static To2D(): TransformMatrix {
        if (!cache.fov) {
            cache.fov = 1 / TAN(SETTINGS.FOV * 0.5 / 180 * PI);
            cache.zScale = SETTINGS.ZFar / (SETTINGS.ZFar - SETTINGS.ZNear);
            cache.aspectRatio = SETTINGS.Ratio[1] / SETTINGS.Ratio[0];
        }

        const result = newTransform();
        result[0][0] = cache.aspectRatio! * cache.fov!;
        result[1][1] = cache.fov!;
        result[2][2] = cache.zScale!;
        result[2][3] = 1;
        result[3][2] = cache.zScale! * -SETTINGS.ZNear;

        return result;
    }

    static PointAt(position: vector, target: vector, up: vector): TransformMatrix {
        const forward = Vector.Subtract(target, position).Normal;
        const projectedUp = Vector.Subtract(up, Vector.Multiply(forward, Vector.DotProduct(up, forward))).Normal;
        const right = Vector.CrossProduct(projectedUp, forward);

        const result = newTransform();
        result[0][0] = right.X; result[0][1] = right.Y; result[0][2] = right.Z;
        result[1][0] = projectedUp.X; result[1][1] = projectedUp.Y; result[1][2] = projectedUp.Z;
        result[2][0] = forward.X; result[2][1] = forward.Y; result[2][2] = forward.Z;
        result[3][0] = position.X; result[3][1] = position.Y; result[3][2] = position.Z; result[3][3] = 1;

        return result;
    }

    static LookAt (position: vector, target: vector, up: vector): TransformMatrix {
        return Transform.Invert(Transform.PointAt(position, target, up));
    }

    static Invert(matrix: TransformMatrix): TransformMatrix {
        const result = newTransform();
        
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) result[i][j] = matrix[j][i];
        }
        for (let i = 0; i < 3; i++) {
            result[3][i] = -(matrix[3][0] * result[0][i] + matrix[3][1] * result[1][i] + matrix[3][2] * result[2][i]);
        }
        result[3][3] = 1;

        return result;
    }

    static RotatePitch(amount: number): TransformMatrix {
        const result = newTransform();
        result[0][0] = 1;
        result[1][1] = COS(amount);
        result[1][2] = SIN(amount);
        result[2][1] = -SIN(amount);
        result[2][2] = COS(amount);
        result[3][3] = 1;

        return result;
    }

    static RotateYaw(amount: number): TransformMatrix {
        const result = newTransform();
        result[0][0] = COS(amount);
        result[0][2] = -SIN(amount);
        result[1][1] = 1;
        result[2][0] = SIN(amount);
        result[2][2] = COS(amount);
        result[3][3] = 1;
        
        return result;
    }

    static RotateRoll(amount: number): TransformMatrix {
        const result = newTransform();
        result[0][0] = COS(amount);
        result[0][1] = SIN(amount);
        result[1][0] = -SIN(amount);
        result[1][1] = COS(amount);
        result[2][2] = 1;
        result[3][3] = 1;
        
        return result;
    }
}