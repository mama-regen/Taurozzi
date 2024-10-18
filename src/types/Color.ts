export type color = {R: number, B: number, G: number, A: number};

export class Color implements color {
    private data = new Uint8Array(4);

    get R() { return this.data[0]; }
    set R(v) { this.data[0] = v; }

    get G() { return this.data[1]; }
    set G(v) { this.data[1] = v; }

    get B() { return this.data[2]; }
    set B(v) { this.data[2] = v; }

    get A() { return this.data[3] / 255; }
    set A(v) { this.data[3] = (v * 255)|0; }

    constructor(r: number, g: number, b: number, a: number = 1) {
        this.data[0] = r;
        this.data[1] = g;
        this.data[2] = b;
        this.data[3] = (a * 255)|0;
    }

    ApplyLight = (light: number) => new Color(this.R * light, this.G * light, this.B * light, this.A);

    ToString = (hex: boolean = false) => {
        if (hex) return `#${this.data.reduce((r,v) => r + `00${v.toString(16)}`.slice(-2), '')}`
        return `rgba(${this.R}, ${this.G}, ${this.B}, ${this.A})`;
    }

    ToArray = () => this.data;

    static White = new Color(255, 255, 255);
    static Red = new Color(255, 0, 0);
    static Green = new Color(0, 255, 0);
    static Blue = new Color(0, 0, 255);
    static Cyan = new Color(0, 255, 255);
    static Magenta = new Color(255, 0, 255);
    static Yellow = new Color(255, 255, 0);
    static Black = new Color(0, 0, 0);
    static Transparent = new Color(0, 0, 0, 0);

    static get Random() {
        const n = () => (Math.random() * 255)|0;
        return {R: n(), G: n(), B: n(), A: 1};
    }

    static FromHex = (hex: string) => {
        hex = hex.replace(/[^a-fA-F0-9]/, '')
        if (hex.length < 6) hex = Array.from(hex).reduce((r, v) => r + v + v, '');
        const num: number = Number(`0x${hex.substring(0, 6)}`);
        return {
            R: (num >> 16) & 255, 
            G: (num >> 8) & 255, 
            B: num & 255, 
            A: Math.round(((hex.length == 8 ? Number(`0x${hex.slice(-2)}`) : 255) / 255) * 100) / 100 
        };
    }
}