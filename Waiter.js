import GuestGroup from "./GuestGroup.js";
import  { phrases } from "./message.js";
import { MessageBubble } from "./message.js";
import { Sprite } from "./pim-art/index.js";
import Table from "./Table.js";
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
        waiter.direction = "s";
        waiter.actionState = new Idle();
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        const event = waiter.scene.art.config.services.events.next();

        if (event !== undefined) {
            
            console.log("Event received by waiter: ", event);

            switch (event.name) {
                case "order-food":
                    waiter.lifeCycleState = new TakingOrder("food", event.data.guestGroup);
                    break;
                case "order-dessert":
                    waiter.lifeCycleState = new TakingOrder("dessert", event.data.guestGroup);
                    break;
                case "order-bill":
                    waiter.lifeCycleState = new TakingOrder("bill", event.data.guestGroup);
                    break;
                case "arrive":
                    console.log(event.data.guestGroup.guests[0].pos)
                    waiter.lifeCycleState = new Welcoming(event.data.guestGroup, 
                        {
                            x: event.data.guestGroup.guests[0].pos.x + waiter.scene.art.tileSize, 
                            y: event.data.guestGroup.guests[Math.floor(event.data.guestGroup.guests.length / 2)].pos.y
                        }); 
                    break;
                case "order-ready":
                    const order = waiter.scene.orders.find(o => o === event.data.order);

                    if(order === undefined) {
                        console.error("Order for event order-ready with id " + event.data.order.id.toString() + " not found :|||");
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
class Welcoming extends LifeCycleState {

    /**
     * @param {GuestGroup} guestGroup
     */
    constructor(guestGroup) {
        super();
        this.guestGroup = guestGroup;
        this.currGoal = "guest";
        this.lastGuestNotifiedIdx = 0;
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        console.log("Welcoming guests");
        waiter.actionState = new Walking(this.guestGroup.guests[0].pos);
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        switch(this.currGoal) {
            case "guest":
                if(waiter.isWalking()) {
       
                    if(waiter.actionState.path.hasReachedGoal) {
                        waiter.actionState = new Idle();
                        waiter.messageBubble.showMessage(phrases.welcomeGuest(this.guestGroup.guests.length));
                    }

                } else if (waiter.messageBubble.shouldHide()) {

                    const table = waiter.scene.tables.filter(t => t.isAvailable).random();
                    table.isAvailable = false;
                    this.guestGroup.table = table;
                    waiter.messageBubble.hideMessage();
                    waiter.actionState = new Walking(table.corners[1]);
                    this.currGoal = "table";
                }

                break;
            case "table":
                 if(waiter.isWalking()) {

                    if(this.lastGuestNotifiedIdx < this.guestGroup.guests.length && 
                        waiter.actionState.path.getCellCount() !== this.lastGuestNotifiedIdx) {
                 
                        waiter.scene.art.services.messages.send({table: this.guestGroup.table}, waiter.id, this.guestGroup.guests[this.lastGuestNotifiedIdx].id);
                        this.lastGuestNotifiedIdx = waiter.actionState.path.getCellCount();
                       
                    }

                    if(waiter.actionState.path.hasReachedGoal) {
                        waiter.actionState = new Idle();
                    }

                } else if (waiter.isIdle()) {

                    if(this.guestGroup.guests.every(g => g.isIdleSitting())) {
                        waiter.messageBubble.showMessage(phrases.menuComment());
                        waiter.actionState = new Walking(waiter.scene.idleSpots.filter(i => i.isAvailable).random());
                        this.currGoal = "idle-spot";
                    }
                }

                break;
            case "idle-spot":
                if(waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                    waiter.lifeCycleState = new Waiting();
                } 
                break;
        }
    }
}


class TakingOrder extends LifeCycleState {
     /**
     * @param {"food" | "dessert" | "bill"} type
     * @param {GuestGroup} guestGroup
     */
    constructor(type, guestGroup) {
        super();
        this.type = type;
        this.guestGroup = guestGroup;
        this.hasTakenOrder = false;
        this.order = {id: Symbol("order"), guestGroup, orders: []};
        this.orderCount = 0;
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        console.log("TAKING AN ORDER", this.type);
        waiter.actionState = new Walking(this.guestGroup.table.corners[0]);
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        if(this.hasTakenOrder) {
            if(waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                  waiter.lifeCycleState = new Waiting();
            }

        } else {

            if(waiter.isWalking()) {
                if(waiter.actionState.path.hasReachedGoal) {
                    waiter.actionState = new Idle();
                    waiter.messageBubble.showMessage(phrases.takingOrder(this.type));
                }
                
            } else if (waiter.messageBubble.shouldHide()) {

                waiter.messageBubble.hideMessage();

                if(this.type === "bill") {
                    waiter.scene.art.services.messages.send(phrases.takingOrder(this.type), waiter.id, this.guestGroup.guests.find(g => g.lifeCycleState.shouldTakeBill)?.id);
                } else {
                    waiter.scene.art.services.messages.send(phrases.takingOrder(this.type), waiter.id, this.guestGroup.guests[this.orderCount].id);
                }
        
            } else  {

                const message =  waiter.scene.art.services.messages.receive(waiter.id);

                if(message !== undefined) {

                    this.order.orders.push({guestId: message.from, items: message.content.items});

                    if(this.type === "bill" || this.order.orders.length === this.guestGroup.guests.length) {

                        this.hasTakenOrder = true;

                        waiter.scene.orders.push(this.order); 
   
                        // After 5 min the order is ready to pick up 
                        setTimeout(() => {
                            waiter.scene.art.services.events.add({name: "order-ready", data: {order: this.order}});
                        }, 1000 * 5);

                        waiter.actionState = new Walking(waiter.scene.idleSpots.filter(i => i.isAvailable).random());

                    } else {
                        waiter.messageBubble.showMessage(phrases.takingOrder(this.type));
                        this.orderCount++;
                    }
                }   
            }
        }
    }
}


/**
 * @typedef TableOrder
 * @property {"food" | "dessert" | "bill"} type
 * @property {Symbol} id
 * @property {GuestGroup} guestGroup
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
        console.log("Serving");
        waiter.actionState = new Walking(this.order.guestGroup.table.corners[0]);
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        if(this.hasServed) {
            if(waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                waiter.lifeCycleState = new Waiting();
            }

        } else {
            if(waiter.isWalking()) {
                if(waiter.actionState.path.hasReachedGoal) {
                    waiter.actionState = new Idle();
                    waiter.messageBubble.showMessage(phrases.givingOrder(this.order.type));
                }
            } else if (waiter.messageBubble.shouldHide()) {

                waiter.messageBubble.hideMessage();


                // Tell all guests that their order is ready 
                for(const o of this.order.orders) {
                    console.log(o)
                    waiter.scene.art.services.messages.send({items: o.items}, waiter.id, o.guestId); 
                }
          
                this.hasServed = true;
                waiter.actionState = new Walking(waiter.scene.idleSpots.filter(i => i.isAvailable).random());
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
        super();
        this.goal = goal;
        this.path = null;
    }

    /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        if(!waiter.animations.isPlaying(`walk-${waiter.direction}`)) {
            waiter.animations.play(`walk-${waiter.direction}`);
        }
        
        if (this.path === null) {

            this.path = new WalkPath(waiter, this.goal);
        }
        
        this.path.update(waiter);
        waiter.pos = this.path.getPos();
        waiter.animations.update();
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
    #lifeCycleState;

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
        this.#lifeCycleState = new Waiting();
        this.#lifeCycleState.init(this);

        this.animations.create("walk-s", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 4 , loop: true});
        this.animations.create("walk-e", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 8 , loop: true});
        this.animations.create("walk-ne", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 16, loop: true});
        this.animations.create("walk-nw", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true});
        this.animations.create("walk-w", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 24, loop: true});
        this.animations.create("walk-sw", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 28, loop: true});

        this.animations.create("idle-s", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 0 , loop: true});
        this.animations.create("idle-se", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 4 , loop: true});
        this.animations.create("idle-e", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 8 , loop: true});
        this.animations.create("idle-ne", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 12, loop: true });
        this.animations.create("idle-n", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 16, loop: true});
        this.animations.create("idle-nw", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 20, loop: true});
        this.animations.create("idle-w", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 24, loop: true});
        this.animations.create("idle-sw", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 28, loop: true});

        // this.who = "blond-guy";
        // this.animations.create("front", {type: "spritesheet", frames: `waiter-${who}.png`, frameRate: 100, numberOfFrames: 8, startIdx:0 });
        // this.animations.create("front-carry", {type: "spritesheet", frames: `waiter-${who}-carry.png`, frameRate: 100, numberOfFrames: 8, startIdx:0 });
        // this.animations.create("back",  {type: "spritesheet", frames: `waiter-${who}.png`, frameRate: 100, numberOfFrames: 8, startIdx: 8 });
        // this.animations.create("back-carry",  {type: "spritesheet", frames: `waiter-${who}-carry.png`, frameRate: 100, numberOfFrames: 8, startIdx:8 });
        // this.animations.create("right",  {type: "spritesheet", frames: `waiter-${who}.png`, frameRate: 100, numberOfFrames: 8, startIdx: 16 });
        // this.animations.create("right-carry",  {type: "spritesheet", frames: `waiter-${who}-carry.png`, frameRate: 100, numberOfFrames: 8, startIdx:16 });
        // this.animations.create("left",  {type: "spritesheet", frames: `waiter-${who}.png`, frameRate: 100, numberOfFrames: 8, startIdx: 24 });
        // this.animations.create("left-carry",  {type: "spritesheet", frames: `waiter-${who}-carry.png`, frameRate: 100, numberOfFrames: 8, startIdx:24 });

    }

    
    /**
     * @param {LifeCycleState} state
     */
    set lifeCycleState(state) {
        this.#lifeCycleState = state;
        this.#lifeCycleState.init(this);
    }

    getGridCellPosition() {
        return {row: this.pos.y / this.height, col: this.pos.x / this.width}
    }
    
    isIdle() {
        return this.actionState instanceof Idle;
    }

    isWalking() {
        return this.actionState instanceof Walking;
    }

    getGridPos() {
        return {
            col: Math.floor(this.pos.x / this.scene.art.tileSize),
            row: Math.floor(this.pos.y / this.scene.art.tileSize)
        };
    }

   update() {
        this.#lifeCycleState.update(this);
        this.actionState.update(this);
    }
}