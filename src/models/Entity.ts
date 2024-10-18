import { Engine } from "../Engine.js";
import { rotation, Rotation } from "../types/Rotation.js";
import { mesh } from "../types/Types.js";
import { vector, Vector } from "../types/Vector.js";

export abstract class Entity {
    protected needsUpdate: boolean = true;

    private __id: number;
    public get id() {
        return this.__id;
    }

    private __Location: Vector = new Vector(0, 0, 0);
    get Location() { return this.__Location; }
    set Location(v) {
        if (!Vector.Equal(v, this.__Location)) {
            this.__Location = v;
            this.needsUpdate = true;
        }
    }

    private __Rotation: Rotation = new Rotation();
    get Rotation() { return this.__Rotation; }
    set Rotation(v) {
        if (!Rotation.Equal(v, this.__Rotation)) {
            this.__Rotation = v;
            this.needsUpdate = true;
        }
    }

    Mesh: mesh|undefined;

    constructor() {
        this.__id = Engine.GetNextEntityId();
    }
    
    abstract Update(deltaTime: number): void;
    abstract Draw(): void;
}