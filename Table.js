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
     * @param {Chair[]} chairs
     */
    constructor(scene, pos, chairs) {
        super(scene, Symbol("table"), pos, 32, 32, "table");

        this.centerPos = {x: this.pos.x + this.halfWidth, y: this.pos.y + this.halfHeight};
        this.isAvailable = true;
        this.chairs = chairs;
        this.corners = [{ x: pos.x - scene.art.tileSize , y: pos.y - this.scene.art.tileSize},
                        { x: pos.x + scene.art.tileSize * 2, y: pos.y - this.scene.art.tileSize },
                        { x: pos.x + scene.art.tileSize * 2, y: pos.y + this.halfHeight}, 
                        { x: pos.x - scene.art.tileSize, y: pos.y +this.halfHeight }];             

        this.chairDirections = ["s", "w", "n", "e"]; // Get dir based on chair index i.e. tableSide
      
    }

    getWaiterWelcomeCorner() {
        return{direction: "sw", pos: {x: this.corners[1].x + this.scene.art.tileSize, y: this.corners[1].y}}
    }

    /**
     * Get closest corner to current waiter position.
     * @param {Waiter} waiter
     * @returns {{direction: "se" | "sw" | "nw" | "ne", pos: {x: number,y: number}}}
     */
    getWaiterCorner(waiter) {

        let minDist = 1000000;
        let currDist = 0;
        let cornerIdx = 1;

        for(const [i, c] of Object.entries(this.corners)) {
            
            currDist = Math.sqrt(Math.pow(waiter.pos.x - c.x, 2), Math.pow(waiter.pos.y - c.y, 2));
            minDist = Math.min(currDist, minDist);

            if(currDist < minDist) {
                minDist = currDist;
                cornerIdx = i;
            }
        }
       
        return {direction: ["se", "sw", "nw", "ne"][cornerIdx], pos: {x: this.corners[cornerIdx].x, y: this.corners[cornerIdx].y}}
    }

     /**
     * Get position for a menu item on the table
     * @param {"food" | "dessert" | "drink"} type
     * @param {import("./menu.js").MenuItem} menuItem
     * @param { 0 | 1 | 2 | 3 } tableSide
     * @returns {{x: number, y: number}} pos 
     */
    getMenuItemTablePos(type, menuItem, tableSide) {

        switch(type) {
            case "food":
            case "dessert":
                switch(tableSide) {
                    case 0:
                        return {x: this.pos.x + this.scene.art.tileSize - Math.floor(menuItem.width / 2), y: this.pos.y + 1};
                    case 1:
                        return {x: this.pos.x + this.width - menuItem.width - 4, y: this.pos.y + (this.height / 2) - menuItem.height};
                    case 2:
                        return {x:  this.pos.x + this.scene.art.tileSize - Math.floor(menuItem.width / 2), y: this.pos.y + this.scene.art.tileSize - 2};
                    case 3:
                        return {x: this.pos.x + 4,  y: this.pos.y + (this.height / 2) - menuItem.height - 1};
                }
            case "drink":
                switch(tableSide) {
                    case 0:
                        return {x: this.pos.x + 9, y: this.pos.y + 2};
                    case 1:
                        return {x: this.pos.x + 20, y: this.pos.y + 13};
                    case 2:
                        return {x: this.pos.x + 20, y: this.pos.y + 13};
                    case 3:
                        return {x: this.pos.x + 8, y: this.pos.y + 12};
                }
        }
        
    }

    getChairPos(tableSide) {
        const chairPos = this.chairs[tableSide].pos;
        return {...chairPos, y: tableSide === 2 ? chairPos.y - 1 : chairPos.y + 1}
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
