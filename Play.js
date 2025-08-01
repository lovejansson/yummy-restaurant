import { Scene, StaticImage } from "./pim-art/index.js";
import { createGrid, drawGrid } from "./path.js";
import Waiter from "./Waiter.js";
import { BASE_URL } from "./config.js";
import  { Table, Chair } from "./Table.js";
import GuestGroup from "./GuestGroup.js"; 
import Guest
 from "./Guest.js";
import TableOrder from "./TableOrder.js";
import { menu } from "./menu.js";

export default class Play extends Scene {

    constructor() {
        super();
        /**
         * @type {TableOrder[]}
         */
        this.orders = [];

        /**
         * @type {Table[]}
         */
        this.tables = [];

        /**
         * @type {{pos: {x: number, y: number}, isAvailable: boolean}[]}
         */
        this.waiterIdlePositions = [];

        /**
         * @type {GuestGroup[]}
         */
        this.guestGroups = [];

        /**
         * @type {{pos: {x: number, y: number}, isAvailable: boolean}[]}
         */
        this.kitchenPositions = []

        this.mocked = [];
    }

    getKitchenPos() {
        return this.kitchenPositions.filter(kp => kp.isAvailable).random().pos
    }

    getIdlePos() {
        return this.waiterIdlePositions.filter(wip => wip.isAvailable).random().pos
    }

    guestGroupLeft(guestGroup) {
        guestGroup.table.isAvailable = true;
        this.guestGroups.remove(guestGroup);
        this.#createGuestGroup({name: "arrive"})
    }

    getGroupFor(guest) {
        return this.guestGroups.find(gg => gg.guests.find(g => g === guest));
    }

    getChairFor(guest) {
        return this.guestGroups.find(gg => gg.guests.find(g => g === guest)).table.chairs[guest.tableSide];
    }

    getOrderFor(guestGroup) {
        return this.orders.find(to => to.guestGroup === guestGroup);
    }

    pickTableForGuests(guestGroup) {
        const table = this.tables.filter(t => t.isAvailable).random();
        table.isAvailable = false;
        guestGroup.table = table;
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
     * @param {string} imageKey 
     * @param {{x: number, y: number}} [pos] 
     * @returns {StaticImage} menu item as static image object
     */
    createMenuItem(imageKey, pos = {x: 0, y: 0}) {
        const image = this.art.images.get(imageKey);
        return new StaticImage(this, Symbol("menu-item"), pos, image.width, image.height, imageKey);
    }


    async init() {

        this.art.images.add("table", `${BASE_URL}images/table.png`);
        this.art.images.add("background", `${BASE_URL}images/background.png`);
        this.art.images.add("waiter-afro-walk", `${BASE_URL}images/waiter-afro-walk.png`);
        this.art.images.add("waiter-afro-walk-serve", `${BASE_URL}images/waiter-afro-walk-tray.png`);
        this.art.images.add("granny-walk", `${BASE_URL}images/granny-walk.png`);
        this.art.images.add("chair-0", `${BASE_URL}images/chair-n.png`);
        this.art.images.add("chair-1", `${BASE_URL}images/chair-e.png`);
        this.art.images.add("chair-2", `${BASE_URL}images/chair-s.png`);
        this.art.images.add("chair-3", `${BASE_URL}images/chair-w.png`);

        this.art.images.add("idle-sit-0", `${BASE_URL}images/granny-sit-s.png`);
        this.art.images.add("idle-sit-1", `${BASE_URL}images/granny-sit-w.png`);
        this.art.images.add("idle-sit-2", `${BASE_URL}images/granny-sit-n.png`);
        this.art.images.add("idle-sit-3", `${BASE_URL}images/granny-sit-e.png`);

        this.art.images.add("idle-drink-0", `${BASE_URL}images/granny-drink.png`);
        this.art.images.add("idle-eat-0", `${BASE_URL}images/granny-eat.png`);

        this.art.images.add("msg-bubble", `${BASE_URL}images/msg-bubble.png`);

        // Symbols

        this.art.images.add("smiley", `${BASE_URL}images/symbols/smiley.png`);
        this.art.images.add("exclamation", `${BASE_URL}images/symbols/exclamation.png`);
        this.art.images.add("question", `${BASE_URL}images/symbols/question.png`);
        this.art.images.add("heart", `${BASE_URL}images/symbols/heart.png`);

        // Drinks

        this.art.images.add("milk", `${BASE_URL}images/menu/drink/milk.png`);
        this.art.images.add("corn-silk-ice-tea", `${BASE_URL}images/menu/drink/corn-silk-ice-tea.png`);
        this.art.images.add("corn-silk-ice-tea-drinking", `${BASE_URL}images/menu/drink/corn-silk-ice-tea-drinking.png`);
        this.art.images.add("coca-cola-zero", `${BASE_URL}images/menu/drink/coca-cola-zero.png`);
        this.art.images.add("rhubarb-lemonade", `${BASE_URL}images/menu/drink/rhubarb-lemonade.png`);        
        this.art.images.add("water-with-ice", `${BASE_URL}images/menu/drink/water-with-ice.png`);         
        this.art.images.add("coffee-latte", `${BASE_URL}images/menu/drink/latte.png`);
        this.art.images.add("ice-coffee-latte", `${BASE_URL}images/menu/drink/latte.png`);

        // Food

        this.art.images.add("spaghetti-bolognese", `${BASE_URL}images/menu/food/spaghetti-bolognese.png`);
        this.art.images.add("pizza-pineapple", `${BASE_URL}images/menu/food/pizza-pineapple.png`); 
        this.art.images.add("tacos", `${BASE_URL}images/menu/food/tacos.png`);
        this.art.images.add("curry-with-fried-egg", `${BASE_URL}images/menu/food/curry-with-fried-egg.png`); 
        this.art.images.add("tonkotsu-ramen", `${BASE_URL}images/menu/food/tonkotsu-ramen.png`); 
        this.art.images.add("poke-bowl", `${BASE_URL}images/menu/food/poke-bowl.png`);
        this.art.images.add("apple-salad", `${BASE_URL}images/menu/food/apple-salad.png`);
        this.art.images.add("halloumi-salad", `${BASE_URL}images/menu/food/halloumi-salad.png`);

        // Dessert

        this.art.images.add("blueberry-pie", `${BASE_URL}images/menu/dessert/blueberry-pie.png`);
        this.art.images.add("banana-split", `${BASE_URL}images/menu/dessert/banana-split.png`);
        this.art.images.add("frozen-cheesecake-with-fresh-raspberries", `${BASE_URL}images/menu/dessert/frozen-cheesecake-with-fresh-raspberries.png`); 
        this.art.images.add("chocolate-ball", `${BASE_URL}images/menu/dessert/chocolate-ball.png`); 
        this.art.images.add("white-chocolate-chip-cookie", `${BASE_URL}images/menu/dessert/white-chocolate-chip-cookie.png`); 
        this.art.images.add("panna-cotta-with-red-berry-sauce", `${BASE_URL}images/menu/dessert/panna-cotta-with-red-berry-sauce.png`); 
        this.art.images.add("strawberry-cake", `${BASE_URL}images/menu/dessert/strawberry-cake.png`);
            
        this.art.images.add("bite", `${BASE_URL}images/menu/bite.png`);

        await this.art.images.load();
       
        this.background = new StaticImage(this, Symbol("background"), { x: 0, y: 0 }, 320, 226, "background");

        this.#createTables();
        this.#createGrid();
        this.#createIdlePositions();
        this.#createKitchenPositions();
 
        this.waiter = new Waiter(this, Symbol("waiter"), this.waiterIdlePositions.random().pos, 15, 32, "afro");

        this.#initGuests(); 

        this.isInitialized = true;

        const mockTable = this.tables[0];
        
        for(let i = 0; i < 4; ++i) {
            const food = menu["food"].random()
            const drink = menu["drink"].random()
  
            this.mocked.push(new StaticImage(this, Symbol("mocked"), mockTable.getMenuItemPos("food", food, i),
             food.width, food.height, food.image ));

            this.mocked.push(new StaticImage(this, Symbol("mocked"), mockTable.getMenuItemPos("drink", drink, i),
             drink.width, drink.height, drink.image ));

           // this.mocked.push(new StaticImage(this, Symbol("mocked"), mockTable.getDrinkPos(drink, i), drink.width, drink.height, drink.image))
        }

    }


    update() {


        // For DEBUG
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
                if (this.grid[r][c] > 1) {
                        ctx.fillStyle = "red";
                    ctx.fillRect(c * 16, r * 16, 16, 16);
                }
             
            }
        }

        const objects = [
            ...this.tables.map(t => t.chairs).flat(), ...this.tables, this.waiter, ...this.guestGroups.map(gg => gg.guests).flat(), ].sort((o1, o2) => {
                // Guest and Chair objects have same y if they belong together
                if (o1 instanceof Guest && o2 instanceof Chair && (o1.isIdleSitting() || o1.isSittingDown() || o1.isStandingUp())) {
                    if (o1.tableSide === o2.tableSide) {
                        if (o1.tableSide === 2) {
                            // Guest first, then chair (north)
                            return -1;
                        } else if ([0, 1, 3].includes(o1.tableSide)) {
                            // Chair first, then guest (south, east, west)
                            return 1;
                        }
                    }
                } else if (o1 instanceof Chair && o2 instanceof Guest && (o2.isIdleSitting() || o2.isSittingDown() || o2.isStandingUp())) {
                    if (o1.tableSide === o2.tableSide) {
                        if (o1.tableSide === 2) {
                            // Guest first, then chair (north)
                            return 1;
                        } else if ([0, 1, 3].includes(o1.tableSide)) {
                            // Chair first, then guest (south, east, west)
                            return -1;
                        }
                    }
                }
                 
                // Default sort render pos on y value
                return o1.pos.y - o2.pos.y
        });

        for(const o of objects) {
            o.draw(ctx);
        }

        for(const o of this.orders) {
            o.draw(ctx);
        }

        // Message bubbles last on top of it
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
            {x: tileSize * 2, y: -tileSize / 4}, 
            {x: tileSize / 2, y: tileSize }, 
            {x: -tileSize/2, y: -tileSize / 2}];

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