import { createPathAStar } from "./path.js";



// Get direction diff for x and why and use that as index to get label for direction. directionLables[y + 1][x + 1]
const directionLables = 
[
    ["nw", "n", "new"],
    ["w", "curr", "e"],
    ["sw", "s", "se"]
]

/**
 * A path that a sprite can walk on. Handles creation of path on the grid and updating of position (x,y).
 * You need to create a new instance whenever a sprite should walk on a path.
 * Supports 8 directional walks.  
 */
export class WalkPath extends EventTarget {

    hasReachedGoal;

    #currPos;
    #currPixelDiff;
    #path;
    #currCellIdx;

    constructor(sprite, start, end){
        super();

        this.sprite = sprite;
        this.#path = createPathAStar({row: start.y / 16, col: start.x / 16}, {row: end.y / 16, col: end.x / 16}, sprite.scene.grid);

         for(const cell of this.#path) {
            this.sprite.scene.grid[cell.row][cell.col] = 4; // Tiles in path is occupied by this sprite walkpath right now
        }

        this.#currPos = {x: start.x, y: start.y};
        this.#currPixelDiff = 0;
        this.#currCellIdx = 0;
    }

    update() {
        // TODO: synka updates med användaren. 
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

    #updateNextCell() {
        this.#currCellIdx++;
        if(this.#currCellIdx === this.#path.length - 1) {
            this.hasReachedGoal = true;
            for(const cell of this.#path) {
                this.sprite.scene.grid[cell.row][cell.col] = 0; // Tile not occupied for sprite anymore
            }
            
        } else {
            this.dispatchEvent(new CustomEvent("next-cell", {detail: {index: this.#currCellIdx}}));
            const diff = this.#calculateXYUpdateDiff();
            const dir = directionLables[diff.y + 1][diff.x + 1];
            this.sprite.direction = dir;
        }
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