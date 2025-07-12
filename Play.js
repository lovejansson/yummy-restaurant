import { Scene, StaticImage } from "./pim-art/index.js";
import { createGrid, drawGrid } from "./path.js";
import Waiter from "./Waiter.js";
import { BASE_URL } from "./config.js";
import Table from "./Table.js";
import GuestGroup from "./GuestGroup.js";


export default class Play extends Scene {

    constructor() {
        super();
        this.orders = [];
        this.tables = [];
        this.idleSpots = [];
        this.guestGroups = [];
    }

    guestGroupLeft(guestGroup) {
        guestGroup.table.isAvailable = true;
        this.guestGroups.remove(guestGroup);
        this.#createGuestGroup({name: "arrive"})

    }

    getGroupFor(guest) {
        return this.guestGroups.find(gg => gg.guests.find(g => g === guest));
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

        this.#initGuests(); 

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
        
        for(const g of this.guestGroups) {
            g.update();
        }
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        this.background.draw(ctx);

        // Draw helper grid?

        ctx.fillStyle = "black";

        const COLS = this.art.width / this.art.tileSize;
        const ROWS = this.art.height / this.art.tileSize;

        drawGrid(ctx, ROWS, COLS, this.art.tileSize, 0, 32);

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
    
            for(const c of t.corners) {
                this.grid[c.y / this.art.tileSize][c.x / this.art.tileSize] = 0; // Set table corners to walkable (0)
            }
            
        }

        for(const gg of this.guestGroups) {
            gg.draw(ctx);
        }

        this.waiter.draw(ctx);
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
            
            for(const c of t.corners) {
                this.grid[c.y / this.art.tileSize][c.x / this.art.tileSize] = 0; // Set table corners to walkable (0)
            }
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

    #initGuests() {
        this.#createGuestGroup( {name: "arrive"});
        // this.#createGuestGroup( {name: "eat-drink", type: "food" });
        // this.#createGuestGroup( {name: "eat-drink", type: "dessert" });
        // this.#createGuestGroup( {name: "order", type: "food"});
        // this.#createGuestGroup( {name: "order", type: "dessert"});
        // this.#createGuestGroup( {name: "receive-order", type: "food"});
    }

    #createGuestGroup(initialState) {
        const guestGroup = new GuestGroup(this, initialState);
        guestGroup.init();
        this.guestGroups.push(guestGroup);
    }

}