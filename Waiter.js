import  { phrases } from "./message.js";
import { MessageBubble } from "./message.js";
import { Sprite } from "./pim-art/index.js";
import { WalkPath } from "./WalkPath.js";


class ActionState {
    /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        throw new Error("Method 'update' must be implemented by subclass.");
    }
}


class LifeCycleState {
    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        throw new NotImplementedError("Method 'init' must be implemented by subclass.");
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        throw new Error("Method 'update' must be implemented by subclass.");
    }
}


class Waiting extends LifeCycleState {
    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        waiter.direction = "front";
        waiter.actionState = new Idle();
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        const event = waiter.scene.art.config.services.eventsManager.next();

        if (event !== undefined) {
            switch (event.data.type) {
                case "order-food":
                    waiter.lifeCycleState = new TakingOrder("food");
                    break;
                case "order-dessert":
                    waiter.lifeCycleState = new TakingOrder("dessert");
                    break;
                case "bill":
                    waiter.lifeCycleState = new TakingOrder("bill");
                    break;
                case "arrive":
                    waiter.lifeCycleState = new Welcoming();
                    break;
                case "order-ready":
                    const order = waiter.scene.orders.find(o => o.id === event.data.orderId);

                    if(order === undefined) {
                        console.error("Order for event order-ready with id " + event.data.orderId + " not found :|||");
                        break;
                    }

                    waiter.lifeCycleState = new Serving(order);
                    break;
            }
        }

    }
}

/**
 * The waiter will walk to the guest, say welcome and then escort them to a table. 
 */
class Welcoming {

    /**
     * @param {Symbol[]} guests
     * @param {{x: number, y: number}} pos
     */
    constructor(guests, pos) {
        this.guests = guests;
        this.pos = pos;
        this.currGoal = "guest"
        this.lastNotifiedIdx = null;
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        waiter.actionState = new Walking(this.pos);
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        switch(this.currGoal) {
            case "guest":
                if(waiter.isWalking()) {
                    if(waiter.actionState.hasReachedGoal()) {
                        waiter.actionState = new Idle();
                        waiter.messageBubble.showMessage(phrases.welcomeGuest(this.guests.length));
                    }
                } else if (waiter.messageBubble.shouldHide()) {
                    
                    const table = this.scene.tables.filter(t => t.isAvailable).random();
                    waiter.messageBubble.hideMessage();
                    waiter.actionState = new Walking(table.pos);
                    this.currGoal = "table";
                }

                break;
            case "table":
                 if(waiter.isWalking()) {

                    /**
                     * 
                     * Waitor börjar gå och man kan hålla koll på pathen hela tiden när den har nått ett snäpp,
                     * sen skickar waiter meddelande tll gästen att den ska börja gå
                     * 
                     * TODO: fixa med waiterns placering så att den ställer sig i ett hörn
                     * TODO: fixca med gästens placeringar enligt bordets palcering. 
                     * 
                     */
                    
                    // Notify the guests to follow the waiter towards the same table
                    if((this.lastNotifiedIdx === null || waiter.actionState.cellCount === this.lastNotifiedIdx - 1) && waiter.actionState.cellCount <= this.guests.length - 1) {
                        this.lastNotifiedIdx = waiter.actionState.cellCount;
                        waiter.scene.art.services.messages.send({data: table.pos}, waiter.id, this.guests[this.lastNotifiedIdx]);
                    }

                    if(waiter.actionState.hasReachedGoal()) {
                        waiter.actionState = new Idle();
                    }

                } else if (waiter.isIdle()) {

                    const guestNotIdle = this.guests.find(g => waiter.scene.objects.find(o => o.id === g).isWalking());

                    if(guestNotIdle === undefined) {
                        waiter.messageBubble.showMessage(phrases.menuComment());
                    }

                    waiter.actionState = new Walking(waiter.scene.idleSpots.filter(i => i.isAvailable).random());
                    this.currGoal = "idle-spot";
                }

                break;
            case "idle-spot":
                if(waiter.isWalking() && waiter.actionState.hasReachedGoal()) {
                      waiter.lifeCycleState = new Waiting();
                } 
                break;
        }
    }
}


class TakingOrder {
     /**
     * @param {"food" | "dessert" | "bill"} type
     * @param {Symbol[]} guests
     * @param {Symbol} table
     */
    constructor(type, guests, tableId) {
        this.type = type;
        this.guests = guests;
        this.hasTakenOrder = false;
        this.order = {id: new Symbol("order"), tableId, orders: []};
        this.orderCount = null;
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        const pos = waiter.scene.tables.find(t => t.id === this.table).pos;
        waiter.actionState = new Walking(pos);
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        if(this.hasTakenOrder) {
            if(waiter.isWalking() && waiter.actionState.hasReachedGoal()) {
                  waiter.lifeCycleState = new Waiting();
            }

        } else {

            if(waiter.isWalking()) {
                if(waiter.actionState.hasReachedGoal()) {
                    waiter.actionState = new Idle();
                    waiter.messageBubble.showMessage(phrases.takingOrder(this.type));
                }
                
            // TODO: mark out dialogs with ids to know what the other person actually said or wich phrase it is

            } else if (waiter.messageBubble.shouldHide()) {
                waiter.messageBubble.hideMessage();
                this.orderCount = 0;
                waiter.scene.art.services.messages.send(phrases.takingOrder(this.type), waiter.id, this.guests[this.orderCount]);
            
            
            } else  {

                const message =  waiter.scene.art.services.messages.receive(waiter.id);

                if(message !== undefined) {

                    this.order.orders.push({guest: message.from, items: message.data});

                    if(this.order.orders.length === this.guests.length) {

                        this.hasTakenOrder = true;

                        waiter.scene.orders.push(this.order);

                        setTimeout(() => {
                            waiter.scene.art.services.events.add({name: "order-ready", data: this.order.id});
                        }, 1000 * 60  * 5);

                        waiter.actionState = new Walking(waiter.scene.idleSpots.filter(i => i.isAvailable).random());
                    } else {
                        waiter.scene.art.services.messages.send(phrases.takingOrder(this.type), waiter.id, this.guests[this.orderCount]);
                        this.orderCount++;
                    }
                }   
            }
        }
    }
}


/**
 * @typedef TableOrder
 * @property {"food" | "dessert"} type
 * @property {Symbol} orderId
 * @property {Symbol} tableId
 * @property {Order[]} orders
 */

/**
 * @typedef Order
 * @property {Symbol} guestId
 * @property {import("./menu.js").MenuItem[]} items
 */

class Serving {

    /**
     * @param {TableOrder} order
     */
    constructor(order) {
        this.order = order;
        this.hasServed = false;
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        // walk to table, stand idle, say here you go, walk away
        const pos = waiter.scene.tables.find(t => t.id === this.order.tableId).pos;
        waiter.actionState = new Walking(pos);
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        if(this.hasServed) {
            if(waiter.isWalking() && waiter.actionState.hasReachedGoal()) {
                waiter.lifeCycleState = new Waiting();
            }
        } else {
            if(waiter.isWalking()) {
                if(waiter.actionState.hasReachedGoal()) {
                    waiter.actionState = new Idle();
                    waiter.messageBubble.showMessage(phrases.givingOrder(this.order.type));
                }
            } else if (waiter.messageBubble.shouldHide()) {
                waiter.messageBubble.hideMessage();

                for(const o of this.order.orders) {
                    waiter.scene.art.services.messages.send({items}, waiter.id, o.guestId); // TODO: dialog id?
                }
          
                this.hasServed = true;
                waiter.actionState = new Walking(waiter.scene.idleSpots.filter(i => i.isFree()).random());
            }
        }
    }
}


class Walking extends ActionState {

    /**
     * @type {{x: number, y: number}}
     */
    goal;

    /**
     * @type {WalkPath?}
     */
    path;

    constructor(goal) {
        this.goal = goal;
        this.path = null;
    }

    /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        
        if (this.path === null) {
            this.path = new WalkPath(waiter, waiter.pos, this.goal);
        }

        this.path.update(waiter);
    }
}


class Idle extends ActionState {
    /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        if (!waiter.animations.isPlaying(`idle-${waiter.direction}`)) {
            waiter.animations.play(`idle-${waiter.direction}`);
        }
    }
}


export default class Waiter extends Sprite {

    /**
     * @type {MessageBubble}
     */
    messageBubble;

    /**
     * @type {LifeCycleState}
     */
    lifeCycleState;

    /**
     * @type {ActionState}
     */
    actionState;


     /**
     * @param {Scene} scene
     * @param {Symbol} id
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string} who
     */
    constructor(scene, id, pos, width, height, who) {
        super(scene, id, pos, width, height);

        this.messageBubble = new MessageBubble();
        this.lifeCycleState = new Waiting();
        this.who = "blond-guy";

        this.animations.create("front", {type: "spritesheet", frames: `waiter-${who}.png`, frameRate: 100, numberOfFrames: 8, startIdx:0 });
        this.animations.create("front-carry", {type: "spritesheet", frames: `waiter-${who}-carry.png`, frameRate: 100, numberOfFrames: 8, startIdx:0 });
        this.animations.create("back",  {type: "spritesheet", frames: `waiter-${who}.png`, frameRate: 100, numberOfFrames: 8, startIdx: 8 });
        this.animations.create("back-carry",  {type: "spritesheet", frames: `waiter-${who}-carry.png`, frameRate: 100, numberOfFrames: 8, startIdx:8 });
        this.animations.create("right",  {type: "spritesheet", frames: `waiter-${who}.png`, frameRate: 100, numberOfFrames: 8, startIdx: 16 });
        this.animations.create("right-carry",  {type: "spritesheet", frames: `waiter-${who}-carry.png`, frameRate: 100, numberOfFrames: 8, startIdx:16 });
        this.animations.create("left",  {type: "spritesheet", frames: `waiter-${who}.png`, frameRate: 100, numberOfFrames: 8, startIdx: 24 });
        this.animations.create("left-carry",  {type: "spritesheet", frames: `waiter-${who}-carry.png`, frameRate: 100, numberOfFrames: 8, startIdx:24 });

    }

    getGridCellPosition() {
        return {row: this.pos.y / this.height, col: this.pos.x / this.width}
    }
    
    isIdle() {
        return this.movingState instanceof Idle;
    }

    isWalking() {
        return this.movingState instanceof Walking;
    }

   update() {
        this.lifeCycleState.update(this);
        this.movingState.update(this);
    }
}