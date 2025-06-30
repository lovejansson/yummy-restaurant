import { Scene, StaticImage } from "./pim-art/index.js";
import { createGrid, drawGrid, createPathAStar } from "./path.js";
import Waiter from "./Waiter.js";
import { BASE_URL } from "./config.js";
import Table from "./Table.js";

export default class Play extends Scene {

    constructor() {
        super();
        this.waiter = new Waiter("waiter1", { x: 0, y: 2 * 16 }, 16, 16);
        this.tables = [];
        this.idleSpots = [];
    }

    async init() {
        this.art.images.add("table", `${BASE_URL}images/table.png`);
        this.art.images.add("background", `${BASE_URL}images/background.png`);
        
        await this.art.images.load();
       
        this.background = new StaticImage(this, Symbol("background"), { x: 0, y: 0 }, 320, 226, "background");
        
        this.#createGrid();
        this.#createTables();
        this.#createIdleSpots();

        this.isInitialized = true;
    }

    update() {
        // this.waiter.update();

    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        this.background.draw(ctx);

        // Draw helper grid?

        ctx.fillStyle = "black";

        const COLS = this.art.width / 16;
        const ROWS = this.art.height / 16;

        drawGrid(ctx, ROWS, COLS, 16, 0, 32);

        ctx.fillStyle = "red";

        for (let r = 0; r < this.grid.length; ++r) {
            for (let c = 0; c < this.grid[0].length; ++c) {
                if (this.grid[r][c] === 0) {
                    ctx.fillRect(c * 16, r * 16, 16, 16);
                }
            }
        }

        for (const t of this.tables) {
            t.draw(ctx);
        }

        const path = createPathAStar({row: 2, col: 10,}, {row: 8, col: 15},this.grid);

        ctx.fillStyle = "blue"
        for(const cell of path) {
            ctx.fillRect(cell.col * 16, cell.row * 16, 16, 16);
        }

    }

    #createGrid() {

        this.grid = createGrid(this.art.height / 16, this.art.width / 16, 1);

        // Create walkable tiles (0) in grid

        for (let c = 0; c < 21; ++c) {
            this.grid[2][c] = 0;
            this.grid[13][c] = 0;
        }

        for (let r = 3; r < 6; ++r) {
            for (const c of [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 18, 19, 20]) {
                this.grid[r][c] = 0;
            }
        }

        for (const c of [0, 5, 6, 7, 12, 13, 18, 19, 20]) {
            this.grid[6][c] = 0;
            this.grid[9][c] = 0;
        }

        for (let r = 7; r < 9; ++r) {

            for (let c = 0; c < 8; ++c) {
                this.grid[r][c] = 0;
            }

            for (let c = 12; c < 21; ++c) {
                this.grid[r][c] = 0;
            }
        }


        for (let r = 10; r < 13; ++r) {
            for (const c of [0, 5, 6, 7, 8, 9, 10, 11, 12, 13, 18, 19, 20]) {
                this.grid[r][c] = 0;
            }
        }
    }

    #createIdleSpots() {
        for (let c = 0; c < 3; ++c) {
            this.idleSpots.push({ x: c * 32, y: 2 * 32, isAvailable: true });
        }
    }

    #createTables() {

        const tileSize = 16;

        this.tables.push(new Table(this, { x: 2 * tileSize, y: 4 * tileSize } ));
        this.tables.push(new Table(this, { x: 2 * tileSize, y: 10 * tileSize }));
        this.tables.push(new Table(this, { x: 15 * tileSize, y: 4 * tileSize } ));
        this.tables.push(new Table(this, { x: 9 * tileSize, y: 7 * tileSize } ));
        this.tables.push(new Table(this, { x: 15 * tileSize, y: 10 * tileSize }));
    }

}