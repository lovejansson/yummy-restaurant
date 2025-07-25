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

    hasReachedGoal;

    #currPos;
    #currPixelDiff;
    #path;
    #currCellIdx;

    constructor(sprite, goalPos, walkableTileValues = [0]) {
        this.sprite = sprite;
        this.#path = createPathAStar(sprite.getGridPos(), {row: Math.floor(goalPos.y / 16), col: Math.floor(goalPos.x / 16)}, sprite.scene.grid, walkableTileValues);

        this.#currPos = this.sprite.pos;
        this.#currPixelDiff = 0;
        this.#currCellIdx = 0;
        
        const diff = this.#calculateXYUpdateDiff();
        this.sprite.direction = directionLables[diff.y + 1][diff.x + 1];
    
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

    getCellCount(){
        return this.#currCellIdx; 
    }

    #updateNextCell() {
        this.#currCellIdx++;
        if(this.#currCellIdx === this.#path.length - 1) {
            this.hasReachedGoal = true;
            
        } else {
            const diff = this.#calculateXYUpdateDiff();
            this.sprite.direction = directionLables[diff.y + 1][diff.x + 1];
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