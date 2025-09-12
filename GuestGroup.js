import Guest, { Arrive, Order, ReceiveOrder, EatAndDrink, EatDrinkDone, Leave, IdleSitting, AskForBill, GetBill } from "./Guest.js";
import { MessageBubble } from "./message.js";
import TableOrder from "./TableOrder.js";
import { menu, OrderedMenuItem } from "./menu.js";
import { debug } from "./index.js";

export default class GuestGroup {

    static LOGGER_TAG = "GuestGroup";

    /**
     * @param {import("./Play.js").default} scene
     * @param {Table} table
     * @param {{
     * name: "arrive" | "eat-drink" | "order" | "receive-order" | "ask-bill" | "get-bill" | "leave-wait" | "leave" , 
     * type?: "food" | "dessert"}} initalState
     */
    constructor(scene, initalState, table) {
        this.scene = scene;
        /**
         * @type {Guest[]}
         */
        this.guests = [];
        this.state = initalState;

        /**
         * @type {MessageBubble}
         */
        this.messageBubble = new MessageBubble(scene);
        this.table = table;

        /**
         * @type {import("./TableOrder.js").default?}
         */
        this.tableOrder = null; // Added later when the guests have ordered something
    }


    lifeCycleStateIsDone() {
        return this.guests.every(g => g.lifeCycleState.isDone);
    }

    waiterIsHere() {
        this.messageBubble.isShowing = false;
    }

    init() {

        // Create the guests and sort by distance to table so the closest guest gets the first chair

        const numOfGuests = 4; //  Math.ceil(Math.random() * 4);

        if (numOfGuests === 2) {

            // Either north and south side or east and west side of the table
            const tableSide = Math.random() > 0.5 ? [0, 2] : [1, 3];

            for (let i = 0; i < 2; ++i) {
                this.guests.push(new Guest(this.scene, this.#pickGuestVariant(), { x: 0, y: 0 }, tableSide[i]));
            }

        } else {

            const startIdx = Math.min(4 - numOfGuests, Math.floor(Math.random() * 4));

            for (let i = startIdx; i < startIdx + numOfGuests; ++i) {
                const guest = new Guest(this.scene, this.#pickGuestVariant(), { x: 0, y: 0 }, i);
                this.guests.push(guest);
            }
        }

 

        // Initialize the states 
        switch (this.state.name) {

            case "arrive":

                const FIRST_POS = { x: 0, y: this.scene.art.tileSize * 6 };

                const xyDiffs = [{ x: this.scene.art.tileSize, y: this.scene.art.tileSize },
                    { x: 0, y: this.scene.art.tileSize * 2 },
                    { x: 0, y: this.scene.art.tileSize }, { x: 0, y: 0 },
                ]


                for (let i = 0; i < this.guests.length; ++i) {
                    const guest = this.guests[i];
                    const waitPos = { x: FIRST_POS.x + xyDiffs[i].x, y: FIRST_POS.y + xyDiffs[i].y };
                    guest.pos = {x: waitPos.x - this.scene.art.tileSize + Math.floor(Math.random() * numOfGuests) , y: waitPos.y};
                    guest.lifeCycleState = new Arrive(waitPos);
                }

                // Show ! in message bubble until waiter comes to serve them
                const msgBubblePos = {
                    x:  this.scene.art.tileSize,
                    y: FIRST_POS.y + this.scene.art.tileSize - this.messageBubble.height
                }
                setTimeout(() => {
                    this.messageBubble.showMessage(this.scene.createSymbol("exclamation"),
                    msgBubblePos, 1000 * 60);
                     this.scene.art.services.events.add({ name: this.state.name, data: { guestGroup: this } });
                }, 1500)
                this.guests.sort((g1, g2) => {
                    const d1 = Math.sqrt(Math.pow(g1.pos.x - this.table.pos.x, 2) + Math.pow(g1.pos.y - this.table.pos.y + this.table.halfHeight, 2));
                    const d2 = Math.sqrt(Math.pow(g2.pos.x - this.table.pos.x, 2) + Math.pow(g2.pos.y - this.table.pos.y  + this.table.halfHeight, 2));
                    return d1 - d2;
                });
                break;
            case "eat-drink":

                this.tableOrder = this.#createRandomTableOrder(this.state.type);

                for (const g of this.guests) {
                    this.#startEatAndDrink(g);
                }

                break;
            case "order":
                {
                    for (const g of this.guests) {
                        g.pos = this.table.getChairPos(g.tableSide);
                        g.actionState = new IdleSitting();
                        g.lifeCycleState = new Order(this.state.type);
                    }

                    // Show ! in message bubble until waiter comes to serve them
                    const msgBubblePos = {
                        x: Math.round(this.table.centerPos.x - this.messageBubble.halfWidth),
                        y: Math.round(this.table.centerPos.y - this.messageBubble.height * 2)
                    };

                    this.messageBubble.showMessage(this.scene.createSymbol("exclamation"),
                        msgBubblePos, 10000);

                    setTimeout(() =>  {
                        this.scene.art.services.events.add({ name: `${this.state.name}-${this.state.type}`, data: { guestGroup: this } });
                    }, 2000);

                    break;
                }

            case "receive-order":

                this.tableOrder = this.#createRandomTableOrder(this.state.type);

                for (const g of this.guests) {
                    g.pos = this.table.getChairPos(g.tableSide);
                    g.actionState = new IdleSitting();
                    g.lifeCycleState = new ReceiveOrder();
                }

                // After 5 min the order is ready to pick up 
                setTimeout(() => {
                    this.scene.art.services.events.add({ name: "order-ready", data: { guestGroup: this } });
                }, 1000 * 5);

                break;
            case "ask-bill":
                {
                    const guestWhoShouldPay = this.guests.random();

                    for (const g of this.guests) {
                        g.pos = this.table.getChairPos(g.tableSide);
                        g.actionState = new IdleSitting();
                        g.lifeCycleState = new AskForBill(g === guestWhoShouldPay);
                    }

                  
                    setTimeout(() =>  {
                        this.scene.art.services.events.add({ name: "bill", data: { guestGroup: this } });

                    }, 3000);

                    this.messageBubble.showMessage(this.scene.createSymbol("exclamation"),
                        {
                            x: Math.round(this.table.centerPos.x - this.messageBubble.halfWidth),
                            y: Math.round(this.table.centerPos.y - this.messageBubble.height * 2)
                        },
                        5000)

                    break;
                }
            case "get-bill":
                {
                    const guestWhoShouldPay = this.guests.random();

                    for (const g of this.guests) {
                        g.pos = this.table.getChairPos(g.tableSide);
                        g.actionState = new IdleSitting();
                        g.lifeCycleState = new GetBill(g === guestWhoShouldPay);
                    }

                    setTimeout(() => {
                        this.scene.art.services.events.add({ name: "bill-ready", data: { guestGroup: this } });
                    }, 1000 * 5);

                    break;
                }
            case "leave":
                {
                    for (let i = 0; i < this.guests.length; ++i) {
                        this.guests[i].pos = this.table.getChairPos(this.guests[i].tableSide);
                        this.guests[i].actionState = new IdleSitting();
                        this.guests[i].lifeCycleState = new Leave();
                    }

                    break;
                }
        }
    }

    update() {
        // debug(GuestGroup.LOGGER_TAG, "update", "table", this.table.tableNum);
        // debug(GuestGroup.LOGGER_TAG, this.state);

        if(!this.lifeCycleStateIsDone() && this.state.name === "eat-drink") {
            // for(const g of this.guests) {
            //     console.dir(g);
            // }
        }
       
        if (this.lifeCycleStateIsDone()) {
            debug(GuestGroup.LOGGER_TAG, "guest group is done with ", this.state.name)
            switch (this.state.name) {
                case "arrive":
                    {

                        for (const g of this.guests) {
                            g.lifeCycleState = new Order("food");
                        }

                        setTimeout(() => {
                            // Show ! in message bubble until waiter comes to serve them
                            this.messageBubble.showMessage(this.scene.createSymbol("exclamation"),
                                { x: Math.round(this.table.centerPos.x - this.messageBubble.halfWidth), y: Math.round(this.table.centerPos.y - this.messageBubble.height * 2) }, 10000);

                            this.scene.art.services.events.add({ name: "order-food", data: { guestGroup: this } });

                        }, 10000);
                        this.state = { name: "order", type: "food" };
                        break;
                    }
                case "order": {

                    for (const g of this.guests) {
                        g.lifeCycleState = new ReceiveOrder();
                    }

                    this.state = { name: "receive-order", type: this.state.type };

                    break;
                }
                case "receive-order":

                    if (this.tableOrder === null) throw new Error("tableOrder is null so it gets hard to eat and drink");

                    for (const g of this.guests) {
                        this.#startEatAndDrink(g);
                    }

                    this.state = { name: "eat-drink", type: this.state.type };
                    this.#showMessageBubble("heart");

                    break;

                case "eat-drink":

                    debug(GuestGroup.LOGGER_TAG, "eat-drink done")

                    for (const g of this.guests) {
                        g.lifeCycleState = new EatDrinkDone();
                    }

                    this.state = { name: "eat-drink-done", type: this.state.type };

                    this.messageBubble.showMessage(this.scene.createSymbol("exclamation"),

                        {
                            x: Math.round(this.table.centerPos.x - this.messageBubble.halfWidth),
                            y: Math.round(this.table.centerPos.y - this.messageBubble.height * 2)
                        },
                        5000)

                    this.scene.art.services.events.add({ name: "order-done", data: { guestGroup: this } });

                    break;

                case "eat-drink-done":

                    if (this.state.type === "dessert") {
                        const guestWhoShouldPay = this.guests.random();

                        for (const g of this.guests) {
                            g.lifeCycleState = new AskForBill(g === guestWhoShouldPay);
                        }

                        this.state = { name: "ask-bill" };
                        this.scene.art.services.events.add({ name: "bill", data: { guestGroup: this } });

                    } else {
                        for (const g of this.guests) {
                            g.lifeCycleState = new Order("dessert");
                        }

                        this.state = { name: "order", type: "dessert" };
                        this.scene.art.services.events.add({ name: "order-dessert", data: { guestGroup: this } });
                    }

                    this.messageBubble.showMessage(this.scene.createSymbol("exclamation"),
                        {
                            x: Math.round(this.table.centerPos.x - this.messageBubble.halfWidth),
                            y: Math.round(this.table.centerPos.y - this.messageBubble.height * 2)
                        },
                        5000)

                    break;

                case "ask-bill":
                    const guestWhoShouldPay = this.guests.random();

                    for (const g of this.guests) {
                        g.lifeCycleState = new GetBill(g === guestWhoShouldPay);
                    }
                    this.state = { name: "get-bill" };
                    break;

                case "get-bill":
                    this.state = { name: "leave-wait" };
                    this.#showMessageBubble("heart");
                    break;

                case "leave-wait":
                    if(this.scene.anyGuestsAreLeaving() || this.scene.anyGuestsAreArriving()) break; // It's to crowded to leave right now
                    for (let i = 0; i < this.guests.length; ++i) {
                        this.guests[i].lifeCycleState = new Leave();
                    }
                    this.state = { name: "leave" }; 
                    break;

                case "leave":
                    this.scene.removeGuestGroup(this);
                    break;
            }
        }
    }

    #pickGuestVariant() {

        let guestVariant = ""

        do {
            guestVariant = Guest.VARIANTS.random();
        }

        while (this.guests.find(g => g.variant === guestVariant));

        return guestVariant;
    }

    #createRandomTableOrder(type) {

        const tableOrder = new TableOrder(type);

        // Add menu items
        for (const g of this.guests) {

            const drink = menu.drink.random();
            const eat = menu[type].random();

 
            tableOrder.guestOrders.push(
                new OrderedMenuItem(g, drink, this.table.getMenuItemTablePos("drink", drink, g.tableSide)),
                new OrderedMenuItem(g, eat, this.table.getMenuItemTablePos(this.state.type, eat, g.tableSide)),
            );
        }

        return tableOrder;

    }

    /**
     * @param {Guest} guest 
     */
    #startEatAndDrink(guest) {

        const drinkItem = this.tableOrder.guestOrders.find(i => i.menuItem.type === "drink" && i.guest === guest);

        if (drinkItem === undefined) throw new Error("Drink item not found");

        const eatItem = this.tableOrder.guestOrders.find(i => (i.menuItem.type === "dessert" || i.menuItem.type === "food") && i.guest === guest);

        if (eatItem === undefined) throw new Error("Drink item not found");

        this.tableOrder.isServed = true;

        guest.pos = this.table.getChairPos(guest.tableSide);

        guest.direction = this.table.chairDirections[guest.tableSide];

        guest.lifeCycleState = new EatAndDrink(this.state.type, drinkItem, eatItem);
    }

    /**
     * @param {string} symbolName
     * @param {number} duration
     */
    #showMessageBubble(symbolName, duration = 3000) {
        this.messageBubble.showMessage(this.scene.createSymbol(symbolName),
            {
                x: Math.round(this.table.centerPos.x - this.messageBubble.halfWidth),
                y: Math.round(this.table.centerPos.y - this.messageBubble.height * 2)
            }, duration);
    }

}