import { SETTINGS } from "./index.js";
import { Display } from "./models/Display.js";
import { Entity } from "./models/Entity.js";
import { ObjectSet } from "./types/ObjectSet.js";
import { Player } from "./Entities/Player.js";
import { Level } from "./models/Level.js";

export const Engine = new class __Engine {
    private Fps: number = 0;
    private LastUpdate: number = 0;

    AddEntity = (e: Entity) => this.active.add(e);
    GetNextEntityId = () => this.active.next;

    private active: ObjectSet<Entity> = new ObjectSet<Entity>();

    private __Player: Player|undefined;
    get Player() { return this.__Player!; }

    private __CursorLocked: boolean = false;
    get CursorLocked() { return this.__CursorLocked; }

    private __Level: Level|undefined;
    get Level() { return this.__Level!; }

    async Start() {
        this.Fps = SETTINGS.FPS / 1000;
        this.LastUpdate = Date.now();
        this.__Player = new Player();
        Display.Init();
        Display.Clear();

        await Display.DrawSplash();
        Display.DrawText("Loading");

        const clickStart = (() => {
            document.removeEventListener('click', clickStart);
            document.addEventListener('pointerlockchange', this.CursorLockListener.bind(this));
            document.body.requestPointerLock();

            this.AddEntity(this.Player);

            this.UpdateLoop();
        });

        Level.Load("0").then((level) => {
            this.__Level = level;
            Display.Clear();
            return Display.DrawSplash();
        }).then(() => {
            Display.DrawText("Click To Start");
            document.addEventListener('click', clickStart);
        });
    }

    Exit() {
        this.active.forEach((e: Entity) => {
            if (e.hasOwnProperty('Exit')) (e as Entity & {Exit: () => any}).Exit();
        });
        document.exitPointerLock();
        document.removeEventListener('pointerlockchange', this.CursorLockListener.bind(this));
    }

    UpdateLoop() {
        requestAnimationFrame(this.UpdateLoop.bind(this));

        const now = Date.now();
        const elapsed = now - this.LastUpdate;
        if (elapsed < this.Fps) return;

        this.LastUpdate = now - (elapsed % this.Fps);

        if (!this.CursorLocked) {
            Display.DrawText("Paused");
            return;
        }

        Display.Clear();
        this.active.forEach((e) => {
            if (!e || !e.Update) return;
            e.Update(Math.min(1, elapsed * 1000));
            e.Draw();
        });
    }

    private CursorLockListener() {
        this.__CursorLocked = !!document.pointerLockElement;
        if (!this.CursorLocked) {
            const reLock = () => {
                document.body.requestPointerLock();
                document.removeEventListener('click', reLock);
            }
            document.addEventListener('click', reLock);
        }
    }
}();