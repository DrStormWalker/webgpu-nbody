export type Vec2f = {
    x: number,
    y: number,
};

export type Colour = {
    r: number,
    g: number,
    b: number,
};

export default class Entity {
    pos: Vec2f;
    vel: Vec2f;
    mass: number;
    colour: Colour;

    constructor(x: number, y: number, velX: number, velY: number, mass: number, colour?: Colour);
    constructor(pos: Vec2f, vel: Vec2f, mass: number, colour?: Colour);
    constructor(
        arg1: number | Vec2f,
        arg2: number | Vec2f,
        arg3: number,
        arg4?: number | Colour,
        arg5?: number,
        arg6?: Colour,
    ) {
        if ((<Vec2f>arg1).x !== undefined) {
            this.pos = arg1 as Vec2f;
            this.vel = arg2 as Vec2f;
            this.mass = arg3;
            this.colour = arg4 as Colour ?? { r: 1, g: 1, b: 1 };
            return;
        }
        this.pos = { x: arg1 as number, y: arg2 as number };
        this.vel = { x: arg3 as number, y: arg4 as number };
        this.mass = arg5 as number;
        this.colour = arg6 ?? { r: 1, g: 1, b: 1 };
    }
    
    static encodeArrays(particles: Entity[]): [Float32Array, Float32Array] {
        let entityResult = [];
        let colourResult = [];

        for (let i = 0; i < particles.length; i++) {
            let p = particles[i];
            entityResult.push(p.pos.x, p.pos.y, p.vel.x, p.vel.y, p.mass, 0.0);
            colourResult.push(p.colour.r, p.colour.g, p.colour.b);
        }

        return [ new Float32Array(entityResult), new Float32Array(colourResult) ];
    }
}

