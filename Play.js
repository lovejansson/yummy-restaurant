import { Scene, StaticImage } from "./pim-art/index.js";
import { createGrid, drawGrid } from "./path.js";
import Waiter from "./Waiter.js";
import { BASE_URL } from "./config.js";
import  { Table, Chair } from "./Table.js";
import GuestGroup from "./GuestGroup.js";
import { menu } from "./menu.js";

export default class Play extends Scene {

    constructor() {
        super();
        this.orders = [];
        this.tables = [];
        this.idleSpots = [];
        this.guestGroups = [];
        this.menuItems = {};
        this.symbols = {};
    }

    guestGroupLeft(guestGroup) {
        guestGroup.table.isAvailable = true;
        this.guestGroups.remove(guestGroup);
        this.#createGuestGroup({name: "arrive"})
    }

    getGroupFor(guest) {
        return this.guestGroups.find(gg => gg.guests.find(g => g === guest));
    }

    pickTableForGuests(guestGroup) {
        const table = this.tables.filter(t => t.isAvailable).random();
        table.isAvailable = false;
        guestGroup.table = table;
    }

    async init() {

        this.art.images.add("table", `${BASE_URL}images/table.png`);
        this.art.images.add("background", `${BASE_URL}images/background.png`);
        this.art.images.add("waiter-afro-walk", `${BASE_URL}images/waiter-afro-walk.png`);
        this.art.images.add("granny-walk", `${BASE_URL}images/granny-walk.png`);
        this.art.images.add("chair-0", `${BASE_URL}images/chair-n.png`);
        this.art.images.add("chair-1", `${BASE_URL}images/chair-e.png`);
        this.art.images.add("chair-2", `${BASE_URL}images/chair-s.png`);
        this.art.images.add("chair-3", `${BASE_URL}images/chair-w.png`);

        this.art.images.add("idle-sit-0", `${BASE_URL}images/granny-sit-s.png`);
        this.art.images.add("idle-sit-1", `${BASE_URL}images/granny-sit-w.png`);
        this.art.images.add("idle-sit-2", `${BASE_URL}images/granny-sit-n.png`);
        this.art.images.add("idle-sit-3", `${BASE_URL}images/granny-sit-e.png`);

        this.art.images.add("msg-bubble", `${BASE_URL}images/msg-bubble.png`);

        // Symbols

        this.art.images.add("smiley", `${BASE_URL}images/symbols/smiley.png`);
        this.art.images.add("exclamation", `${BASE_URL}images/symbols/exclamation.png`);
        this.art.images.add("question", `${BASE_URL}images/symbols/question.png`);
        this.art.images.add("heart", `${BASE_URL}images/symbols/heart.png`);

        // Drinks

        this.art.images.add("milk", `${BASE_URL}images/menu/milk.png`);
        this.art.images.add("corn-silk-ice-tea", `${BASE_URL}images/menu/corn-silk-ice-tea.png`);
        this.art.images.add("coca-cola-zero", `${BASE_URL}images/menu/coca-cola-zero.png`);
        this.art.images.add("rhubarb-lemonade", `${BASE_URL}images/menu/rhubarb-lemonade.png`);        
        this.art.images.add("water-with-ice", `${BASE_URL}images/menu/water-with-ice.png`);         
        this.art.images.add("coffee-latte", `${BASE_URL}images/menu/latte.png`);
        this.art.images.add("ice-coffee-latte", `${BASE_URL}images/menu/latte.png`);

        // Food

        this.art.images.add("spaghetti-bolognese", `${BASE_URL}images/menu/spaghetti-bolognese.png`);
        this.art.images.add("pizza-pineapple", `${BASE_URL}images/menu/pizza-pineapple.png`); 
        this.art.images.add("tacos", `${BASE_URL}images/menu/tacos.png`);
        this.art.images.add("curry-with-fried-egg", `${BASE_URL}images/menu/curry-with-fried-egg.png`); 
        this.art.images.add("tonkotsu-ramen", `${BASE_URL}images/menu/tonkotsu-ramen.png`); 
        this.art.images.add("poke-bowl", `${BASE_URL}images/menu/poke-bowl.png`);
        this.art.images.add("apple-salad", `${BASE_URL}images/menu/apple-salad.png`);
        this.art.images.add("halloumi-salad", `${BASE_URL}images/menu/halloumi-salad.png`);

        // Dessert

        this.art.images.add("blueberry-pie", `${BASE_URL}images/menu/blueberry-pie.png`);
        this.art.images.add("banana-split", `${BASE_URL}images/menu/banana-split.png`);
        this.art.images.add("frozen-cheesecake-with-fresh-raspberries", `${BASE_URL}images/menu/frozen-cheesecake-with-fresh-raspberries.png`); 
        this.art.images.add("chocolate-ball", `${BASE_URL}images/menu/chocolate-ball.png`); 
        this.art.images.add("white-chocolate-chip-cookie", `${BASE_URL}images/menu/white-chocolate-chip-cookie.png`); 
        this.art.images.add("panna-cotta-with-red-berry-sauce", `${BASE_URL}images/menu/panna-cotta-with-red-berry-sauce.png`); 
        this.art.images.add("strawberry-cake", `${BASE_URL}images/menu/strawberry-cake.png`);
            
        await this.art.images.load();
       
        this.background = new StaticImage(this, Symbol("background"), { x: 0, y: 0 }, 320, 226, "background");

        this.#createSymbols();
        this.#createMenuItems();
        
        this.#createTables();
        this.#createIdleSpots();
        this.#createGrid();

        this.waiter = new Waiter(this, Symbol("waiter"), this.idleSpots.random().pos, 15, 32, "afro");

        this.#initGuests(); 

        this.isInitialized = true;
    }


    update() {
        // For DEBUG
        // if (this.art.keys.up) {
        //      console.log("up")
        // } else if (this.art.keys.down) {
        //     console.log("down")
        // } else if (this.art.keys.left) {
        //     console.log("left")
        // } else if (this.art.keys.right) {
        //     console.log("right")
        // } else if (this.art.keys.space) {
        //     console.log("space")
        // }

        this.waiter.update();
        
        for(const gg of this.guestGroups) {
            gg.update();

            for(const g of gg.guests) {
                g.update();
            }
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

        // ctx.fillStyle = "red";

        // for (let r = 0; r < this.grid.length; ++r) {
        //     for (let c = 0; c < this.grid[0].length; ++c) {
        //         if (this.grid[r][c] === 0) {
        //             ctx.fillRect(c * 16, r * 16, 16, 16);
        //         }
        //     }
        // }

        const guests = this.guestGroups.map(gg => gg.guests).flat();
        const chairs = this.tables.map(t => t.chairs).flat();
        const guestGroupMessageBubbles = this.guestGroups.map(gg => gg.messageBubble);
        const guestMessageBubbles = this.guestGroups.map(gg => gg.guests).flat().map(g => g.messageBubble);
   

        for(const c of chairs) {
            // If the chair is not on the south (2) side of the table
            if(c.tableSide !== 2) {
                c.draw(ctx);
            }
        }

        for(const g of guests) {
            // If guest is not sitting on the south (2) side of the table 
            if(!g.isIdleSitting() || g.tableSide !== 2) {
                g.draw(ctx);
            }
        }

        for (const t of this.tables) {
            t.draw(ctx);
    
            for(const c of t.corners) {
                this.grid[c.y / this.art.tileSize][c.x / this.art.tileSize] = 0; // Set table corners to walkable (0)
            }
            
        }

        for(const g of guests) {
            // If guest is sitting at the south(2) side of the table
            if(g.isIdleSitting() && g.tableSide === 2) {
                g.draw(ctx);
            }
        }
        
        for(const c of chairs) {
            // If chair is on the south (2) side of the table
            if(c.tableSide === 2) {
                c.draw(ctx);
            }
        }

        for(const mb of guestGroupMessageBubbles) {
            if(mb.isShowing) {
                mb.draw(ctx);
            }
        }

        for(const mb of guestMessageBubbles) {
            if(mb.isShowing) {
                mb.draw(ctx);
            }
        }

        /**
         * 
         * för en grupp av gäster och bord stol ->
         * 
         * Render 1 stol 0, 1, 3
         * Render 2 gäst 0,  1, 3
         * Render 3 bord 
         * Render 4 gäst 2 -> om gästen är idleSitting och har tableSide s
         * Render 5 stol 2 -> om stolen har tableSide s
         * 
         * 
         * En gäst ska ju vara i idle läget och renderas ut i g.draw 
         * 
         */

        this.waiter.draw(ctx);

        if(this.waiter.messageBubble.isShowing) {
            console.log("Drawing message bubble")
            this.waiter.messageBubble.draw(ctx);
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

        for(const t of this.tables) {
            
            for(const c of t.corners) {
                this.grid[c.y / this.art.tileSize][c.x / this.art.tileSize] = 0; // Set table corners to walkable (0)
            }
        }
        
    }


    #createIdleSpots() {
        for (let c = 8; c < 12; ++c) {
            this.idleSpots.push({ pos: {x: c * 16, y: 2 * 16}, isAvailable: true });
        }
    }

    #createSymbols() {
        for(const s of ["heart", "exclamation", "question", "smiley"]) {
            this.symbols[s] = new StaticImage(this, Symbol("symbol"), 
                {x: 0, y: 0}, this.art.images.get(s).width, this.art.images.get(s).height, s);
        }
           console.log(this.symbols)
    }

    #createMenuItems() {
        for(const items of Object.values(menu)) {
            for(const i of items) {
                this.menuItems[i.image] = 
                new StaticImage(this, Symbol("menu-item"), 
                {x: 0, y: 0}, 
                this.art.images.get(i.image).width, this.art.images.get(i.image).height, i.image);
            }
        }
    }

    #createTables() {

        const tileSize = 16;

        const tablePositions = [ 
            { x: 2 * tileSize, y: 4 * tileSize },  
            { x: 2 * tileSize, y: 10 * tileSize }, 
            { x: 15 * tileSize, y: 4 * tileSize }, 
            { x: 9 * tileSize, y: 7 * tileSize },
            { x: 15 * tileSize, y: 10 * tileSize } ];

        
        const chairPositionDiffs = [{x: tileSize / 2, y: -tileSize * 1.25
        }, 
            {x: tileSize * 2 - 3, y: -tileSize / 2}, 
            {x: tileSize / 2, y: tileSize - 4 }, 
            {x: -tileSize + 2, y: -tileSize / 2}];

        for (const tp of tablePositions) {

            const chairs = [];
       
            for(let i = 0; i < chairPositionDiffs.length; ++i) {
                const cp = chairPositionDiffs[i];
                const pos = {x: tp.x + cp.x, y: tp.y + cp.y};
                chairs.push(new Chair(this, {...pos}, 17, 32, `chair-${i}`, i));
                // this.guests.push(new Guest(this, Symbol("guest"), {...pos}, 17, 32, i));
            }

            this.tables.push(new Table(this, tp, chairs));
        }

        // for(const g of this.guests) {
        //     g.actionState = new IdleSitting();
        // }
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