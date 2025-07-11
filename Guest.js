import { menu } from "./menu.js";
import { phrases, MessageBubble } from "./message.js";
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
    update(guest) {
        throw new Error("Method 'update' must be implemented by subclass.");
    }
}


class LifeCycleState {
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
 * 
 */
export class Arriving extends LifeCycleState {

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
        if (guest.isIdleStanding()) {
            
            const message = guest.scene.art.services.messages.receive(guest.id);
           
            // waiter signals to follow them to a table
            if (message !== undefined) { 
                const table = guest.scene.getTableFor(guest.id);
                guest.actionState = new Walking(table.corners[guest.tableSide]); 
            }   

        } else if (guest.isWalking()) {
            if (guest.actionState.path.hasReachedGoal) {
                console.log(guest.pos);
                console.log("Reached goal, sitting down");
                guest.actionState = new SittingDown();
            }
        } else if (guest.isIdleSitting()) {
            guest.lifeCycleState = new Order("food");
        }
    }
}


class Eating extends LifeCycleState {

    constructor() {
        super();
        this.shouldSaySomething = false;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.animations.play("guest-eat-" + guest.direction);

        setInterval(() => {
            this.shouldSaySomething = true;
        }, 1000 * 10);
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if (guest.messageBubble.isShowing()) {

            if (guest.messageBubble.shouldHide()) {
                this.messageBubble.hideMessage();
            }

        } else if(this.shouldSaySomething) {
            guest.messageBubble.showMessage(phrases.eatingSounds.random());
            this.shouldSaySomething = false;
        }
    }
}


class Drinking extends LifeCycleState {
   
    constructor() {
        super();
        this.shouldSaySomething = false;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.animations.play("guest-drink-" + guest.direction);

        setInterval(() => {
            this.shouldSaySomething = true;
        }, 1000 * 10);
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if (guest.messageBubble.isShowing()) {

            if (guest.messageBubble.shouldHide()) {
                this.messageBubble.hideMessage();
            }

        } else if(this.shouldSaySomething) {
            guest.messageBubble.showMessage(phrases.drinkingSounds.random());
            this.shouldSaySomething = false;
        }
    }
}

export class EatingAndDrinking extends LifeCycleState {

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
       
        // 15 sek 
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        console.log("GEST EATING AND DRINKING UPDATE", guest.id, this.isDone, this.switchAction);

        if (!guest.messageBubble.isShowing()) {
            if (this.isDone) {
                if (this.type === "food") {
                    guest.lifeCycleState = new Order("dessert")
                } else {
                    guest.lifeCycleState = new Order("bill");
                }

            } else if (this.switchAction) {
                if (guest.isEating()) {
                    guest.actionState = new Drinking();
                } else {
                    guest.actionState = new Eating();
                }

                this.switchAction = false;
            }
        }
    }
}

class ReceivingOrder extends LifeCycleState {
    /**
     * @param {"food" | "dessert" | "bill"} orderType 
     */
    constructor(orderType) {
        super();
        this.orderType = orderType;
    }

    init(guest) {
        guest.actionState = new IdleSitting(guest.direction);
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if (guest.messageBubble.isShowing()) {

            if (guest.messageBubble.shouldHide()) {
                guest.messageBubble.hideMessage();

                switch (this.orderType) {
                    case "food":
                    case "dessert":
                        guest.lifeCycleState = new EatingAndDrinking(this.orderType);
                        break;
                    case "bill":
                        guest.lifeCycleState = new Leaving();
                        break;
                }
            }
        } else {
            // Waiter says something when guest is receiving the order
            const message = guest.scene.art.services.messages.receive(guest.id);
            if (message !== undefined) {
                guest.messageBubble.showMessage(phrases[`${this.orderType}Comments`].random());
                this.waiterId = message.from;
            }
        }
    }
}

/**
 * When the guest wants to order something they first sit and wait for the waiter to arrive and 
 * then the ordering conversation begins. 
 */
class Order extends LifeCycleState {

    /**
     * @param {"food" | "dessert" | "bill"} orderType 
     */
    constructor(orderType) {
        super();
        this.orderType = orderType;
        this.hasOrdered = false;
        this.waiterId = null;
    }

    init(guest) {
        guest.scene.art.services.events.add({name: `order-${this.orderType}`, data: {tableId:  guest.scene.getTableFor(guest.id).id}});
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        // Guest is telling waiter the order
        if (guest.messageBubble.isShowing()) {

            // Send message to waiter when bubble is done and transition into receiving the order.

            if (guest.messageBubble.shouldHide()) {

                guest.scene.art.services.messages.send({items: this.items}, guest.id, this.waiterId);
                guest.messageBubble.hideMessage();
                guest.lifeCycleState = new ReceivingOrder(this.orderType);
            }

        } else {
            // Guest is waiting for waiter to be ready to take their order
            const message = guest.scene.art.services.messages.receive(guest.id);

            if (message !== undefined) {
         

                if(this.orderType === "bill") {
                    this.items = [{name: "bill", price: 0}];
                     guest.messageBubble.showMessage(phrases.askingForBill());
                }  else {
            
                    this.items = [menu["drink"].random(), menu[this.orderType].random()];
                    guest.messageBubble.showMessage(phrases.order(this.items[0]) + " and " + phrases.order(this.items[1]));
                }
              
                this.waiterId = message.from;
            }
        }
    }
}

/**
 * The leaving state is when the guest is done and walks out of the restaurant. 
 */
class Leaving extends LifeCycleState {
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
            guest.actionState = new Walking({ x: 0, y: guest.scene.art.tileSize * 7 }); 
        } else if (guest.isWalking() && guest.actionState.path.hasReachedGoal) {
            guest.scene.guestLeft(guest.id);
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
           
            this.path = new WalkPath(guest, {x: this.goal.x, y: this.goal.y - 16});
        }

        this.path.update(guest);

        guest.pos = this.path.getPos();
  
        if (!guest.animations.isPlaying(`walk-${guest.direction}`)) {
            guest.animations.play(`walk-${guest.direction}`);
        }

        guest.animations.update();

    }
}

class IdleSitting extends ActionState {

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if (!guest.animations.isPlaying(`idle-sit-${guest.direction}`)) {
            guest.animations.play(`idle-sit-${guest.direction}`);
        }
    }
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
            console.log("HAS SAT DOWN", guest.direction)
            guest.actionState = new IdleSitting(guest.direction);
            const table = guest.scene.getTableFor(guest.id)
            console.log(table.seats[guest.direction]);
            guest.pos = table.seats[guest.direction];
        }
    }
}

export default class Guest extends Sprite {

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
     * @type {number}
     */
    tableSide;

    /**
     * @param {Scene} scene
     * @param {Symbol} id
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string | undefined} image 
     */
    constructor(scene, id, pos, width, height, tableSide)  {
        super(scene, id, pos, width, height);

        this.messageBubble = new MessageBubble();
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

        this.animations.create("idle-sit-s", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 0 , loop: true});
        this.animations.create("idle-sit-se", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 4, loop: true });
        this.animations.create("idle-sit-e", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 8 , loop: true});
        this.animations.create("idle-sit-ne", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 12 , loop: true});
        this.animations.create("idle-sit-n", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 16 , loop: true});
        this.animations.create("idle-sit-nw", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 20 , loop: true});
        this.animations.create("idle-sit-w", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 24 , loop: true});
        this.animations.create("idle-sit-sw", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 28 , loop: true});

        this.animations.create("sit-down-s", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 0 });
        this.animations.create("sit-down-e", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 8 });
        this.animations.create("sit-down-n", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 16 });
        this.animations.create("sit-down-w", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 24});

        this.animations.create("stand-up-s", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 0 });
        this.animations.create("stand-up-e", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 8 });
        this.animations.create("stand-up-n", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 16 });
        this.animations.create("stand-up-w", {type: "spritesheet", frames: "granny-walk", frameRate: 250, numberOfFrames: 1, startIdx: 24});
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
        return this.#lifeCycleState instanceof Arriving;
    }

    isEating() {
        return this.#lifeCycleState instanceof Eating;
    }

    isDrinking() {
        return this.#lifeCycleState instanceof Drinking;
    }

    isEatingAndDrinking() {
        return this.#lifeCycleState instanceof EatingAndDrinking;
    }

    isReceivingOrder() {
        return this.#lifeCycleState instanceof ReceivingOrder;
    }

    isOrdering() {
        return this.#lifeCycleState instanceof Order;
    }

    isLeaving() {
        return this.#lifeCycleState instanceof Leaving;
    }

    getGridPos() {
        return {
            col: Math.floor(this.pos.x / this.scene.art.tileSize),
            row: Math.floor(this.pos.y / this.scene.art.tileSize)
        };
    }

    update() {
        this.lifeCycleState.update(this);
        this.actionState.update(this);
    }
}