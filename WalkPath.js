import { createPathAStar } from "./path.js";

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

        console.debug(WalkPath.LOGGER_TAG, "constructor", this.sprite.id);
         this.#goalCell = {row: Math.floor(goalPos.y / 16), col: Math.floor(goalPos.x / 16)};
            this.#path = createPathAStar(
            { col: Math.floor(this.sprite.pos.x / this.sprite.scene.art.tileSize), row: Math.floor(this.sprite.pos.y / this.sprite.scene.art.tileSize)}, 
            this.#goalCell, 
            this.sprite.scene.grid, [0, this.sprite.id]);
    
        this.sprite.scene.grid[this.#goalCell.row][this.#goalCell.col] = this.sprite.id;

        this.#currPos = this.sprite.pos;
        this.#currPixelDiff = 0;
        this.#currCellIdx = 0;
        this.hasReachedGoal = false;
        this.cellCount = 0;

        const diff = this.#calculateXYUpdateDiff();
        this.sprite.direction = directionLables[diff.y + 1][diff.x + 1];

    }

    update() {

        if(!this.hasReachedGoal) {
         
            this.#updatePosition();

            if (this.#currPixelDiff === 16) {
                this.#updateNextCell();
                this.#currPixelDiff = 0;
            } 
        } 
    }

    getPos() {
        return this.#currPos;
    }

    #verifyNextCell() {
        const cell = this.#path[this.#currCellIdx];
        
        if(this.#currCellIdx === this.#path.length - 1) {
            this.hasReachedGoal = true;
            this.sprite.scene.grid[this.#goalCell.row][this.#goalCell.col] = 0;
        } else if (![0, this.sprite.id].includes(this.sprite.scene.grid[cell.row][cell.col])){
            // Someone is occupying next cell so we create a new path from current cell to the end!
            console.debug(WalkPath.LOGGER_TAG, "Recreacting path bc. of occupied cell");
 
            this.#path = createPathAStar(cell, this.#goalCell, this.sprite.scene.grid, [0, this.sprite.id]);
            this.#currCellIdx = 0;
        } 

        const diff = this.#calculateXYUpdateDiff();
        this.sprite.direction = directionLables[diff.y + 1][diff.x + 1];
    }

    #updateNextCell() {
        this.#currCellIdx++;
        this.cellCount++;
        this.#verifyNextCell();
    }

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
    }

}