import { Scene, StaticImage } from "./pim-art/index.js";
import { createGrid, drawGrid } from "./path.js";
import Waiter from "./Waiter.js";
import { BASE_URL } from "./config.js";
import  { Table, Chair } from "./Table.js";
import GuestGroup from "./GuestGroup.js"; 
import Guest
 from "./Guest.js";

/**
 * @typedef  {{pos: {x: number, y: number}, isAvailable: boolean}} AvailablePos
 */

export default class Play extends Scene {

    constructor() {
        super();

        /**
         * @type {AvailablePos[]}
         */
        this.waiterIdlePositions = [];

        /**
         * @type {AvailablePos[]}
         */
        this.kitchenPositions = []

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

    getKitchenPos() {
        return this.kitchenPositions.filter(kp => kp.isAvailable).random().pos
    }

    getIdlePos() {
        return this.waiterIdlePositions.filter(wip => wip.isAvailable).random().pos
    }

    removeGuestGroup(guestGroup) {
        guestGroup.table.isAvailable = true;
        this.guestGroups.remove(guestGroup);
        this.#createGuestGroup({name: "arrive"});
    }

    getGroupFor(guest) {
        return this.guestGroups.find(gg => gg.guests.find(g => g === guest) !== undefined);
    }

    getOrderFor(guestGroup) {
        return this.orders.find(to => to.guestGroup === guestGroup);
    }

    getGuestOrder(guest) {
        return this.orders.flatMap(o => o.guestOrders).find(go => go.guestId === guest.id);
    }

    getChairFor(guest) {
        const guestGroup = this.getGroupFor(guest);
        if(guestGroup === undefined) throw new Error("Invalid data state");

        const chair = guestGroup.table.chairs.find(c => c.tableSide === guest.tableSide);

        if (chair === undefined) throw new Error("Invalid data state");

        return chair;

    }
    
    createSymbol(image) {
        return new StaticImage(this, Symbol("symbol"), 
                {x: 0, y: 0}, this.art.images.get(image).width, this.art.images.get(image).height, image);
    }

    removeOrder(order) {
        const orderInList = this.orders.find(o => o === order);

        if(!orderInList) {
            console.error("Order not found: ", order);
        } else {
            this.orders.remove(orderInList);
        }
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
        console.debug("Play init")
        this.art.images.add("table", `${BASE_URL}images/table.png`);
        this.art.images.add("background", `${BASE_URL}images/background.png`);
        this.art.images.add("waiter-afro-walk", `${BASE_URL}images/waiter-afro-walk.png`);
        this.art.images.add("waiter-afro-walk-serve", `${BASE_URL}images/waiter-afro-walk-tray.png`);

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
       
        this.background = new StaticImage(this, Symbol("background"), { x: 0, y: 0 }, 320, 226, "background");

        this.#createTables();
        this.#createGrid();
        this.#createIdlePositions();
        this.#createKitchenPositions();
 
        this.waiter = new Waiter(this, Symbol("waiter"), this.waiterIdlePositions.random().pos, 15, 32, "afro");

        this.#initGuests(); 

        this.isInitialized = true;
    }


    update() {

        // if (this.art.keys.up) {
        //      // console.log("up")
        // } else if (this.art.keys.down) {
        //     // console.log("down")
        // } else if (this.art.keys.left) {
        //     // console.log("left")
        // } else if (this.art.keys.right) {
        //     // console.log("right")
        // } else if (this.art.keys.space) {
        //     // console.log("space")
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

        ctx.fillStyle = "black";

        const COLS = this.art.width / this.art.tileSize;
        const ROWS = this.art.height / this.art.tileSize;

        drawGrid(ctx, ROWS, COLS, this.art.tileSize, 0, 32);

        for (let r = 0; r < this.grid.length; ++r) {
            for (let c = 0; c < this.grid[0].length; ++c) {
                if (this.grid[r][c] === 1) {
                    ctx.fillStyle = "red";
                    ctx.fillRect(c * 16, r * 16, 16, 16);
                }
             
            }
        }

        // Objects sorted by their y position 
        const objects = [
            ...this.tables.map(t => t.chairs).flat(), 
            ...this.tables, this.waiter, 
            ...this.guestGroups.map(gg => gg.guests).flat(),
            ...this.guestGroups.filter(gg => gg.tableOrder !== null && gg.tableOrder.isServed)
            .flatMap(gg => gg.tableOrder.guestOrders.filter(o => !(o.guest.isDrinking() && o.menuItem.type === "drink")))
            ].sort((o1, o2) => {

                
                if(o1 instanceof Chair && o2 instanceof Guest && this.getChairFor(o2) === o1 && o1.tableSide === 2) {
                    return 1;
                } else if (o1 instanceof Guest && o2 instanceof Chair && this.getChairFor(o1) === o2 && o1.tableSide === 2) {
                    return -1;
                }

                return o1.pos.y - o2.pos.y;
        });

        for(const o of objects) {
            o.draw(ctx);
        }
 
        // Message bubbles stands on top of it all

        const guestGroupMessageBubbles = this.guestGroups.map(gg => gg.messageBubble);
        const guestMessageBubbles = this.guestGroups.map(gg => gg.guests).flat().map(g => g.messageBubble);
   
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

        if(this.waiter.messageBubble.isShowing) {
            this.waiter.messageBubble.draw(ctx);
        }  

    }


    #createGrid() {

        this.grid = createGrid((this.art.height + this.art.tileSize) / this.art.tileSize, this.art.width / this.art.tileSize, 1);
        
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

       for(let c = 0; c < this.grid[0].length; ++c) {
            this.grid[this.grid.length - 2][c] = 0;
            this.grid[this.grid.length - 1][c] = 0;
       }
        
    }

    #createIdlePositions() {
        for (let c = 8; c < 12; ++c) {
            this.waiterIdlePositions.push({ pos: {x: c *  this.art.tileSize, y: 2 *  this.art.tileSize}, isAvailable: true });
        }
    }

    #createKitchenPositions() {
        for (let c = 8; c < 12; ++c) {
            this.kitchenPositions.push({ pos: {x: c * this.art.tileSize, y: this.art.height + this.art.tileSize}, isAvailable: true });
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

        
        // n, e, s, w
        const chairPositionDiffs = [{x: tileSize / 2, y: -tileSize * 1.5
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

            this.tables.push(new Table(this, tp, chairs));

         }
    }

    #initGuests() {
                this.#createGuestGroup( {name: "receive-order", type: "bill"});    
        this.#createGuestGroup( {name: "eat-drink", type: "food"});
          this.#createGuestGroup( {name: "arrive"});
        this.#createGuestGroup( {name: "eat-drink", type: "food"});

        this.#createGuestGroup( {name: "eat-drink", type: "food"});
      
 
              
              
     
    }

    #createGuestGroup(initialState) {
    
        const table = this.tables.find(t => t.isAvailable);
     
        if(table === undefined) {
            console.error("No availble table, should not happen though according to my perfectly coded program.");
            return;
        }

        table.isAvailable = false;
 
        const guestGroup = new GuestGroup(this, initialState, table);
        this.guestGroups.push(guestGroup);
        guestGroup.init();
       
    }

}