import { StaticImage } from "./gameObjects.js";

export default class Table extends StaticImage {

    /**
     * Creates a new Table.
     * @param {{ x: number, y: number }} pos - The position of the game object.
     * @param {number} width - The width of the game object.
     * @param {number} height - The height of the game object.
     */
    constructor(pos, width, height) {
        super(pos, width, height);
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.fillStyle ="white"
        ctx.fillRect(this.pos.x, this.pos.y, this.width, this.height);
    }
   
}
