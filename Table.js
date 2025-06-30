import { StaticImage } from "./pim-art/index.js";

export default class Table extends StaticImage {

    /**
     * @param {Scene} scene
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string} image
     */
    constructor(scene, pos,) {
        super(scene, Symbol("table"), pos, 32, 32, "table");
        this.isAvailable = true;
    }



}