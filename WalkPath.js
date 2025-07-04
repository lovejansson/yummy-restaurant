import { createPathAStar } from "./path.js";


/**
 * A path that a sprite can walk on. Handles creation of path on the grid and updating of position (x,y).
 * You need to create a new instance whenever a sprite should walk on a path. 
 */
export class WalkPath extends EventTarget {

    hasReachedGoal;

    #currPos;
    #currPixelDiff;
    #path;
    #currCellIdx;

    constructor(sprite, start, end){
        super();

        this.#path = createPathAStar(start, end, sprite.scene.grid);

         for(const cell of this.#path) {
            this.sprite.scene.grid[cell.row][cell.col] = 4; // Tiles in path is occupied by this sprite walkpath right now
        }

        this.#currPos = {x: start.col * 16, y: start.row * 16};
        this.#currPixelDiff = 0;
        this.#currCellIdx = 0;
    }

    update() {
        this.#updatePosition();

        if (this.#currPixelDiff === 16) {
            this.dispatchEvent(new CustomEvent("next-cell", {detail: {index: this.#currCellIdx}}));
            this.#updateNextCell();
            this.#currPixelDiff = 0;
        } 
    }


    getPositionXY() {
        return this.#currPos;
    }


    #updateNextCell() {
        this.#currCellIdx++;
        if(this.#currCellIdx === this.#path.length - 1) {
            this.hasReachedGoal = true;
            for(const cell of this.#path) {
                this.sprite.scene.grid[cell.row][cell.col] = 0; // Tile not occupied for sprite anymore
            }
        }
    }

    
    #getCurrDir() {
        const currCell = this.#path[this.#currCellIdx];

        if (this.#currCellIdx === this.#path.length - 1) {
            const prev = this.#path[this.#currCellIdx - 1];
            return this.#getDirection(prev, currCell);
        } else {
            const next = this.#path[this.#currCellIdx + 1];
            return this.#getDirection(currCell, next);
        } 
    }


    #updatePosition() {

        const currDir = this.#getCurrDir();

        switch (currDir) {
            case "north":
                this.#currPos = { x: this.#currPos.x, y: this.#currPos.y - 1 };
                break;
            case "east":
                this.#currPos = { x: this.#currPos.x + 1, y: this.#currPos.y };
                break;
            case "south":
                this.#currPos = { x: this.#currPos.x, y: this.#currPos.y + 1 };
                break;
            case "west":
                this.#currPos = { x: this.#currPos.x - 1, y: this.#currPos.y };
                break;
        }

        this.#currPixelDiff++;
    }


    #getDirection(from, to) {

        const rowDiff = to.row - from.row;
        const colDiff = to.col - from.col;

        if (rowDiff === 0) {
            if (colDiff > 0) {
                return "east";
            }
    
            return "west";
        }

        if (rowDiff > 0) {
            return "south";
        }
        
        return "north";
    }
}