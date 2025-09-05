
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

    static LOGGER_TAG = "Waiter Wait";

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
        console.debug(Wait.LOGGER_TAG, "init");

        waiter.direction = "s";
        waiter.actionState = new Idle();
    }

    /**
      * @param {Waiter} waiter 
      */
    update(waiter) {

        const event = waiter.scene.art.config.services.events.next();

        if (event !== undefined) {

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
                        break;
                    }
                case "order-bill":
                    waiter.lifeCycleState = new TakeOrder("bill", event.data.guestGroup);
                    break;
                case "arrive":
                    waiter.lifeCycleState = new Welcome(event.data.guestGroup);
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

    static LOGGER_TAG = "Waiter Welcome";

    /**
     * @param {GuestGroup} guestGroup
     */
    constructor(guestGroup) {
        super();
        this.guestGroup = guestGroup;
        this.currGoal = "guest";
        this.prevNotified = 1000;
        this.notifyGuestIdx = 0;
        this.tableCornerIdx = 1;
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
       console.debug(Welcome.LOGGER_TAG, "init")
        const pos = this.guestGroup.guests.length > 2 ?
            { x: waiter.scene.art.tileSize * 2, y: this.guestGroup.guests[0].pos.y + waiter.scene.art.tileSize } :
            { x: waiter.scene.art.tileSize, y: this.guestGroup.guests[0].pos.y + waiter.scene.art.tileSize }

        console.debug(Welcome.LOGGER_TAG, waiter.scene.grid[Math.floor(pos.y / 16)][Math.floor(pos.x / 16)])
        
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
                    }

                } else if (!waiter.messageBubble.isShowing) {

                    const pos = this.guestGroup.table.getWaiterWelcomePos();
                    waiter.actionState = new Walking(pos);

                    this.currGoal = "table";
                }

                break;
            case "table":
                if (waiter.isWalking()) {
        
                    if (waiter.actionState.path.cellCount === 2 && !this.hasNotifiedFirstGuest) {

                        console.debug(Welcome.LOGGER_TAG, "notifying guest to walk after me");
                                this.hasNotifiedFirstGuest = true
                        waiter.scene.art.services.messages.send({ guestGroup: this.guestGroup }, waiter, this.guestGroup.guests[0]);
   
                    }

                    if (waiter.actionState.path.hasReachedGoal) {
                        waiter.actionState = new Idle();
                        waiter.direction = this.guestGroup.table.cornerDirections[this.tableCornerIdx];
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
                    // console.log("IDLE SPOT START WALKING BACK")
                    waiter.actionState = new Walking(waiter.scene.getIdlePos());
                }

                break;
        }
    }
}


class TakeOrder extends LifeCycleState {

    static LOGGER_TAG = "Waiter TakeOrder";
    /**
    * @param {"food" | "dessert" | "drink" | "bill"} type
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
      console.debug(TakeOrder.LOGGER_TAG, "init");
        this.cornerIdx = Math.floor(Math.random() * this.guestGroup.table.corners.length);
        waiter.actionState = new Walking(this.guestGroup.table.corners[this.cornerIdx]);

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

                    waiter.direction = this.guestGroup.table.cornerDirections[this.cornerIdx];

                    // Send first ask to guest 

                    if (this.type === "bill") {
                        waiter.scene.art.services.messages.send("order plz", waiter, this.guestGroup.guests.find(g => g.lifeCycleState.shouldTakeBill));
                    } else {
                        waiter.scene.art.services.messages.send("order plz", waiter, this.guestGroup.guests[this.orderCount]);
                    }

                }

            }
            else {

                const message = waiter.scene.art.services.messages.receive(waiter);

                if (message !== undefined) {

                    this.tableOrder.guestOrders.push(...message.content.items);
                     
                    
                    if (this.type === "bill" || this.tableOrder.guestOrders.length === this.guestGroup.guests.length * 2) {

                        this.hasTakenOrder = true;

                        this.guestGroup.tableOrder = this.tableOrder; // Set the order inside of the guest group 

                        // After 5 min the order is ready to pick up 
                        setTimeout(() => {
                            waiter.scene.art.services.events.add({ name: "order-ready", data: { guestGroup: this.guestGroup } });
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
     * @param {GuestGroup} guestGroup
     */
    constructor(guestGroup) {
        this.guestGroup = guestGroup;
        /**
         * @type {"kitchen" | "serve" | "idle"}
         */
        this.currGoal = guestGroup.tableOrder.type !== "bill" ? "kitchen" : "serve";
        this.cornerIdx = Math.floor(Math.random() * this.guestGroup.table.corners.length);
    }

    /**
     * @param {Waiter} waiter 
     */
    init(waiter) {
     
    }

    /**
      * @param {Waiter} waiter 
      */
    update(waiter) {
        switch (this.currGoal) {
            case "kitchen":
                if (waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                    this.currGoal = "serve";
                    waiter.actionState = new Walking(this.guestGroup.table.corners[this.cornerIdx], true)
                } else {
                    waiter.actionState = new Walking(waiter.scene.getKitchenPos());
                }

                break;
            case "serve":
                if (waiter.isWalking()) {
                    if (waiter.actionState.path.hasReachedGoal) {
                        waiter.actionState = new Idle();
                        waiter.messageBubble.showMessage(waiter.scene.createSymbol("smiley"), { x: waiter.pos.x, y: waiter.pos.y - waiter.messageBubble.height });
                        waiter.direction = this.guestGroup.table.cornerDirections[this.cornerIdx];
                    }

                } else if (!waiter.messageBubble.isShowing) {
           
                        for (const o of this.guestGroup.tableOrder.guestOrders) {
                        waiter.scene.art.services.messages.send({ order: this.order }, waiter, o.guest);
                        }
                    
                  
                    this.currGoal = "idle";
                    waiter.actionState = new Walking(waiter.scene.getIdlePos());
                } else {
                          waiter.actionState = new Walking(this.guestGroup.table.corners[this.cornerIdx], true)
                }

                break;
            case "idle":
                if (waiter.isWalking() && waiter.actionState.path.hasReachedGoal) {
                    waiter.lifeCycleState = new Wait();
                }
                break;
        }
    }
}

class CleanOrder extends LifeCycleState {
    static LOGGER_TAG = "Waiter CleanOrder";

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
        console.debug(CleanOrder.LOGGER_TAG, "init");
        this.cornerIdx = Math.floor(Math.random() * this.guestGroup.table.corners.length);
        waiter.actionState = new Walking(this.guestGroup.table.corners[this.cornerIdx]);
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
                    waiter.direction = this.guestGroup.table.cornerDirections[this.cornerIdx];
                }

            } else if (!waiter.messageBubble.isShowing) {

                waiter.scene.art.services.messages.send(null, waiter, this.guestGroup.guests);

                this.hasCleanedOrder = true;

                this.guestGroup.tableOrder = null;

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

        if (!waiter.animations.isPlaying(`walk-${waiter.direction}${this.isServing ? "-serve" : ""}`)) {
            waiter.animations.play(`walk-${waiter.direction}${this.isServing ? "-serve" : ""}`);
        }

        if (this.path === null) {
            this.path = new WalkPath(waiter, this.goalPos, Waiter.WALKABLE_TILES);
        }

        this.path.update(waiter);
        waiter.pos = this.path.getPos();
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

    static WALKABLE_TILES = [0, 4];

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
    constructor(scene, id, pos, width, height, who) {
        super(scene, id, pos, width, height);
        this.messageBubble = new MessageBubble(scene);
        this.#lifeCycleState = new Wait();
        this.#lifeCycleState.init(this);
        this.gridPos = { row: Math.floor(this.pos.y / this.scene.art.tileSize), col: Math.floor(this.pos.x / this.scene.art.tileSize)};

        this.animations.create("walk-s", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 4, loop: true });
        this.animations.create("walk-e", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 8, loop: true });
        this.animations.create("walk-ne", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 16, loop: true });
        this.animations.create("walk-nw", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true });
        this.animations.create("walk-w", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 24, loop: true });
        this.animations.create("walk-sw", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 100, numberOfFrames: 4, startIdx: 28, loop: true });

        this.animations.create("walk-s-serve", { type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se-serve", { type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 4, loop: true });
        this.animations.create("walk-e-serve", { type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 8, loop: true });
        this.animations.create("walk-ne-serve", { type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n-serve", { type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 16, loop: true });
        this.animations.create("walk-nw-serve", { type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true });
        this.animations.create("walk-w-serve", { type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 24, loop: true });
        this.animations.create("walk-sw-serve", { type: "spritesheet", frames: "waiter-afro-walk-serve", frameRate: 100, numberOfFrames: 4, startIdx: 28, loop: true });

        this.animations.create("idle-s", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 0, loop: true });
        this.animations.create("idle-se", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 4, loop: true });
        this.animations.create("idle-e", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 8, loop: true });
        this.animations.create("idle-ne", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 12, loop: true });
        this.animations.create("idle-n", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 16, loop: true });
        this.animations.create("idle-nw", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 20, loop: true });
        this.animations.create("idle-w", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 24, loop: true });
        this.animations.create("idle-sw", { type: "spritesheet", frames: "waiter-afro-walk", frameRate: 250, numberOfFrames: 1, startIdx: 28, loop: true });

    }

    get actionState() {
        return this.#actionState;
    }

    /**
     * @param {ActionState} state
     */
    set actionState(state) {
        this.#actionState = state;
        this.#actionState.init(this);
    }

    /**
     * @param {LifeCycleState} state
     */
    set lifeCycleState(state) {
        this.#lifeCycleState = state;
        this.#lifeCycleState.init(this);
    }

    isIdle() {
        return this.#actionState instanceof Idle;
    }

    isWalking() {
        return this.#actionState instanceof Walking;
    }

    update() {
        
        const gridPos = { row: Math.floor(this.pos.y / this.scene.art.tileSize), col: Math.floor(this.pos.x / this.scene.art.tileSize)};
        this.scene.grid[this.gridPos.row][this.gridPos.col] = this.prevGridValue ?? 0;
        if(!(this.gridPos.row === gridPos.row && this.gridPos.col === gridPos.col)) {
            
           this.scene.grid[this.gridPos.row][this.gridPos.col] = 0;
            this.prevGridValue = this.scene.grid[this.gridPos.row][this.gridPos.col];
            this.gridPos = gridPos;
            this.scene.grid[this.gridPos.row][this.gridPos.col] = this.id;
      
        }

        this.animations.update();
        this.#lifeCycleState.update(this);
        this.#actionState.update(this);
    }
}