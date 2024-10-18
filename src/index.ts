import { Engine } from "./Engine.js";
import { Obj } from "./types/Types.js";

export let SETTINGS = {} as Obj;

document.addEventListener("DOMContentLoaded", () => fetch('/settings.json')
    .then((settingsJson) => settingsJson.json())
    .then((settings) => Object.assign(SETTINGS, settings))
    .then(() => Engine.Start())
);