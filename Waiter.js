
import GuestGroup from "./GuestGroup.js";
import { MessageBubble } from "./message.js";
import { Sprite } from "./pim-art/index.js";
import Play from "./Play.js";
import TableOrder from "./TableOrder.js";
import { WalkPath } from "./WalkPath.js";
import { debug } from "./index.js";

class ActionState {
    /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        throw new Error("Method 'update' must be implemented by subclass.");
    }

     /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
    
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

    static LOGGER_TAG = "Wait";

    constructor() {
        super();
        debug(Wait.LOGGER_TAG, "constructor");
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        debug(Wait.LOGGER_TAG, "init");
        waiter.pos = waiter.idlePos;
        waiter.actionState = new Idle();
        waiter.direction = "s";

    }

    /**
      * @param {Waiter} waiter 
      */
    update(waiter) {

        const event = waiter.scene.art.config.services.events.next();

        if (event !== undefined) {
            debug(Wait.LOGGER_TAG, "received event", event);

            switch (event.name) {
                case "order-food":
                    waiter.lifeCycleState = new TakeOrder("food", event.data.guestGroup);
                    break;
                case "order-dessert":
                    waiter.lifeCycleState = new TakeOrder("dessert", event.data.guestGroup);
                    break;
                case "order-done":
                    waiter.lifeCycleState = new CleanOrder(event.data.guestGroup);
                    break;
                case "bill":
                    waiter.lifeCycleState = new BillRequest(event.data.guestGroup);
                    break;
                case "arrive":
                    waiter.lifeCycleState = new Welcome(event.data.guestGroup);
                    break;
                case "bill-ready":
                    waiter.lifeCycleState = new GiveBill(event.data.guestGroup);
                    break;
                case "order-ready":
                    waiter.lifeCycleState = new ServeOrder(event.data.guestGroup);
                    break;
            }
        }
    }
}

/**
 * The waiter will walk to the guest, say welcome and then escort them to a table. 
 */
class Welcome extends LifeCycleState {

    static LOGGER_TAG = "Welcome";

    /**
     * @param {GuestGroup} guestGroup
     */
    constructor(guestGroup) {
        super();
        this.guestGroup = guestGroup;
        this.currGoal = "guest";
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
    const pos = { x: waiter.scene.art.tileSize * 2, y: waiter.scene.art.tileSize * 7  } 
    waiter.actionState = new Walking(pos);
    }

    /**
      * @param {Waiter} waiter 
      */
    update(waiter) {

        switch (this.currGoal) {
            case "guest":
                if (waiter.isWalking()) {

                    if (waiter.actionState.path.hasReachedGoal) {
                        this.guestGroup.waiterIsHere();
                        waiter.actionState = new Idle();
                        waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley"), { x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height });
                        waiter.direction = "w";
                    }

                } else if (!waiter.messageBubble.isShowing) {

                    this.corner = this.guestGroup.table.getWaiterWelcomeCorner();
                    waiter.actionState = new Walking(this.corner.pos);

                    this.currGoal = "table";
                }

                break;
            case "table":
                if (waiter.isWalking()) {
        
                    if (waiter.actionState.path.cellCount === 2 && !this.hasNotifiedFirstGuest) {

                        debug(Welcome.LOGGER_TAG, "notifying guest to walk after me");
                                this.hasNotifiedFirstGuest = true;

                        waiter.scene.art.services.messages.send({ guestGroup: this.guestGroup }, waiter, this.guestGroup.guests[0]);
   
                    }

                    if (waiter.actionState.path.hasReachedGoal) {
                        waiter.actionState = new Idle();
                        waiter.direction = this.corner.direction;
                    }

                } else if (waiter.isIdle()) {


                    if (this.guestGroup.guests.every(g => g.isIdleSitting())) {
                        waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley"), { x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height });
                        this.currGoal = "idle-spot";
                    }
                }

                break;
            case "idle-spot":
                if (waiter.isWalking()) {
                    if (waiter.actionState.path.hasReachedGoal) {
                        waiter.lifeCycleState = new Wait();
                    }

                } else if (!waiter.messageBubble.isShowing) {
                    waiter.actionState = new Walking(waiter.idlePos);
                }

                break;
        }
    }
}


class BillRequest extends LifeCycleState {

    static LOGGER_TAG = "BillRequest";

    /**
    * @param {GuestGroup} guestGroup
    */
    constructor(guestGroup) {
        
        super();

        this.guestGroup = guestGroup;
        this.hasAskedForBill = false;
        debug(BillRequest.LOGGER_TAG, "constructor");
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        debug(BillRequest.LOGGER_TAG, "init");
        this.corner = this.guestGroup.table.getWaiterCorner(waiter);
        waiter.actionState = new Walking(this.corner.pos);
    }

    /**
      * @param {Waiter} waiter 
      */
    update(waiter) {
        if(!this.hasAskedForBill) {
            if (waiter.isWalking()) {
                if (waiter.actionState.path.hasReachedGoal) {
                    waiter.actionState = new Idle();
                    waiter.direction = this.corner.direction;
                    waiter.messageBubble.showMessage(waiter.scene.createSymbol("question"), { x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height }, 10000);
                    this.guestGroup.waiterIsHere();
                    waiter.scene.art.services.messages.send("bill", waiter, this.guestGroup.guests.find(g => g.lifeCycleState.shouldPay));
                }

            }  else {

                const message = waiter.scene.art.services.messages.receive(waiter);

                if (message !== undefined) {

                    setTimeout(() => {
                        waiter.scene.art.services.events.add({ name: "bill-ready", data: { guestGroup: this.guestGroup } });
                    }, 1000 * 60);

                    waiter.actionState = new Walking(waiter.idlePos);
                    waiter.messageBubble.isShowing = false;
                    this.hasAskedForBill = true;
                }
            }

        } else {
            if (waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                waiter.lifeCycleState = new Wait();
            }
        }
     }
}

class GiveBill extends LifeCycleState {

    static LOGGER_TAG = "GiveBill"
    
    /**
     * @param {GuestGroup} guestGroup
     */
    constructor(guestGroup) {
        super();
        this.guestGroup = guestGroup;
        this.hasGivenBill = false;
        debug(GiveBill.LOGGER_TAG, "constructor");
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        debug(GiveBill.LOGGER_TAG, "init");
        this.corner = this.guestGroup.table.getWaiterCorner(waiter);
        waiter.actionState = new Walking(this.corner.pos)
    }

    /**
      * @param {Waiter} waiter 
      */
    update(waiter) {
        if(this.hasGivenBill) {
             if (waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                    debug(GiveBill.LOGGER_TAG, "done");
                    waiter.lifeCycleState = new Wait();
            }
        } else {
            if (waiter.isWalking()) {
                if (waiter.actionState.path.hasReachedGoal) {
                    waiter.actionState = new Idle();
                    waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley"), { x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height });
                    waiter.direction = this.corner.direction;
                }

            } else if (!waiter.messageBubble.isShowing) {
                debug(GiveBill.LOGGER_TAG, "idle");
                waiter.scene.art.services.messages.send("bill", waiter, this.guestGroup.guests.find(g => g.lifeCycleState.shouldPay));
                this.currGoal = "idle";
                waiter.actionState = new Walking(waiter.idlePos);
                this.hasGivenBill = true;
            }

        
        }
    }
}


class TakeOrder extends LifeCycleState {

    static LOGGER_TAG = "TakeOrder";
    /**
    * @param {"food" | "dessert"} type
    * @param {GuestGroup} guestGroup
    */
    constructor(type, guestGroup) {
        super();
        this.type = type;
        this.guestGroup = guestGroup;
        this.hasTakenOrder = false;
        this.tableOrder = new TableOrder(type);
        this.orderCount = 0;
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
      debug(TakeOrder.LOGGER_TAG, "init");
        this.corner = this.guestGroup.table.getWaiterCorner(waiter);
        waiter.actionState = new Walking(this.corner.pos);
    }

    /**
      * @param {Waiter} waiter 
      */
    update(waiter) {

        if (this.hasTakenOrder) {
            if (waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                waiter.lifeCycleState = new Wait();
            }
        } else {

            if (waiter.isWalking()) {
                if (waiter.actionState.path.hasReachedGoal) {
                    waiter.actionState = new Idle();
                    waiter.messageBubble.showMessage(waiter.scene.createSymbol("question"), { x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height }, 10000);
                    this.guestGroup.waiterIsHere();

                    waiter.direction = this.corner.direction;

                    waiter.scene.art.services.messages.send("order plz", waiter, this.guestGroup.guests[this.orderCount]);
                }
            }
            else {

                const message = waiter.scene.art.services.messages.receive(waiter);

                if (message !== undefined) {

                    this.tableOrder.guestOrders.push(...message.content.items);
                     
                    if (this.tableOrder.guestOrders.length === this.guestGroup.guests.length * 2) {

                        this.hasTakenOrder = true;

                        this.guestGroup.tableOrder = this.tableOrder; // Set the order inside of the guest group 

                        setTimeout(() => {
                            waiter.scene.art.services.events.add({ name: "order-ready", data: { guestGroup: this.guestGroup } });
                        }, 1000 * 60);

                        waiter.actionState = new Walking(waiter.idlePos);
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
    static LOGGER_TAG = "Waiter ServerOrder"
    /**
     * @param {GuestGroup} guestGroup
     */
    constructor(guestGroup) {
        this.guestGroup = guestGroup;
        /**
         * @type {"kitchen" | "serve" | "idle"}
         */
        this.currGoal = guestGroup.tableOrder.type !== "bill" ? "kitchen" : "serve";
        debug(ServeOrder.LOGGER_TAG, "constructor", guestGroup, this.currGoal);
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        debug(ServeOrder.LOGGER_TAG, "init");

        this.corner = this.guestGroup.table.getWaiterCorner(waiter);

        // Start walking to kitchen (to get order) or to the table (to directly serve the bill)
        if(this.currGoal === "kitchen") {
            debug(ServeOrder.LOGGER_TAG, "to kitchen");
            waiter.actionState = new Walking(waiter.kitchenPos);
        } else if (this.currGoal === "serve") {
            debug(ServeOrder.LOGGER_TAG, "serve");
            waiter.actionState = new Walking(this.corner.pos, true)
        } else {
            // Should never happen.
        }
    }

    /**
      * @param {Waiter} waiter 
      */
    update(waiter) {
        switch (this.currGoal) {
            case "kitchen":
                if (waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                    debug(ServeOrder.LOGGER_TAG, "serve");
                    this.currGoal = "serve";
                    waiter.actionState = new Walking(this.corner.pos, true);
                } 

                break;
            case "serve":

                if (waiter.isWalking()) {
                    if (waiter.actionState.path.hasReachedGoal) {
                        waiter.actionState = new Idle();
                        waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley"), { x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height });
                        waiter.direction = this.corner.direction;
                    }

                } else if (!waiter.messageBubble.isShowing) {

                    if(this.guestGroup.tableOrder.type === "bill") {
               
                    } else {
                        for (const o of this.guestGroup.tableOrder.guestOrders) {
                          waiter.scene.art.services.messages.send(this.guestGroup.tableOrder.type, waiter, o.guest);
                        }
                    }
           

                    debug(ServeOrder.LOGGER_TAG, "idle");
                    this.currGoal = "idle";
                    waiter.actionState = new Walking(waiter.idlePos);
                }

                break;
            case "idle":
                if (waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                    debug(ServeOrder.LOGGER_TAG, "done");
                    waiter.lifeCycleState = new Wait();
                }
                break;
        }
    }
}

class CleanOrder extends LifeCycleState {
    static LOGGER_TAG = "CleanOrder";

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
        debug(CleanOrder.LOGGER_TAG, "init");
        this.corner = this.guestGroup.table.getWaiterCorner(waiter);
        waiter.actionState = new Walking(this.corner.pos);
    }

    /**
     * @param {Waiter} waiter 
     */
    update(waiter) {
        if (this.hasCleanedOrder) {

            if (waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                waiter.lifeCycleState = new Wait();
            }

        } else {
            if (waiter.isWalking()) {

                if (waiter.actionState.path.hasReachedGoal) {
                    waiter.actionState = new Idle();
                    waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley"), { x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height });
                    waiter.direction = this.corner.direction;
         
                }

            } else if (!waiter.messageBubble.isShowing) {

                waiter.scene.art.services.messages.send(null, waiter, this.guestGroup.guests);

                this.hasCleanedOrder = true;

                this.guestGroup.tableOrder = null;

                waiter.actionState = new Walking(waiter.idlePos);
            }
        }
    }
}



class Walking extends ActionState {
    static LOGGER_TAG = "Walking";
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

        if (!waiter.animations.isPlaying(`walk-${waiter.direction}${this.isServing ? "-serve" : ""}`)) {
            waiter.animations.play(`walk-${waiter.direction}${this.isServing ? "-serve" : ""}`);
        }

        if (this.path === null) {
            this.path = new WalkPath(waiter, this.goalPos);
        }

        this.path.update(waiter);
        waiter.pos = this.path.getPos();
    }
}


class Idle extends ActionState {

    static LOGGER_TAG = "Idle";

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

    static LOGGER_TAG = "Waiter"

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
    #actionState;


    /**
    * @param {Play} scene
    * @param {Symbol} id
    * @param {{ x: number, y: number }} pos
    * @param {number} width
    * @param {number} height
    * @param {string} who
    */
    constructor(scene, id, pos, width, height, who, idlePos, kitchenPos) {
        super(scene, id, pos, width, height);

        this.idlePos = idlePos;
        this.kitchenPos = kitchenPos;

        this.messageBubble = new MessageBubble(this.scene);
        this.lifeCycleState = new Wait();

        this.gridPos = null;
        

        this.animations.create("walk-s", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 4, loop: true });
        this.animations.create("walk-e", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 8, loop: true });
        this.animations.create("walk-ne", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 16, loop: true });
        this.animations.create("walk-nw", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true });
        this.animations.create("walk-w", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 24, loop: true });
        this.animations.create("walk-sw", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 28, loop: true });

        this.animations.create("walk-s-serve", { type: "spritesheet", frames: `waiter-${who}-walk-serve`, frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se-serve", { type: "spritesheet", frames: `waiter-${who}-walk-serve`, frameRate: 100, numberOfFrames: 4, startIdx: 4, loop: true });
        this.animations.create("walk-e-serve", { type: "spritesheet", frames: `waiter-${who}-walk-serve`, frameRate: 100, numberOfFrames: 4, startIdx: 8, loop: true });
        this.animations.create("walk-ne-serve", { type: "spritesheet", frames: `waiter-${who}-walk-serve`, frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n-serve", { type: "spritesheet", frames: `waiter-${who}-walk-serve`, frameRate: 100, numberOfFrames: 4, startIdx: 16, loop: true });
        this.animations.create("walk-nw-serve", { type: "spritesheet", frames: `waiter-${who}-walk-serve`, frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true });
        this.animations.create("walk-w-serve", { type: "spritesheet", frames: `waiter-${who}-walk-serve`, frameRate: 100, numberOfFrames: 4, startIdx: 24, loop: true });
        this.animations.create("walk-sw-serve", { type: "spritesheet", frames: `waiter-${who}-walk-serve`, frameRate: 100, numberOfFrames: 4, startIdx: 28, loop: true });

        this.animations.create("idle-s", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 0, loop: true });
        this.animations.create("idle-se", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 4, loop: true });
        this.animations.create("idle-e", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 8, loop: true });
        this.animations.create("idle-ne", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 12, loop: true });
        this.animations.create("idle-n", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 16, loop: true });
        this.animations.create("idle-nw", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 20, loop: true });
        this.animations.create("idle-w", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 24, loop: true });
        this.animations.create("idle-sw", { type: "spritesheet", frames: `waiter-${who}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 28, loop: true });

    }

    get actionState() {
        return this.#actionState;
    }

    /**
     * @param {ActionState} state
     */
    set actionState(state) {
        this.#actionState = state;
        debug(this.#actionState.constructor.LOGGER_TAG, "init");
        this.#actionState.init(this);
    }

    /**
     * @param {LifeCycleState} state
     */
    set lifeCycleState(state) {
        this.#lifeCycleState = state;
        debug(this.#lifeCycleState.constructor.LOGGER_TAG, "init");
        this.#lifeCycleState.init(this);
    }

    isIdle() {
        return this.#actionState instanceof Idle;
    }

    isWalking() {
        return this.#actionState instanceof Walking;
    }

    update() {
        
        this.animations.update();
        this.#lifeCycleState.update(this);
        this.#actionState.update(this);

        const gridPos = { row: Math.floor(this.pos.y / this.scene.art.tileSize), col: Math.floor(this.pos.x / this.scene.art.tileSize)};
        
        if(this.gridPos === null || !(this.gridPos.row === gridPos.row && this.gridPos.col === gridPos.col)) {


            if(this.gridPos !== null && this.scene.grid[this.gridPos.row][this.gridPos.col] === this.id) {
                this.scene.grid[this.gridPos.row][this.gridPos.col] = 2; // Set previous cell to cool down
            }
            
            this.gridPos = gridPos; // Update grid pos 
            if(this.scene.grid[gridPos.row][gridPos.col] === 0) {
                this.scene.grid[this.gridPos.row][this.gridPos.col] = this.id; // occupy this grid pos
            }
        
        }
        
    }
}