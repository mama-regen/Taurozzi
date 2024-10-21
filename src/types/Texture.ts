import { Obj } from "./Types.js";

const Textures: Obj<ImageData> = {};

export class Texture {
    static GetPixel(texture: string, u: number, v: number): [number, number, number, number] {
        const U = Textures[texture].width - (u * Textures[texture].width)|0;
        const V = (v * Textures[texture].height)|0;
        const idx = (V * Textures[texture].width + U) * 4;
        const d = Textures[texture].data;
        return [d[idx], d[idx+1], d[idx+2], d[idx+3]];
    }

    static async Create(texture: string): Promise<boolean> {
        try {
            if (!Textures[texture]) {
                await fetch(`/images/${texture}.png`)
                    .then((data) => data.blob())
                    .then((blob) => createImageBitmap(blob))
                    .then((image) => {
                        const canvas = document.createElement('canvas');
                        canvas.width = image.width;
                        canvas.height = image.height;
                        
                        const context = canvas.getContext('2d')!;
                        context.rect(0, 0, image.width, image.height);
                        context.drawImage(image, 0, 0);
                        Textures[texture] = context.getImageData(0, 0, image.width, image.height);
                    });
            }
        } catch(_) { return false; }
        return !!Textures[texture];
    }
}