import { Scene, StaticImage } from "./pim-art/index.js";
import { BASE_URL } from "./config.js";

export default class Pause extends Scene {
    constructor() {
        super();
    }

    async init() {
        this.art.images.add("pause", `${BASE_URL}images/pause.png`);
        await this.art.images.load();
        this.image = new StaticImage(this, Symbol("pause-image"), {x: 0, y: 0}, this.art.width, this.art.height, "pause");
        this.isInitialized = true;
    }

    draw(ctx) {
        this.image.draw(ctx);
    }
    
}