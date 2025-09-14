import { createPathAStar, getNeighbours } from "./path.js";
import { debug } from "./index.js";

// Get direction diff for x and why and use that as index to get label for direction. directionLables[y + 1][x + 1]
const directionLables = 
[
    ["nw", "n", "ne"],
    ["w", "curr", "e"],
    ["sw", "s", "se"]
]

/**
 * A path that a sprite can walk on. Handles creation of path on the grid and updating of position (x,y).
 * You need to create a new instance whenever a sprite should walk on a path.
 * Supports 8 directional walks.  
 */
export class WalkPath {

    static LOGGER_TAG = "WalkPath"

     /**
     * @type {boolean}
     */
    hasReachedGoal;
    /**
     * @type {number}
     */
    cellCount;

    #currPos;
    #currPixelDiff;
    #path;
    #currCellIdx;
    #goalCell;

    constructor(sprite, goalPos) {

        this.sprite = sprite;

        debug(WalkPath.LOGGER_TAG, "constructor", this.sprite.id);

        this.#goalCell = {row: Math.floor(goalPos.y /  this.sprite.scene.art.tileSize), col: Math.floor(goalPos.x / this.sprite.scene.art.tileSize)};

        this.#path = createPathAStar(
            { col: Math.floor(this.sprite.pos.x / this.sprite.scene.art.tileSize), row: Math.floor(this.sprite.pos.y / this.sprite.scene.art.tileSize)}, 
            this.#goalCell, 
            this.sprite.scene.grid);

        this.#currPos = this.sprite.pos;
        this.#currPixelDiff = 0;
        this.#currCellIdx = 0;
        this.hasReachedGoal = false;
        this.cellCount = 0;

    }

    update() {

        if(!this.hasReachedGoal) {
                                         
            this.#updatePosition();

            if (this.#currPixelDiff === this.sprite.scene.art.tileSize) {
             
                this.#next();
            } 
        } 
    }

    getPos() {
        return this.#currPos;
    }

    #checkReachedGoal() {
        
        if(this.#currCellIdx === this.#path.length - 1) {
            debug(WalkPath.LOGGER_TAG, "Sprite reached the goal cell");
            this.hasReachedGoal = true;
            this.#path = null;
        } 
    }

    /**
     * Advances which cell in the path the sprite's walking on.
     */
    #next() {
        this.#currCellIdx++;
        this.#currPixelDiff = 0;
        this.cellCount++;
        this.#checkReachedGoal();
    }

    /**
     * Calcualtes the xy diff to use when updating the sprite's position by comparing 
     * the placement of the current cell and the next or previous cell. 
     * @returns {{x: number, y: number}} diff 
     */
    #calculateXYUpdateDiff() {
       
        const currCell = this.#path[this.#currCellIdx];

        if (this.#currCellIdx === this.#path.length - 1) {
            const prev = this.#path[this.#currCellIdx - 1];
            return { y: currCell.row - prev.row, x: currCell.col - prev.col};
        } else {
            const next = this.#path[this.#currCellIdx + 1];
            return { x: next.col - currCell.col, y: next.row - currCell.row};
        } 
    }

    #updatePosition() {
        const diff = this.#calculateXYUpdateDiff();
        this.#currPos = { x: this.#currPos.x + diff.x, y: this.#currPos.y + diff.y};
        this.#currPixelDiff++;
        this.sprite.direction = directionLables[diff.y + 1][diff.x + 1];
    } 
}