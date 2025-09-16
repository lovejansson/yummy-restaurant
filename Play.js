import { Scene, StaticImage } from "./pim-art/index.js";
import { createGrid } from "./path.js";
import Waiter from "./Waiter.js";
import { BASE_URL } from "./config.js";
import  { Table, Chair } from "./Table.js";
import GuestGroup from "./GuestGroup.js"; 
import Guest
 from "./Guest.js";
 import JB from "./Jb.js";
 import Dan from "./Dan.js";
 import { debug } from "./index.js";

/**
 * @typedef  {{pos: {x: number, y: number}, isAvailable: boolean}} AvailablePos
 */

export default class Play extends Scene {

    constructor() {
        super();

        /**
         * @type {Table[]}
         */
        this.tables = [];

        /**
         * @type {GuestGroup[]}
         */
        this.guestGroups = [];

        /**
         * @type {Waiter[]}
         */
        this.waiters = [];

    }

    removeGuestGroup(guestGroup) {
        guestGroup.table.isAvailable = true;
        this.guestGroups.remove(guestGroup);
    }

    anyGuestsAreLeaving() {
        return this.guestGroups.some(gg => gg.guests.some(g => g.isLeaving()));
    }
    

    anyGuestsAreArriving() {
        return this.guestGroups.some(gg => gg.guests.some(g => g.isArriving()));
    }

    allWaitersAreWaiting() {
        return this.waiters.every(w => w.isWaiting());
    }
    

    getGroupFor(guest) {
        return this.guestGroups.find(gg => gg.guests.find(g => g === guest) !== undefined);
    }

    createSymbol(image) {
        return new StaticImage(this, Symbol("symbol"), 
                {x: 0, y: 0},9, 7, image);
    }


    /**
     * @param {import("./menu.js").MenuItem} menuItem 
     * @param {{x: number, y: number}} [pos] 
     * @returns {StaticImage} menu item as static image object
     */
    createMenuItemArtObj(menuItem, pos = {x: 0, y: 0}) {
        return new StaticImage(this, Symbol("menu-item"), pos, menuItem.width, menuItem.height, menuItem.image);
    }

    async init() {
        debug("Play init")
        this.art.images.add("jb", `${BASE_URL}images/jb.png`);
        this.art.images.add("dan", `${BASE_URL}images/dan.png`);
        this.art.images.add("table", `${BASE_URL}images/table.png`);
        this.art.images.add("background", `${BASE_URL}images/background.png`);
        this.art.images.add("waiter-afro-walk", `${BASE_URL}images/waiters/waiter-afro-walk.png`);
        this.art.images.add("waiter-afro-walk-serve", `${BASE_URL}images/waiters/waiter-afro-walk-tray.png`);
        this.art.images.add("waiter-ginger-walk", `${BASE_URL}images/waiters/waiter-ginger-walk.png`);
        this.art.images.add("waiter-ginger-walk-serve", `${BASE_URL}images/waiters/waiter-ginger-walk-tray.png`);

        this.art.images.add("chair-0", `${BASE_URL}images/chair-n.png`);
        this.art.images.add("chair-1", `${BASE_URL}images/chair-e.png`);
        this.art.images.add("chair-2", `${BASE_URL}images/chair-s.png`);
        this.art.images.add("chair-3", `${BASE_URL}images/chair-w.png`);


        this.art.images.add("msg-bubble", `${BASE_URL}images/msg-bubble.png`);

        // Guests

        for(const g of Guest.VARIANTS) {
            this.art.images.add(`${g}-walk`, `${BASE_URL}images/guests/${g}/walk.png`);
            this.art.images.add(`${g}-sit`, `${BASE_URL}images/guests/${g}/sit.png`);
            this.art.images.add(`${g}-eat`, `${BASE_URL}images/guests/${g}/eat.png`);
            this.art.images.add(`${g}-drink`, `${BASE_URL}images/guests/${g}/drink.png`);
        }

        // Symbols

        this.art.images.add("smiley", `${BASE_URL}images/symbols/smiley.png`);
        this.art.images.add("exclamation", `${BASE_URL}images/symbols/exclamation.png`);
        this.art.images.add("question", `${BASE_URL}images/symbols/question.png`);
        this.art.images.add("heart", `${BASE_URL}images/symbols/heart.png`);
        this.art.images.add("bill", `${BASE_URL}images/symbols/bill.png`);
        // Drinks

        this.art.images.add("milk", `${BASE_URL}images/menu/drink/milk.png`);
        this.art.images.add("corn-silk-ice-tea", `${BASE_URL}images/menu/drink/corn-silk-ice-tea.png`);
        this.art.images.add("coca-cola-zero", `${BASE_URL}images/menu/drink/coca-cola-zero.png`);
        this.art.images.add("rhubarb-lemonade", `${BASE_URL}images/menu/drink/rhubarb-lemonade.png`);        
        this.art.images.add("water-with-ice", `${BASE_URL}images/menu/drink/water-with-ice.png`);         

        this.art.images.add("milk-a", `${BASE_URL}images/menu/drink/milk-a.png`);
        this.art.images.add("corn-silk-ice-tea-a", `${BASE_URL}images/menu/drink/corn-silk-ice-tea-a.png`);
        this.art.images.add("coca-cola-zero-a", `${BASE_URL}images/menu/drink/coca-cola-zero-a.png`);
        this.art.images.add("rhubarb-lemonade-a", `${BASE_URL}images/menu/drink/rhubarb-lemonade-a.png`);        
        this.art.images.add("water-with-ice-a", `${BASE_URL}images/menu/drink/water-with-ice-a.png`);         

        // Food

        this.art.images.add("spaghetti-bolognese", `${BASE_URL}images/menu/food/spaghetti-bolognese.png`);
        this.art.images.add("pizza-pineapple", `${BASE_URL}images/menu/food/pizza-pineapple.png`); 
        this.art.images.add("tacos", `${BASE_URL}images/menu/food/tacos.png`);
        this.art.images.add("curry-with-fried-egg", `${BASE_URL}images/menu/food/curry-with-fried-egg.png`); 
        this.art.images.add("tonkotsu-ramen", `${BASE_URL}images/menu/food/tonkotsu-ramen.png`); 
        this.art.images.add("poke-bowl", `${BASE_URL}images/menu/food/poke-bowl.png`);
        this.art.images.add("apple-salad", `${BASE_URL}images/menu/food/apple-salad.png`);
        this.art.images.add("halloumi-salad", `${BASE_URL}images/menu/food/halloumi-salad.png`);

        this.art.images.add("spaghetti-bolognese-bite", `${BASE_URL}images/menu/food/spaghetti-bolognese-bite.png`);
        this.art.images.add("pizza-pineapple-bite", `${BASE_URL}images/menu/food/pizza-pineapple-bite.png`);
        this.art.images.add("tacos-bite", `${BASE_URL}images/menu/food/tacos-bite.png`);
        this.art.images.add("curry-with-fried-egg-bite", `${BASE_URL}images/menu/food/curry-with-fried-egg-bite.png`);
        this.art.images.add("tonkotsu-ramen-bite", `${BASE_URL}images/menu/food/tonkotsu-ramen-bite.png`);
        this.art.images.add("poke-bowl-bite", `${BASE_URL}images/menu/food/poke-bowl-bite.png`);
        this.art.images.add("apple-salad-bite", `${BASE_URL}images/menu/food/apple-salad-bite.png`);
        this.art.images.add("halloumi-salad-bite", `${BASE_URL}images/menu/food/halloumi-salad-bite.png`);


        // Dessert

        this.art.images.add("blueberry-pie", `${BASE_URL}images/menu/dessert/blueberry-pie.png`);
        this.art.images.add("banana-split", `${BASE_URL}images/menu/dessert/banana-split.png`);
        this.art.images.add("frozen-cheesecake-with-fresh-raspberries", `${BASE_URL}images/menu/dessert/frozen-cheesecake-with-fresh-raspberries.png`); 
        this.art.images.add("chocolate-ball", `${BASE_URL}images/menu/dessert/chocolate-ball.png`); 
        this.art.images.add("white-chocolate-chip-cookie", `${BASE_URL}images/menu/dessert/white-chocolate-chip-cookie.png`); 
        this.art.images.add("panna-cotta-with-red-berry-sauce", `${BASE_URL}images/menu/dessert/panna-cotta-with-red-berry-sauce.png`); 
        this.art.images.add("strawberry-cake", `${BASE_URL}images/menu/dessert/strawberry-cake.png`);

        this.art.images.add("blueberry-pie-bite", `${BASE_URL}images/menu/dessert/blueberry-pie-bite.png`);
        this.art.images.add("banana-split-bite", `${BASE_URL}images/menu/dessert/banana-split-bite.png`);
        this.art.images.add("frozen-cheesecake-with-fresh-raspberries-bite", `${BASE_URL}images/menu/dessert/frozen-cheesecake-with-fresh-raspberries-bite.png`); 
        this.art.images.add("chocolate-ball-bite", `${BASE_URL}images/menu/dessert/chocolate-ball-bite.png`); 
        this.art.images.add("white-chocolate-chip-cookie-bite", `${BASE_URL}images/menu/dessert/white-chocolate-chip-cookie-bite.png`); 
        this.art.images.add("panna-cotta-with-red-berry-sauce-bite", `${BASE_URL}images/menu/dessert/panna-cotta-with-red-berry-sauce-bite.png`); 
        this.art.images.add("strawberry-cake-bite", `${BASE_URL}images/menu/dessert/strawberry-cake-bite.png`);

        await this.art.images.load();
       
        this.background = new StaticImage(this, Symbol("background"), { x: 0, y: 0 }, this.art.width, this.art.height, "background");

        this.#createTables();
        this.#createGrid();
  
        this.waiters.push(new Waiter(this, Symbol("waiter"), {x: 0, y: 0}, 17, 32, "afro",  
        {x: 8 *  this.art.tileSize, y: 2 *  this.art.tileSize}, 
     {x: 10 * this.art.tileSize, y: this.art.height + this.art.tileSize}));
        this.waiters.push(new Waiter(this, Symbol("waiter"), {x: 0, y: 0}, 17, 32, "ginger",  
        {x: 9 *  this.art.tileSize, y: 2 *  this.art.tileSize},
        {x: 8 * this.art.tileSize, y: this.art.height + this.art.tileSize}
    ));
    
        this.#initGuests(); 

        this.jb = new JB(this);

        this.dan = new Dan(this);

        this.isInitialized = true;
    }


    update() {

        if(!this.anyGuestsAreArriving() && !this.anyGuestsAreLeaving() && this.allWaitersAreWaiting()
             && this.guestGroups.length < 4) {      
            this.#createGuestGroup({name: "arrive"});
        } 

        for(const w of this.waiters) {
            w.update()
        }
        
        for(const gg of this.guestGroups) {
            gg.update();

            for(const g of gg.guests) {
                g.update();
            }
        }

        this.dan.update();
        this.jb.update();

    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {

        this.background.draw(ctx);

        // ctx.fillStyle = "black";

        // const COLS = this.art.width / this.art.tileSize;
        // const ROWS = this.art.height / this.art.tileSize;

        // drawGrid(ctx, ROWS, COLS, this.art.tileSize, 0, 32);

        // for (let r = 0; r < this.grid.length; ++r) {
        //     for (let c = 0; c < this.grid[0].length; ++c) {
        //         if (this.grid[r][c] === 1) {
        //             ctx.fillStyle = "red";
        //             ctx.fillRect(c * 16, r * 16, 16, 16);
        //         }
        //     }
        // }

        // Objects sorted by their y position 
        const objects = [
            ...this.guestGroups.map(gg => gg.guests).flat(),
            ...this.tables.map(t => t.chairs).flat(), 
            ...this.tables, ...this.waiters, 
            ...this.guestGroups.filter(gg => gg.tableOrder !== null && gg.tableOrder.isServed)
            .flatMap(gg => gg.tableOrder.guestOrders.filter(o => !(o.guest.isDrinking() && o.menuItem.type === "drink")))
            ].sort((o1, o2) => {
                return o1.pos.y - o2.pos.y;
        });

        for(const o of objects) {
            o.draw(ctx);
        }
 
        // Message bubbles stands on top of it all

        const guestGroupMessageBubbles = this.guestGroups.map(gg => gg.messageBubble);
        const guestMessageBubbles = this.guestGroups.map(gg => gg.guests).flat().map(g => g.messageBubble);

        for(const w of this.waiters) {
            if(w.messageBubble.isShowing) w.messageBubble.draw(ctx)    
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

        this.dan.draw(ctx);
        this.jb.draw(ctx);

    }


    #createGrid() {
        // Initialize grid to 0 (walkable)
        const rows = (this.art.height + this.art.tileSize) / this.art.tileSize;
        const cols = this.art.width / this.art.tileSize;
        this.grid = createGrid(rows, cols, 0);

        // Top 2 rows to 1 (non-walkable)
        for (let r = 0; r < 2; ++r) {
            for (let c = 0; c < cols; ++c) {
                this.grid[r][c] = 1;
            }
        }

        // The idle place for waiters 
        for(let c = 8; c < 12; ++c) {
            this.grid[2][c] = 1;
        }

        // Rightmost 4 columns to 1 (non-walkable)
        for (let r = 0; r < rows; ++r) {
            for (let c = cols - 4; c < cols; ++c) {
                this.grid[r][c] = 1;
            }
        }

        // Each table and the tiles around it (but not the corners)
        for (const t of this.tables) {
            // Table center tile
            const tC = t.pos.x / this.art.tileSize;
            const tR = t.pos.y / this.art.tileSize;

            for(const r of [tR - 1, tR, tR + 1, tR + 2]) {
                for (const c of [tC - 1, tC, tC + 1, tC + 2]) {
                    this.grid[r][c] = 1;
                }
            }

            // Set corners back to 0 (walkable)
            for (const c of t.corners) {
                const cx = c.x / this.art.tileSize;
                const cy = c.y / this.art.tileSize;
                this.grid[cy][cx] = 0;
            }
        }

    }

    #createTables() {

        const tileSize = 16;

        const tablePositions = [ 
            { x: 2 * tileSize, y: 4 * tileSize },
            { x: 15 * tileSize, y: 4 * tileSize }, 
            { x: 9 * tileSize, y: 7 * tileSize },
            { x: 2 * tileSize, y: 10 * tileSize },
            { x: 15 * tileSize, y: 10 * tileSize } ];

        
        // n, e, s, w
        const chairPositionDiffs = [{x: tileSize / 2, y: -26
        }, 
            {x: 28, y: -5}, 
            {x: tileSize / 2, y: tileSize }, 
            {x: - 13 , y: -5}];

        for (let i = 0; i < tablePositions.length; ++i) {
            const tp = tablePositions[i];

            const chairs = [];
       
            for(let i = 0; i < chairPositionDiffs.length; ++i) {
                const cp = chairPositionDiffs[i];
                const pos = {x: tp.x + cp.x, y: tp.y + cp.y};
                chairs.push(new Chair(this, {...pos}, 17, 32, `chair-${i}`, i));
            }

            this.tables.push(new Table(this, tp, chairs, i, ));

         }
    }

    #initGuests() {
        this.#createGuestGroup( {name: "order", type: "food"});
        this.#createGuestGroup( {name: "eat-drink", type: "food"});
        this.#createGuestGroup( {name: "arrive"});  
        this.#createGuestGroup( {name: "eat-drink", type: "dessert"});
        this.#createGuestGroup( {name: "ask-bill"});
    }

    #createGuestGroup(initialState) {
    
        const table = this.tables.find(t => t.isAvailable);
     
        if(table === undefined) {
            console.error("No available table, should not happen though according to my perfectly coded program.");
            return;
        }

        table.isAvailable = false;
 
        const guestGroup = new GuestGroup(this, initialState, table);
        this.guestGroups.push(guestGroup);
        guestGroup.init();
       
    }
}