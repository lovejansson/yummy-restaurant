import Guest from "./Guest.js";
import GuestGroup from "./GuestGroup.js";
import { MessageBubble } from "./message.js";
import { Sprite } from "./pim-art/index.js";
import Play from "./Play.js";
import TableOrder from "./TableOrder.js";
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

class Wait extends LifeCycleState {
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
            
            // console.log("Event received by waiter: ", event);

            switch (event.name) {
                case "order-food":
                    waiter.lifeCycleState = new TakeOrder("food", event.data.guestGroup);
                    break;
                case "order-dessert":
                    waiter.lifeCycleState = new TakeOrder("dessert", event.data.guestGroup);
                    break;
                 case "order-done":
                    {  
                    waiter.lifeCycleState = new CleanOrder(event.data.guestGroup);
                    break;}
                case "order-bill":
                    waiter.lifeCycleState = new TakeOrder("bill", event.data.guestGroup);
                    break;
                case "arrive":
                    waiter.lifeCycleState = new Welcome(event.data.guestGroup); 
                    break;
                case "order-ready":
                    waiter.lifeCycleState = new ServeOrder(event.data.order);
                    break;
            }
        }
    }
}

/**
 * The waiter will walk to the guest, say welcome and then escort them to a table. 
 */
class Welcome extends LifeCycleState {

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
        // console.log("Welcoming guests");
   
        const pos = this.guestGroup.guests.length > 2 ? 
        {x: waiter.scene.art.tileSize * 2, y: this.guestGroup.guests[0].pos.y + waiter.scene.art.tileSize} : 
        {x: waiter.scene.art.tileSize, y: this.guestGroup.guests[0].pos.y + waiter.scene.art.tileSize} 
        waiter.actionState = new Walking(pos);
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        switch(this.currGoal) {
            case "guest":
                if(waiter.isWalking()) {
       
                    if(waiter.actionState.path.hasReachedGoal) {
                        this.guestGroup.waiterIsHere();
                        waiter.actionState = new Idle();
                        waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley"), {x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height});
                    }

                } else if (!waiter.messageBubble.isShowing) {

                    waiter.scene.pickTableForGuests(this.guestGroup);
                    // console.log("2");
                    
                    this.cornerIdx = Math.floor(Math.random() * this.guestGroup.table.corners.length);
                
                    waiter.actionState = new Walking(this.guestGroup.table.corners[this.cornerIdx]);
                    this.currGoal = "table";
                }

                break;
            case "table":
                 if(waiter.isWalking()) {

                    // The waiter will notify the guests one by one to follow them for each tile they pass
                    if(this.lastGuestNotifiedIdx < this.guestGroup.guests.length && 
                        waiter.actionState.path.getCellCount() !== this.lastGuestNotifiedIdx) {
                        waiter.scene.art.services.messages.send({table: this.guestGroup.table}, waiter, this.guestGroup.guests[this.lastGuestNotifiedIdx]);
                        this.lastGuestNotifiedIdx = waiter.actionState.path.getCellCount();
                    }

                    if(waiter.actionState.path.hasReachedGoal) {
                        waiter.actionState = new Idle();
                        waiter.direction = this.guestGroup.table.cornerDirections[this.cornerIdx];

                    }

                } else if (waiter.isIdle()) {

                    if(this.guestGroup.guests.every(g => g.isIdleSitting())) {
                        waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley"), {x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height});
                        this.currGoal = "idle-spot";
                    }
                }

                break;
            case "idle-spot":
                if(waiter.isWalking()) {
                    if(waiter.actionState.path.hasReachedGoal) {
                        waiter.lifeCycleState = new Wait();
                    }

                } else if(!waiter.messageBubble.isShowing) {
                    // console.log("IDLE SPOT START WALKING BACK")
                    waiter.actionState = new Walking(waiter.scene.getIdlePos());
                }
     
                break;
        }
    }
}


class TakeOrder extends LifeCycleState {
     /**
     * @param {"food" | "dessert" | "drink" | "bill"} type
     * @param {GuestGroup} guestGroup
     */
    constructor(type, guestGroup) {
        super();
        this.type = type;
        this.guestGroup = guestGroup;
        this.hasTakenOrder = false;
        this.tableOrder = new TableOrder(type, guestGroup);
        this.orderCount = 0;
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {

        // console.log("TAKING AN ORDER", this.type);
        this.cornerIdx = Math.floor(Math.random() * this.guestGroup.table.corners.length);
        waiter.actionState = new Walking(this.guestGroup.table.corners[  this.cornerIdx ]);

    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        if(this.hasTakenOrder) {
            if(waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                  waiter.lifeCycleState = new Wait();
            }

        } else {

            if(waiter.isWalking()) {
                if(waiter.actionState.path.hasReachedGoal) {
                    waiter.actionState = new Idle();
                    waiter.messageBubble.showMessage(waiter.scene.createSymbol("question"), {x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height}, 10000);
                    this.guestGroup.waiterIsHere();

                    waiter.direction = this.guestGroup.table.cornerDirections[this.cornerIdx];

                    // Send first ask to guest 

                    if(this.type === "bill") {
                        console.dir(this.guestGroup.guests)
                        // console.log("BILL TO", this.guestGroup.guests.find(g => g.lifeCycleState.shouldTakeBill)?.id)
                        waiter.scene.art.services.messages.send("order plz", waiter, this.guestGroup.guests.find(g => g.lifeCycleState.shouldTakeBill));
                    } else {
                        waiter.scene.art.services.messages.send("order plz", waiter, this.guestGroup.guests[this.orderCount]);
                    }
        
                }

            }
             else  {

                const message =  waiter.scene.art.services.messages.receive(waiter);

                if(message !== undefined) {


                    this.tableOrder.guestOrders.push({guest: message.from, items: message.content.items});

                    if(this.type === "bill" || this.tableOrder.guestOrders.length === this.guestGroup.guests.length) {

                        this.hasTakenOrder = true;

                        waiter.scene.orders.push(this.tableOrder); 
   
                        // After 5 min the order is ready to pick up 
                        setTimeout(() => {
                            waiter.scene.art.services.events.add({name: "order-ready", data: {order: this.tableOrder}});
                        }, 1000 * 5);

                        waiter.actionState = new Walking(waiter.scene.getIdlePos());
                        waiter.messageBubble.isShowing = false;

                    } else {
                        this.orderCount++;
                        // Send ask to next guest
                        waiter.scene.art.services.messages.send("order plz", waiter, this.guestGroup.guests[this.orderCount]);
                       
                    }
                }   
            }
        }
    }
}


class ServeOrder {
    /**
     * @param {TableOrder} order
     */
    constructor(order) {
        this.order = order;
        /**
         * @type {"kitchen" | "serve" | "idle"}
         */
        this.currGoal = "kitchen";
        this.cornerIdx = Math.floor(Math.random() * this.order.guestGroup.table.corners.length);
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        console.log("Serving");
        waiter.actionState = new Walking(waiter.scene.getKitchenPos());
    }

   /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        switch(this.currGoal) {
            case "kitchen":
                if(waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                    this.currGoal = "serve";
                    waiter.actionState = new Walking(this.order.guestGroup.table.corners[this.cornerIdx], true)
                }

                break;
            case "serve":
                if(waiter.isWalking()) {
                    if(waiter.actionState.path.hasReachedGoal) {
                        waiter.actionState = new Idle();
                        waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley") ,{x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height});
                        waiter.direction = this.order.guestGroup.table.cornerDirections[this.cornerIdx];
                    }
                    
                } else if (!waiter.messageBubble.isShowing) {
                    for(const o of this.order.guestOrders) {
                        waiter.scene.art.services.messages.send({order: this.order}, waiter, o.guest); 
                    }

                    this.order.isServed = true;
        
                    this.currGoal = "idle";
                    waiter.actionState = new Walking(waiter.scene.getIdlePos());
                }

                break;
            case "idle":
                   if(waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                        waiter.lifeCycleState = new Wait();
                    }
                break;
        }
    }
}

class CleanOrder extends LifeCycleState {
    /**
     * @param {GuestGroup} guestGroup
     */
    constructor(guestGroup) {
        super()
        this.guestGroup = guestGroup;
        this.hasCleanedOrder = false;
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        // console.log("CleanTableOrder");
        this.cornerIdx = Math.floor(Math.random() * this.guestGroup.table.corners.length);
        waiter.actionState = new Walking(this.guestGroup.table.corners[this.cornerIdx]);
    }

    /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        if(this.hasCleanedOrder) {

            if(waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                waiter.lifeCycleState = new Wait();
            }

        } else {
            if(waiter.isWalking()) {

                if(waiter.actionState.path.hasReachedGoal) {
                    waiter.actionState = new Idle();
                    waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley") ,{x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height});
                    waiter.direction = this.guestGroup.table.cornerDirections[this.cornerIdx];
                }
                 
            } else if (!waiter.messageBubble.isShowing) {

                waiter.scene.art.services.messages.send(null, waiter,  this.guestGroup.guests); 
                
                this.hasCleanedOrder = true;

                waiter.scene.removeOrder(waiter.scene.getOrderFor(this.guestGroup));

                waiter.actionState = new Walking(waiter.scene.getIdlePos());
            }
        }
    }
}



class Walking extends ActionState {

    /**
     * @type {{x: number, y: number}}
     */
    goalPos;

    /**
     * @type {WalkPath?}
     */
    path;

    constructor(goalPos, isServing = false) {
        super();
        this.goalPos = goalPos;
        this.path = null;
        this.isServing = isServing;
    }

    /**
     * @param {Waiter} waiter 
     */
    update(waiter) {

        if(!waiter.animations.isPlaying(`walk-${waiter.direction}${this.isServing ? "-serve" : ""}`)) {
            waiter.animations.play(`walk-${waiter.direction}${this.isServing ? "-serve" : ""}`);
        }
        
        if (this.path === null) {
            this.path = new WalkPath(waiter, this.goalPos);
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
     * @param {Play} scene
     * @param {Symbol} id
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string} who
     */
    constructor(scene, id, pos, width, height, who) {
        super(scene, id, pos, width, height);
        this.messageBubble = new MessageBubble(scene);
        this.#lifeCycleState = new Wait();
        this.#lifeCycleState.init(this);

        this.animations.create("walk-s", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 4 , loop: true});
        this.animations.create("walk-e", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 8 , loop: true});
        this.animations.create("walk-ne", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 16, loop: true});
        this.animations.create("walk-nw", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true});
        this.animations.create("walk-w", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 24, loop: true});
        this.animations.create("walk-sw", {type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 28, loop: true});

        this.animations.create("walk-s-serve", {type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se-serve", {type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 4 , loop: true});
        this.animations.create("walk-e-serve", {type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 8 , loop: true});
        this.animations.create("walk-ne-serve", {type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n-serve", {type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 16, loop: true});
        this.animations.create("walk-nw-serve", {type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true});
        this.animations.create("walk-w-serve", {type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 24, loop: true});
        this.animations.create("walk-sw-serve", {type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 28, loop: true});

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