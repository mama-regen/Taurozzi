import { Engine } from "../Engine.js";
import { Entity } from "../models/Entity.js";
import { Rotation } from "../types/Rotation.js";
import { Vector } from "../types/Vector.js";

export class Player extends Entity {
    private KeyBuffer: number = 0;
    private RotateBuffer: [number, number] = [0, 0];
    private ApplicableKeys: Array<string> = ['w', 'a', 's', 'd', 'shift', 'space'];
    private PI = Math.PI;

    private MoveModifier = 1;
    private __MoveSpeed = 1;
    get MoveSpeed() { return this.__MoveSpeed * this.MoveModifier; }
    set MoveSpeed(v) {
        if (v >= 0 && this.__MoveSpeed != v) {
            this.__MoveSpeed = v;
        }
    }

    private __RotateSpeed = 1;
    get RotateSpeed() { return this.__RotateSpeed; }
    set RotateSpeed(v) {
        if (v >= 0 && this.__RotateSpeed != v) {
            this.__RotateSpeed = v;
        }
    }

    Inverted: boolean = false;

    constructor() { super();
        this.SetupController();
    }

    Update(deltaTime: number): void {
        this.Rotation.Yaw += this.RotateBuffer[0] * 0.001 * this.RotateSpeed * deltaTime;
        this.Rotation.Pitch -= (this.Inverted ? -1 : 1) * this.RotateBuffer[1] * 0.001 * this.RotateSpeed * deltaTime;
        this.RotateBuffer = [0, 0];

        if (this.Rotation.Pitch > this.PI && this.Rotation.Pitch < 5) this.Rotation.Pitch = 5;
        else if (this.Rotation.Pitch < this.PI && this.Rotation.Pitch > 1.3) this.Rotation.Pitch = 1.3;

        const fwd = new Rotation(0, this.Rotation.Yaw, 0);
        const rgt = new Rotation(0, this.Rotation.Yaw - this.PI * 0.5, 0);

        if (this.KeyBuffer & 1) { // W
            this.Location = Vector.Add(this.Location, fwd.Apply(Vector.Out).Normal.Multiply(this.MoveSpeed));
        } else if (this.KeyBuffer & 4) { // S
            this.Location = Vector.Subtract(this.Location, fwd.Apply(Vector.Out).Normal.Multiply(this.MoveSpeed * 0.6));
        }

        if (this.KeyBuffer & 2) { // A
            if (this.KeyBuffer & 8) return;
            this.Location = Vector.Add(this.Location, rgt.Apply(Vector.Out).Normal.Multiply(this.MoveSpeed * 0.75));
        } else if (this.KeyBuffer & 8) { // D
            this.Location = Vector.Subtract(this.Location, rgt.Apply(Vector.Out).Normal.Multiply(this.MoveSpeed * 0.75));
        }

        this.MoveModifier = this.KeyBuffer & 16 ? 2 : 1;

        if (this.KeyBuffer & 32) { // Space
            // Eventually jump
            this.Inverted = !this.Inverted;
        }
    }

    Draw() { }

    Exit() {
        document.removeEventListener('keydown', this.KeyDown);
        document.removeEventListener('keyup', this.KeyUp);
        document.removeEventListener('mousemove', this.MouseMove);
    }

    private KeyDown = (e: KeyboardEvent) => {
        const key = e.key == ' ' ? 'space' : e.key.toLowerCase();
        const idx = this.ApplicableKeys.indexOf(key);
        if (idx < 0) return;
        e.preventDefault();
        this.KeyBuffer |= 1 << idx;
    }

    private KeyUp = (e: KeyboardEvent) => {
        const key = e.key == ' ' ? 'space' : e.key.toLowerCase();
        const idx = this.ApplicableKeys.indexOf(key);
        if (idx < 0) return;
        e.preventDefault();
        this.KeyBuffer &= ~(1 << idx);
    }

    private MouseMove = (e: MouseEvent) => {
        if (!Engine.CursorLocked) return;
        this.RotateBuffer = [e.movementX, e.movementY];
    }

    private SetupController() {
        document.addEventListener('keydown', this.KeyDown);
        document.addEventListener('keyup', this.KeyUp);
        document.addEventListener('mousemove', this.MouseMove);
    }
}