import { menu } from "./menu.js";
import { MessageBubble } from "./message.js";
import { NotImplementedError } from "./pim-art/errors.js";
import { Sprite } from "./pim-art/index.js";
import { WalkPath } from "./WalkPath.js";

/**
 * @typedef {"n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"} Direction
 */

class ActionState {

    /**
     * @param {Guest} guest 
     */
    init(guest) {

    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
      
    }
}

class LifeCycleState {

    constructor() {
        this.isDone = false;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        throw new NotImplementedError("Method 'init' must be implemented by subclass.");
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        throw new NotImplementedError("Method 'update' must be implemented by subclass.");
    }
}


/**
 * The arriving state is when the guest is first spawned. At first they are waiting for a waiter at a specific spot. 
 * After the waiter has greeted them they will be escorted to a table. When they arrive at the table they 
 * are transitioning into the ordering state.
 */
export class Arrive extends LifeCycleState {

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.direction = "e";
        guest.actionState = new IdleStanding();
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) { 

        if(!this.isDone) {
            if (guest.isIdleStanding()) {
                
                const message = guest.scene.art.services.messages.receive(guest.id);
            
                // waiter signals to follow them to a table
                if (message !== undefined) { 
                    guest.actionState = new Walking(message.content.table.corners[guest.tableSide]); 
                }   

            } else if (guest.isWalking()) {
                if (guest.actionState.path.hasReachedGoal) {
                    console.log(guest.pos);
                    console.log("Reached goal, sitting down");
            
                    guest.actionState = new SittingDown();
                }
            } else if (guest.isIdleSitting()) {
                console.log("IS DONE GUEST")
                this.isDone = true;
            }
        }
    }
}


class Eating extends ActionState {
    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.animations.play("eat-" + guest.direction);
    }
}


class Drinking extends ActionState {
   
    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.animations.play("drink-" + guest.direction);
    }
}

export class EatAndDrink extends LifeCycleState {

    /**
     * 
     * @param {"food" | "dessert"} type 
     */
    constructor(type) {
        super();
        this.type = type;
        this.isDone = false;
        this.switchAction = false;
    }

    init(guest) {

        guest.actionState = new Eating(guest.direction);

        setTimeout(() => {
            this.isDone = true;
        }, 1000 * 5);

        // Will eat for 5 min

        setInterval(() => {
            this.switchAction = true;
        }, 1000 * 15); 

    }
       
    /**
     * @param {Guest} guest 
     */
    update(guest) {

        console.log("GEST EATING AND DRINKING UPDATE", guest.id, this.isDone, this.switchAction);

        if (!this.isDone && this.switchAction) {

            if (guest.isEating()) {
                guest.actionState = new Drinking();
            } else {
                guest.actionState = new Eating();
            }

            this.switchAction = false;
        }
    }
}

export class ReceiveOrder extends LifeCycleState {
    /**
     * @param {"drink" | "food" | "dessert" | "bill"} type 
     * @param {boolean} shouldTakeBill
     */
    constructor(type, shouldTakeBill) {
        super();

        this.type = type;
        this.shouldTakeBill = shouldTakeBill;
    }

    init(guest) {
        guest.actionState = new IdleSitting();
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if(!this.isDone) {
            if(["drink", "food", "dessert"].includes(this.type) || this.shouldTakeBill) {
                console.log("WAITING FOR MESSAGE FROM WEAITER")
                // Waiter says something when guest is receiving the order
                const message = guest.scene.art.services.messages.receive(guest.id);

                if (message !== undefined) {

                    this.waiterId = message.from;
                    // Show heart as thank you
                    guest.messageBubble.showMessage(guest.scene.symbols.heart, {x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height});

                    this.isDone = true;
                }
                        
            } else {
                const group = guest.scene.getGroupFor(guest);

                // Get isDone for the apointed bill taker
                this.isDone = group.guests.find(g => g.lifeCycleState.shouldTakeBill)?.lifeCycleState.isDone;

            }
        }
    }
}

/**
 * When the guest wants to order something they first sit and wait for the waiter to arrive and 
 * then the ordering conversation begins. 
 */
export class Order extends LifeCycleState {

    /**
     * @param {"food" | "dessert" | "bill"} type 
     */
    constructor(type, shouldTakeBill) {
        super();
        this.type = type;
        this.waiterId = null;
        this.shouldTakeBill = shouldTakeBill;
    }

    init(guest) {
        console.log("INIT ORDER");
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if(!this.isDone) {
            if(["drink", "food", "dessert"].includes(this.type) || this.shouldTakeBill) {

                if(this.waiterId === null) {
                    // Waiter asks this guest for the order 
                    const message = guest.scene.art.services.messages.receive(guest.id);

            
                    if (message !== undefined) {
                        console.log("GOT MESSAGE FROM WAITER")
                        if(this.type === "bill") {
                            // Showing message bubble width dollar sign
                            guest.messageBubble.showMessage(guest.scene.symbols.heart, {x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height});

                        }  else {
                            console.log("SHOWING MESSAGE BUBBLE FOR ITEM")
                            // Show message bubble width selected menu item
                            this.items = [menu["drink"].random(), menu[this.type].random()];
                            
                            guest.messageBubble.showMessage(guest.scene.menuItems[this.items[1].image], {x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height});
                        }

                        this.waiterId = message.from;
                    }
                } else if (!guest.messageBubble.isShowing) {
                    console.log("SENDING BACK ORDER TO WAITER", this.waiterId)
                    // When message bubble is done, send order to waiter
                    guest.scene.art.services.messages.send({items: this.items}, guest.id, this.waiterId);
                    this.isDone = true;
                }

            } else {
                
                // Look for the guest in the group that should take the bill and check if they are done.
                const group = guest.scene.getGroupFor(guest);
                this.isDone = group.guests.find(g => g.lifeCycleState.shouldTakeBill)?.lifeCycleState.isDone;
            }
        }
    }
}

/**
 * The leaving state is when the guest is done and walks out of the restaurant. 
 */
export class Leave extends LifeCycleState {
    /**
     * @param {Guest} guest 
     */
    init(guest) {
        console.log("Guest is done, leaving");
        guest.actionState = new StandingUp(guest.direction);
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if(guest.isIdleStanding()) {
            guest.actionState = new Walking({ x: 0, y: 16 * 6 }); 
        } else if (guest.isWalking() && guest.actionState.path.hasReachedGoal) {
            // Keep walking out, guest group will take this guest away
            guest.pos.x -= 1;
            guest.direction = "w";

        } else if (guest.pos.x < -guest.scene.art.tileSize) {
            this.isDone = true;
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
     * @param {Guest} guest 
     */
    update(guest) {

        if (this.path === null) {
            console.log("GOAL", this.goal)
            this.path = new WalkPath(guest, {x: this.goal.x, y: this.goal.y});
        }

        this.path.update(guest);

        guest.pos = this.path.getPos();
  
        if (!guest.animations.isPlaying(`walk-${guest.direction}`)) {
            guest.animations.play(`walk-${guest.direction}`);
        }

        guest.animations.update();

    }
}


export class IdleSitting extends ActionState {

    init(guest) {
     
        guest.image = `idle-sit-${guest.tableSide}`;
        const table = guest.scene.getGroupFor(guest).table;
        guest.pos = table.chairs[guest.tableSide].pos;
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {}

}


class IdleStanding extends ActionState {

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if (!guest.animations.isPlaying(`idle-${guest.direction}`)) {
            guest.animations.play(`idle-${guest.direction}`);
        }
    }
}


class StandingUp extends ActionState {
    constructor(){
        super();
        this.initialized = false;
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

       if(!this.initialized) {
            guest.animations.play(`stand-up-${guest.direction}`);
            this.initialized = true;
        }

        console.log("Stand up animation should play here");

        guest.animations.update();

        if (!guest.animations.isPlaying(`stand-up-${guest.direction}`)) {
            guest.actionState = new IdleStanding(guest.direction);
        }
    }
}


class SittingDown extends ActionState {

    constructor(){
        super();
        this.initialized = false;
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if(!this.initialized) {
            guest.direction = ["n", "e", "s", "w"][guest.tableSide];
            guest.animations.play(`sit-down-${guest.direction}`);
            this.initialized = true;
        }

        console.log("Sitting down animation should play here");

        guest.animations.update();

        if (!guest.animations.isPlaying(`sit-down-${guest.direction}`)) {
            console.log("HAS SAT DOWN", guest.tableSide)
            guest.actionState = new IdleSitting();
        }
    }
}

export default class Guest extends Sprite {
    /**
     * @type {LifeCycleState}
     */
    #lifeCycleState;

    /**
     * @type {ActionState}  
     */
    #actionState;

    /**
     * @type {number}
     */
    tableSide;

    /**
     * @param {Scene} scene
     * @param {Symbol} id
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {number} tableSide
     */
    constructor(scene, id, pos, width, height,  tableSide)  {

        super(scene, id, pos, width, height);

        this.messageBubble = new MessageBubble(scene);
        this.tableSide = tableSide;

        this.animations.create("walk-s", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 4, startIdx: 4, loop: true });
        this.animations.create("walk-e", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 4, startIdx: 8 , loop: true});
        this.animations.create("walk-ne", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 4, startIdx: 16 , loop: true});
        this.animations.create("walk-nw", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 4, startIdx: 20, loop: true });
        this.animations.create("walk-w", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 4, startIdx: 24 , loop: true});
        this.animations.create("walk-sw", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 4, startIdx: 28 , loop: true});

        this.animations.create("idle-s", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 0, loop: true });
        this.animations.create("idle-se", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 4 , loop: true});
        this.animations.create("idle-e", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 8, loop: true });
        this.animations.create("idle-ne", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 12 , loop: true});
        this.animations.create("idle-n", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 16 , loop: true});
        this.animations.create("idle-nw", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 20 , loop: true});
        this.animations.create("idle-w", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 24 , loop: true});
        this.animations.create("idle-sw", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 28, loop: true });

        this.animations.create("eat-n", {type: "spritesheet", frames: "idle-sit-2", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("eat-e", {type: "spritesheet", frames: "idle-sit-3", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("eat-s", {type: "spritesheet", frames: "idle-sit-0", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("eat-w", {type: "spritesheet", frames: "idle-sit-1", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});

        
        this.animations.create("drink-n", {type: "spritesheet", frames: "idle-sit-2", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("drink-e", {type: "spritesheet", frames: "idle-sit-3", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("drink-s", {type: "spritesheet", frames: "idle-sit-0", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("drink-w", {type: "spritesheet", frames: "idle-sit-1", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});

        this.animations.create("sit-down-s", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 0 });
        this.animations.create("sit-down-e", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 8 });
        this.animations.create("sit-down-n", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 16 });
        this.animations.create("sit-down-w", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 24});

        this.animations.create("stand-up-s", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 0 });
        this.animations.create("stand-up-e", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 8 });
        this.animations.create("stand-up-n", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 16 });
        this.animations.create("stand-up-w", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 24});
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


    get lifeCycleState() {
        return this.#lifeCycleState;
    }

    /**
     * @param {LifeCycleState} state
     */
    set lifeCycleState(state) {
        this.#lifeCycleState = state;
        this.#lifeCycleState.init(this);
    }

    isIdleStanding() {
        return this.actionState instanceof IdleStanding;
    }

    isIdleSitting() {
        return this.actionState instanceof IdleSitting;
    }

    isWalking() {
        return this.actionState instanceof Walking;
    }

    isArriving() {
        return this.#lifeCycleState instanceof Arrive;
    }

    isEating() {
        return this.#lifeCycleState instanceof Eating;
    }

    isDrinking() {
        return this.#lifeCycleState instanceof Drinking;
    }

    isEatingAndDrinking() {
        return this.#lifeCycleState instanceof EatAndDrink;
    }

    isReceivingOrder() {
        return this.#lifeCycleState instanceof ReceiveOrder;
    }

    isOrdering() {
        return this.#lifeCycleState instanceof Order;
    }

    isLeaving() {
        return this.#lifeCycleState instanceof Leave;
    }

    getGridPos() {
        return {
            col: Math.floor(this.pos.x / this.scene.art.tileSize),
            row: Math.floor(this.pos.y / this.scene.art.tileSize)
        };
    }

    update() {

        if(this.#lifeCycleState)this.#lifeCycleState.update(this);
        this.#actionState.update(this);
    }
}