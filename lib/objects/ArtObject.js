
import { NotImplementedError } from "../errors.js";

/** 
* @typedef {import("../Screen.js").default} Screen
*/

/**
 * @description the art consists of objects that can be drawn on the screen.
 */
export default class ArtObject {
    /**
     * @param {Screen} screen
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     */
    constructor(screen, pos, width, height) {
        this.screen = screen;
        this.pos = pos;
        this.width = width;
        this.height = height;
    }

    update() {
    }

    draw() {
        throw new NotImplementedError("ArtObject", "draw");
    }
}