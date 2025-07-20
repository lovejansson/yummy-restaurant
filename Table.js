import { StaticImage } from "./pim-art/index.js";

export class Table extends StaticImage {

    /**
     * @type {{x: number, y: number}[]}
     */
    corners;

    /**
     * @type {Chair[]}
     */
    chairs;

    /**
     * @param {Scene} scene
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string} image
     */
    constructor(scene, pos, chairs) {
        super(scene, Symbol("table"), pos, 32, 32, "table");

        this.isAvailable = true;

        this.chairs = chairs;

        this.corners = [{ x: pos.x - scene.art.tileSize * 2, y: pos.y - scene.art.tileSize * 2},
                        { x: pos.x + scene.art.tileSize * 3, y: pos.y - scene.art.tileSize * 2 },
                        { x: pos.x + scene.art.tileSize * 3, y: pos.y + scene.art.tileSize * 3 },
                        { x: pos.x - scene.art.tileSize * 2, y: pos.y + scene.art.tileSize * 3 }];

        this.centerPos = {x: this.pos.x + this.width / 2, y: this.pos.y + this.height / 2};
    }
}


export class Chair extends StaticImage {
    /**
     * @param {Scene} scene
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string} image
     * @param {number} tableSide
     */
    constructor(scene, pos, width, height, image, tableSide) {

        super(scene, Symbol("chair"), pos, width, height, image);

        this.tableSide = tableSide;
    }
}
