import { menu } from "./menu.js";
import { phrases } from "./message.js";
import { NotImplementedError } from "./pim-art/errors.js";
import { Sprite } from "./pim-art/index.js";
import { WalkPath } from "./WalkPath.js";

/**
 * @typedef {"n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"} Direction
 * 
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
class Arriving extends LifeCycleState {

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.scene.art.services.events.add({name: "arrive", data: {pos: guest.pos, guest: [guest.id]}});
        guest.actionState = new IdleStanding("e");
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) { 

        if (guest.isIdleStanding()) {
    
            const message = guest.scene.art.services.messages.receive(guest.id);

            if (message !== undefined) {
                guest.actionState = new Walking(message.data.pos); // TODO: det här är table position. Bestäm vilken position som gästen ska vara på nånstans och beräkna faktisk
               // tile position
            }

        } else if (guest.isWalking()) {
            if (guest.actionState.hasReachedGoal()) {
                guest.actionState = new SittingDown(guest.tableSide);
            }
        } else if (guest.isIdleSitting()) {
            guest.lifeCycleState = new Order("food");
            guest.lifeCycleState.init();
        }
    }
}


class Eating extends LifeCycleState {

    constructor() {
        this.shouldSaySomething = false;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.animations.play("guest-eat-" + guest.tableSide);

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
        this.shouldSaySomething = false;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.animations.play("guest-drink-" + guest.tableSide);

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

class EatingAndDrinking extends LifeCycleState {

    /**
     * 
     * @param {"food" | "dessert"} type 
     */
    constructor(type) {
        this.type = type;
        this.isDone = false;
        this.switchAction = false;
    }

    init(guest) {
        guest.movingState = new Eating(guest.tableSide);

        setTimeout(() => {
            this.isDone = true;
        }, 1000 * 60 * 5); // Will eat for 5 min

        setInterval(() => {
            this.switchAction = true;
        }, 1000 * 15); // 15 sek 
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

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
        this.orderType = orderType;
    }

    init(guest) {
        guest.movingState = new IdleSitting(guest.tableSide);
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if (guest.messageBubble.isShowing()) {

            if (guest.messageBubble.shouldHide()) {

                guest.scene.art.messages.send(this.messageBubble.msg, guest.id, this.waiterId);

                this.messageBubble.hideMessage();

                switch (this.orderType) {
                    case "food":
                    case "dessert":
                        guest.lifeCycleState = new EatingAndDrinking();
                        break;
                    case "bill":
                        guest.lifeCycleState = new Leaving();
                        break;
                }
            }

        } else {

            // Waiter says something when guest is receiving the order
            const message = guest.scene.art.messages.receive(guest.id);

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
        this.orderType = orderType;
        this.hasOrdered = false;
        this.waiterId = null;
    }

    init(guest) {
        guest.scene.art.events.add(`order-${this.orderType}`);
        guest.movingState = new IdleSitting(guest.tableSide);
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        // Guest is telling waiter the order
        if (guest.messageBubble.isShowing()) {

            // Send message to waiter when bubble is done and transition into receiving the order.

            if (guest.messageBubble.shouldHide()) {

                guest.scene.art.messages.send(guest.messageBubble.msg, guest.id, this.waiterId);

                this.messageBubble.hideMessage();

                guest.lifeCycleState = new ReceivingOrder(this.orderType);
            }

        } else {
            // Guest is waiting for waiter to be ready to take their order
            const message = guest.scene.art.messages.receive(guest.id);

            if (message !== undefined) {
                guest.messageBubble.showMessage(phrases.order(menu["drinks"].random()) + " and " + phrases.order(menu[this.orderType].random()) );
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
        guest.actionState = new StandingUp(guest.tableSide);
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if(guest.isIdleStanding()) {
            guest.actionState = new Walking({ x: -1, y: 50 }); 
        } else if (guest.actionState.hasReachedGoal()) {
            guest.scene.remove(guest);
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
     * @param {Guest} guest 
     */
    update(guest) {
        if (this.path === null) {
            this.path = new WalkPath(guest.pos, this.goal);
        }

        this.path.update(guest);

        if (this.path.hasReachedGoal()) {

        }
    }
}

class IdleSitting extends ActionState {

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if (!guest.animations.isPlaying(`idle-sit-${guest.tableSide}`)) {
            guest.animations.animations.play(`idle-sit-${guest.tableSide}`);
        }
    }
}

class IdleStanding extends ActionState {


    /**
     * @type {Direction}
     */
    direction;

    /**
     * @param {Direction} direction
     */
    constructor(direction) {
        super();
        this.direction = direction;
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if (!guest.animations.isPlaying(`idle-${this.direction}`)) {
            guest.animations.play(`idle-${this.direction}`);
        }
    }
}


class StandingUp extends ActionState {

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.animations.animations.play(`stand-up-${guest.tableSide}`);
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        
        if (!guest.animations.isPlaying(`stand-up-${this.direction}`)) {
            guest.actionState = new IdleStanding(this.direction);
        }
    }
}


class SittingDown extends ActionState {
 
    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.animations.animations.play(`sit-down-${guest.tableSide}`);
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if (!guest.animations.isPlaying(`sit-down-${guest.tableSide}`)) {
            guest.actionState = new IdleSitting(guest.tableSide);
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
    lifeCycleState;

    /**
     * @type {ActionState}  
     */
    actionState;

    /**
     * @type {Direction}
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
    constructor(scene, id, pos, width, height, tableSide) {
        super(scene, id, pos, width, height);
        this.tableSide = tableSide;
        this.lifeCycleState = new Arriving();
        this.lifeCycleState.init(this);

        this.animations.create("walk-s", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 0 });
        this.animations.create("walk-se", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 4 });
        this.animations.create("walk-e", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 8 });
        this.animations.create("walk-ne", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 12 });
        this.animations.create("walk-n", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 16 });
        this.animations.create("walk-nw", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 20 });
        this.animations.create("walk-w", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 24 });
        this.animations.create("walk-sw", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 28 });

        this.animations.create("idle-s", {type: "spritesheet", frames: "granny-walk", frameRate: 500, numberOfFrames: 1, startIdx: 0 });
        this.animations.create("idle-se", {type: "spritesheet", frames: "granny-walk", frameRate: 500, numberOfFrames: 1, startIdx: 4 });
        this.animations.create("idle-e", {type: "spritesheet", frames: "granny-walk", frameRate: 500, numberOfFrames: 1, startIdx: 8 });
        this.animations.create("idle-ne", {type: "spritesheet", frames: "granny-walk", frameRate: 500, numberOfFrames: 1, startIdx: 12 });
        this.animations.create("idle-n", {type: "spritesheet", frames: "granny-walk", frameRate: 500, numberOfFrames: 1, startIdx: 16 });
        this.animations.create("idle-nw", {type: "spritesheet", frames: "granny-walk", frameRate: 500, numberOfFrames: 1, startIdx: 20 });
        this.animations.create("idle-w", {type: "spritesheet", frames: "granny-walk", frameRate: 500, numberOfFrames: 1, startIdx: 24 });
        this.animations.create("idle-sw", {type: "spritesheet", frames: "granny-walk", frameRate: 500, numberOfFrames: 1, startIdx: 28 });
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

    update() {
        this.lifeCycleState.update(this);
        this.actionState.update(this);
    }
}