import AnimationManager from "../AnimationManager.js";
import ArtObject from "./ArtObject.js";
import { NotImplementedError } from "../errors.js";

/** 
* @typedef {import("../Scene.js").default} Scene
*/

export default class Sprite extends ArtObject {

     /**
     * @param {Scene} scene
     * @param {Symbol} id
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string | undefined} image 
     */
    constructor(scene, id, pos, width, height, image = undefined) {
        super(scene, id, pos, width, height);
        this.animations = new AnimationManager(this);
        this.image = image;
    }

    /**
     * @param {import("../collision.js").CollisionResult[]} collisions 
     */
    update(collisions) {
        throw new NotImplementedError("Sprite", "update");
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {

        // Draw static image for sprite
        if(this.image) {
            // console.log("DRAWING IMAGE OF ", this.image, this.scene.art.images.get(this.image))
            ctx.drawImage(this.scene.art.images.get(this.image), this.pos.x, this.pos.y);
        } else {
            // Draw animation for sprite
            this.animations.draw(ctx, this.pos);
        }
    }
}

