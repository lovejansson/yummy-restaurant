import Guest, { Arrive, Order, ReceiveOrder, EatAndDrink } from "./Guest.js";


/**
 * @description Represents a group of guests in a restaurant.
 */
export default class GuestGroup {
    /**
     * @param {Scene} scene
     * @param {Guest[]} guests
     * @param {{
     * name: "arrive" | "eat-drink" | "order" | "receive-order" | "leave", 
     * type?: "food" | "dessert" | "bill"}} initalState
     */
    constructor(scene, initalState) {
        this.scene = scene;
        this.guests = [];
        this.state = initalState;
    }

    allIsDoneWithLifeCycleState() {
        return this.guests.every(g => g.lifeCycleState.isDone);
    }

    init() {
        // Create the guests

        const numOfGuests = Math.ceil(Math.random() * 4);

        if (numOfGuests === 2) {
            const guest1 = new Guest(this, Symbol("guest"), { x: 0, y: 0 }, 15, 32, 0);
            this.guests.push(guest1);
            const guest2 = new Guest(this.scene, Symbol("guest"), { x: 0, y: 0 }, 15, 32, 2);
            this.guests.push(guest2);
        } else {
            const startIdx = Math.min(4 - numOfGuests, Math.floor(Math.random() * 4));
            for (let i = startIdx; i < startIdx + numOfGuests; ++i) {
                const guest = new Guest(this.scene, Symbol("guest"), { x: 0, y: 0 }, 15, 32, i);
                this.guests.push(guest);
            }
        }

        // Update guest state based on inital state

        switch (this.state.name) {
            case "arrive":

                const GUESTS_ARRIVAL_POS = { x: 0, y: 16 * 6 };

                for (let i = 0; i < this.guests.length; ++i) {
                    const guest = this.guests[i];
                    guest.pos = { x: GUESTS_ARRIVAL_POS.x, y: GUESTS_ARRIVAL_POS.y + i * this.scene.art.tileSize * 2 };
                    guest.lifeCycleState = new Arrive();
                }

                this.scene.art.services.events.add({ name: this.state.name, data: { guestGroup: this } });
                break;
            case "eat-drink":
                this.table = this.scene.tables.find(t => t.isAvailable);

                for (let i = 0; i < this.guests.length; ++i) {
                    const guest = this.guests[i];
                    guest.pos = this.table.seats[["n", "e", "s", "w"][guest.tableSide]];
                    guest.lifeCycleState = new EatAndDrink(this.state.type);
                }

                break;
            case "order":
                this.table = this.scene.tables.find(t => t.isAvailable);

                const randomIdx = Math.floor(Math.random() * this.guests.length);

                for (let i = 0; i < this.guests.length; ++i) {
                    const guest = this.guests[i];
                    guest.pos = this.table.seats[["n", "e", "s", "w"][guest.tableSide]];
                    guest.lifeCycleState = new Order(this.state.type, randomIdx === i);
                }

                this.scene.art.services.events.add({ name: this.state.name + this.state.type, data: { guestGroup: this } });

                break;

            case "receive-order":
                this.table = this.scene.tables.find(t => t.isAvailable);
                const randIdx = Math.floor(Math.random() * this.guests.length);
                
                for (let i = 0; i < this.guests.length; ++i) {
                    const guest = this.guests[i];
                    guest.pos = this.table.seats[["n", "e", "s", "w"][guest.tableSide]];
                    guest.lifeCycleState = new ReceiveOrder(this.state.type,  randIdx === i);
                }

                break;
        }
    }

    update() {

        if (this.allIsDoneWithLifeCycleState()) {
            switch (this.state.name) {
                case "arrive":
                    console.log("NEXT ORDER FOOD")
                    this.state = { name: "order", type: "food" };

                    for (const g of this.guests) {
                        g.lifeCycleState = new Order("food");
                    }

                    if (this.table === null) {
                        console.error("Missing table for guest group");
                        return;
                    }
                    this.scene.art.services.events.add({ name: "order-food", data: { guestGroup: this } });
                    break;
                case "order":
                    console.log("RECEIVE ORDER" + this.state.type)
                    for (const g of this.guests) {
                        g.lifeCycleState = new ReceiveOrder(this.state.type);
                    }

                    this.state = { name: "receive-order", type: this.state.type };
                    break;
                case "receive-order":

                    switch (this.state.type) {
                        case "food":
                        case "dessert":
                            for (const g of this.guests) {
                                g.lifeCycleState = new EatAndDrink(this.state.type)
                            }
                            this.state = { name: "eat-drink", type: this.state.type };
                            break;
                        case "bill":
                            for (const g of this.guests) {
                                g.lifeCycleState = new Leave()
                            }
                            this.state = { name: "leave" };
                            break;
                    }

                    break;

                case "eat-drink":

                    const nextOrderType = this.state.type === "food" ? "dessert" : "bill";

                    for (const g of this.guests) {
                        g.lifeCycleState = new Order(nextOrderType);
                    }

                    this.state = { name: "order", type: nextOrderType };
                    console.log("Order " + this.state.type)
                    this.scene.art.services.events.add({ name: this.state.name + "-" + this.state.type, data: { guestGroup: this } });

                    break;

                case "leave":
                    console.log("DONE " + this.state.type)
                    this.scene.guestGroupLeft(this);
                    break;
            }

        }

        for (const g of this.guests) {
            g.update();
        }
    }

    draw(ctx) {
        for (const g of this.guests) {
            g.draw(ctx);
        }
    }

}