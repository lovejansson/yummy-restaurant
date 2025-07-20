import ArtObject from "./ArtObject.js";

/** 
* @typedef {import("../Scene.js").default} Scene
*/

export default class StaticImage extends ArtObject {

    /**
     * @param {Scene} scene
     * @param {Symbol} id
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string} image
     */
    constructor(scene, id, pos, width, height, image) {
        super(scene, id, pos, width, height);
        
        this.image = image;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {

        ctx.drawImage(this.scene.art.images.get(this.image), this.pos.x, this.pos.y);
    }
}