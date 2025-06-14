import { Screen, StaticImage } from "./lib/index.js";


export default class Pause extends Screen {
    constructor() {
        super();
        this.art = null; // Will be set by the Art class
    }

    update() {
    }

    draw(ctx) {
        ctx.clearRect(0, 0, this.art.config.width, this.art.config.height);

        const background = new StaticImage(this, {x: 0, y: 0}, 320, 226, "static");
        background.draw(ctx);
    }
    
}