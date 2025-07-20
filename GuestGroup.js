import Guest, { Arrive, Order, ReceiveOrder, EatAndDrink, Leave } from "./Guest.js";
import { MessageBubble } from "./message.js";


export default class GuestGroup {

    /**
     * @param {Scene} scene
     * @param {{
     * name: "arrive" | "eat-drink" | "order" | "receive-order" | "leave", 
     * type?: "food" | "dessert" | "bill"}} initalState
     */
    constructor(scene, initalState) {
        this.scene = scene;
        this.guests = [];
        this.state = initalState;
        this.messageBubble = new MessageBubble(scene);
        this.table = null;
    }


    allIsDoneWithLifeCycleState() {
        return this.guests.every(g => g.lifeCycleState.isDone);
    }
    
    waiterIsHere(){
        this.messageBubble.isShowing = false;
    }

    init() {

        // Create the guests

        const numOfGuests = 2;

        if (numOfGuests === 2) {

            // Either north and south side or east and west side of the table
            const tableSide = Math.random() > 0.5 ? [0, 2] : [1, 3];

            const guest1 = new Guest(this.scene, Symbol("guest"), { x: 0, y: 0 }, 15, 32, tableSide[0]);
            this.guests.push(guest1);
            const guest2 = new Guest(this.scene, Symbol("guest"), { x: 0, y: 0 }, 15, 32, tableSide[1]);
            this.guests.push(guest2);
        } else {
            const startIdx = Math.min(4 - numOfGuests, Math.floor(Math.random() * 4));
            for (let i = startIdx; i < startIdx + numOfGuests; ++i) {
                const guest = new Guest(this.scene, Symbol("guest"), { x: 0, y: 0 }, 15, 32, i);
                this.guests.push(guest);
            }
        }

        switch (this.state.name) {
            case "arrive":

                const ARRIVE_POS = { x: 0, y: 16 * 6 };

                const xyDiffs = [
                    {x: 0, y: 0}, 
                    {x: 0, y: this.scene.art.tileSize}, 
                    {x: this.scene.art.tileSize, y: 0},
                    {x: this.scene.art.tileSize, y: this.scene.art.tileSize}
                ]

                for (let i = 0; i < this.guests.length; ++i) {
                    const guest = this.guests[i];
                    guest.pos = { x: ARRIVE_POS.x + xyDiffs[i].x, y: ARRIVE_POS.y + xyDiffs[i].y };
                    guest.lifeCycleState = new Arrive();
                }
           
                // Show ! in message bubble until waiter comes to serve them
                const msgBubblePos =   {
                    x: 0, 
                    y: this.guests.length > 1 ? ARRIVE_POS.y - this.messageBubble.height : ARRIVE_POS.y - this.messageBubble.height}
                    console.log("MSG BUBBLE POS", msgBubblePos)
                    this.messageBubble.showMessage(this.scene.symbols.exclamation, 
                  msgBubblePos , 10000); 

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

                this.messageBubble.showMessage(this.scene.symbols.exclamation, 
                    {x: this.table.centerPos.x - this.messageBubble.width, y: this.table.centerPos.y - this.messageBubble.height},
                    5000
                ); // Show ! over table

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

                    if (this.table === null) {
                        console.error("Missing table for guest group");
                        return;
                    }

                    this.state = { name: "order", type: "food" };

                    for (const g of this.guests) {
                        g.lifeCycleState = new Order("food");
                    }

                    // Send out order event when guests have been seated
                    setTimeout(() => {
                        this.messageBubble.showMessage(this.scene.symbols.exclamation,
                            {x: this.table.centerPos.x - this.messageBubble.width / 2, y: this.table.centerPos.y - this.messageBubble.height / 2},
                                    5000)

                        this.scene.art.services.events.add({ name: "order-food", data: { guestGroup: this } });
                    }, 10000);

                    break;
                case "order":
                   { console.log("RECEIVE ORDER " + this.state.type)
                    const guestWhoShouldTakeBill = this.guests.random();

                    for (const g of this.guests) {
                        g.lifeCycleState = new ReceiveOrder(this.state.type, this.state.type === "bill" && guestWhoShouldTakeBill === g);
                    }
            
                    this.state = { name: "receive-order", type: this.state.type };
                    break;}
                case "receive-order":
                    switch (this.state.type) {
                        case "food":
                        case "dessert":
                            for (const g of this. guests) {
                                console.log("GUEST GROUP START EAT AND DRINK")
                                g.lifeCycleState = new EatAndDrink(this.state.type)
                            }
                            this.state = { name: "eat-drink", type: this.state.type };
                            break;
                        case "bill":
                            console.log("GUESTS SHOULD LEAVE NOW")
                            for (const g of this.guests) {
                                g.lifeCycleState = new Leave()
                                g.pos = this.table.corners[this.guests.indexOf(g)]
                            }
                            this.state = { name: "leave" };
                            break;
                    }

                    break;

                case "eat-drink":
                    console.log("GUEST GROUP FINISHED EATING")
                    const nextOrderType = this.state.type === "food" ? "dessert" : "bill";

                    const guestWhoShouldTakeBill = this.guests.random();

                    for (const g of this.guests) {
                        g.lifeCycleState = new Order(nextOrderType, nextOrderType === "bill" && g === guestWhoShouldTakeBill);
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
    }

}