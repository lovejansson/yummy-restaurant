import { Scene, StaticImage } from "./pim-art/index.js";
import { createGrid, drawGrid, createPathAStar } from "./path.js";
import Waiter from "./Waiter.js";
import { BASE_URL } from "./config.js";
import Table from "./Table.js";
import Guest from "./Guest.js";

export default class Play extends Scene {

    constructor() {
        super();
        this.tables = [];
        this.idleSpots = [];
    }


    async init() {

        this.art.images.add("table", `${BASE_URL}images/table.png`);
        this.art.images.add("background", `${BASE_URL}images/background.png`);
        this.art.images.add("waiter-afro-walk", `${BASE_URL}images/waiter-afro-walk.png`);
        this.art.images.add("granny-walk", `${BASE_URL}images/granny-walk.png`);
        
        await this.art.images.load();
       
        this.background = new StaticImage(this, Symbol("background"), { x: 0, y: 0 }, 320, 226, "background");
        
        this.#createTables();
        this.#createIdleSpots();
        this.#createGrid();

        this.waiter = new Waiter(this, Symbol("waiter"),this.idleSpots.random(), 15, 32, "afro");

        this.guest = new Guest(this, Symbol("guest"), { x: 0, y: 16 * 7}, 15, 32, "left");

        this.isInitialized = true;
    }


    update() {
        if (this.art.keys.up) {
             console.log("up")
        } else if (this.art.keys.down) {
            console.log("down")
        } else if (this.art.keys.left) {
            console.log("left")
        } else if (this.art.keys.right) {
            console.log("right")
        } else if (this.art.keys.space) {
            console.log("space")
        }

        this.waiter.update();
        this.guest.update();
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

        for (let i = 0; i < this.tables.length; ++i) {
            const table = this.tables[i];
    
            const corner = {row: table.pos.y / 16 + 2, col: table.pos.x / 16 - 1};
            const path = createPathAStar({row: 2, col: 9,}, corner, this.grid);
            ctx.fillStyle = table.color ? table.color : ["blue", "green", "yellow", "pink"].random();
            table.color = ctx.fillStyle;
            for(const cell of path) {

                ctx.fillRect(cell.col * 16, cell.row * 16, 16, 16);
            }

        }

        this.waiter.draw(ctx);
        this.guest.draw(ctx)
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

        for(const t of this.tables) {
            const corner = {row: t.pos.y / 16 + 2, col: t.pos.x / 16 - 1};
            this.grid[corner.row][corner.col] = 0;
        }
        
    }

    #createIdleSpots() {
        for (let c = 8; c < 12; ++c) {
            this.idleSpots.push({ x: c * 16, y: 2 * 16, isAvailable: true });
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