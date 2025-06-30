import { Scene, StaticImage } from "./pim-art/index.js";
import { BASE_URL } from "./config.js";

export default class Pause extends Scene {
    constructor() {
        super();
    }

    async init() {
        this.art.images.add("thumbnail", `${BASE_URL}images/background.png`);
        await this.art.images.load();
        this.image = new StaticImage(this, Symbol("pause-image"), {x: 0, y: 0}, 320, 226, "thumbnail");
        this.isInitialized = true;
    }

    draw(ctx) {
        this.image.draw(ctx);
    }
    
}