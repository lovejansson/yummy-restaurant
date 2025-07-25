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
     * @param {number} walkableTilesID
     * @param {Chair[]} chairs
     */
    constructor(scene, pos, chairs) {
        super(scene, Symbol("table"), pos, 32, 32, "table");

        this.isAvailable = true;
        this.chairs = chairs;

        this.corners = [{ x: pos.x - scene.art.tileSize, y: pos.y - scene.art.tileSize * 2},
                        { x: pos.x + scene.art.tileSize * 2, y: pos.y - scene.art.tileSize * 2 },
                        { x: pos.x + scene.art.tileSize * 2, y: pos.y + scene.art.tileSize},
                        { x: pos.x - scene.art.tileSize, y: pos.y + scene.art.tileSize }];
        this.cornerDirections = ["se", "sw", "nw", "ne"];
        this.chairDirections = ["s", "w", "n", "e"];

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
     * @param {number} walkableTilesID
     */
    constructor(scene, pos, width, height, image, tableSide, walkableTilesID) {
        super(scene, Symbol("chair"), pos, width, height, image);

        this.tableSide = tableSide;
        this.walkableTilesID = walkableTilesID;

        switch(this.tableSide) {
            case 0:
                this.frontPos = {x: this.pos.x + this.halfWidth, y: this.pos.y + this.height};
                break;
            case 1:
                this.frontPos = {x: this.pos.x, y: this.pos.y};
                break;
            case 2:
                this.frontPos = {x: this.pos.x + this.halfWidth, y: this.pos.y};
                break;
            case 3:
                this.frontPos = {x: this.pos.x + this.halfWidth, y: this.pos.y};
                break;

        }
    }
}
