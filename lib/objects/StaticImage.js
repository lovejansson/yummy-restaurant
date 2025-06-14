import ArtObject from "./ArtObject.js";

/** 
* @typedef {import("../Screen.js").default} Screen
*/

/**
 * @description Just an image getting drawn on the screen.
 */
export default class StaticImage extends ArtObject {

    /**
     * @param {Screen} screen
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string} image
     */
    constructor(screen, pos, width, height, image) {
        super(screen, pos, width, height);
        this.image = image;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.drawImage(this.screen.art.images.get(this.image), this.pos.x, this.pos.y, this.width, this.height);
    }

}