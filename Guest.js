import { menu, OrderedMenuItem } from "./menu.js";
import { MessageBubble } from "./message.js";
import { NotImplementedError } from "./pim-art/errors.js";
import { Sprite } from "./pim-art/index.js";
import { WalkPath } from "./WalkPath.js";
import { debug } from "./index.js";

/**
 * @typedef {"n" | "ne" | "e" | "se" | "s" | "sw" | "w" | "nw"} Direction
 */
class ActionState {

    constructor() {
        this.isDone = false;
    }

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
    init(guest) { }

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
    static LOGGER_TAG = "Arrive"

    constructor(waitPos){
        super();
        /**
         * @type {{x: number, y: number}}
         */
        this.waitPos = waitPos;
        /**
         * @type {boolean}
         */
        this.hasReachedWaitPos = false;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.direction = "e";
        guest.actionState = new Walking();
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if (!this.isDone) {
            if(!this.hasReachedWaitPos) {
                if(guest.pos.x === this.waitPos.x){
                    this.hasReachedWaitPos = true;
                    guest.actionState = new IdleStanding();
                } else {
                    guest.pos.x += 1;
                }
           

            } else {
                 if (guest.isIdleStanding()) {

                const message = guest.scene.art.services.messages.receive(guest);

                if (message !== undefined) {
                    const guestGroup = guest.scene.getGroupFor(guest);
                    const cornerPos = guestGroup.table.corners[guest.tableSide];
                    guest.actionState = new Walking(cornerPos);
                }

            } else if (guest.isWalking()) {
                if (guest.actionState.path.hasReachedGoal) {
                    guest.actionState = new SittingDown();
                } else if (guest.actionState.path.cellCount === 2 && !this.hasNotifiedNextGuest) {
                    this.hasNotifiedNextGuest = true;
                    const guestGroup = guest.scene.getGroupFor(guest);
                    const idx = guestGroup.guests.indexOf(guest);
                    if (idx === guestGroup.guests.length - 1) return;
                    guest.scene.art.services.messages.send("walk", guest, guestGroup.guests[idx + 1]);
                }
            } else if (guest.isIdleSitting() ) {
                if(!this.hasNotifiedNextGuest) {
                    this.hasNotifiedNextGuest = true;
                    const guestGroup = guest.scene.getGroupFor(guest);
                    const idx = guestGroup.guests.indexOf(guest);
                    if (idx === guestGroup.guests.length - 1) return;
                    guest.scene.art.services.messages.send("walk", guest, guestGroup.guests[idx + 1]);
                }
       
                this.isDone = true;
            } 
            }
           
        }
    }
}

export class EatAndDrink extends LifeCycleState {

    static LOGGER_TAG = "EatAndDrink"

    /**
     * @typedef  {"eat" | "drink" | "idle"} Action
     */

    /**
     * @type {Action[]}
     */
    static ACTIONS = ["eat", "drink"];

    /**
     * @param {OrderedMenuItem} drinkItem
     * @param {OrderedMenuItem} eatItem
     * @param {"food" | "dessert"} type 
     */
    constructor(type, drinkItem, eatItem) {
        super();
        debug(EatAndDrink.LOGGER_TAG, "constructor", type, drinkItem, eatItem)
        this.type = type;
        this.switchAction = false;
        this.drinkItem = drinkItem;
        this.eatItem = eatItem;
        
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {
        this.currAction = "eat"

        switch (this.currAction) {
            case "eat":
                    guest.actionState = new Eating(this.eatItem.menuItem);
                break;
            case "drink":
                    guest.actionState = new Drinking(this.drinkItem.menuItem);
                break;
        }
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if (this.eatItem.bitesLeft === 0) {
            debug(EatAndDrink.LOGGER_TAG,"no bites left");
            guest.actionState = new IdleSitting();
            this.isDone = true;
            return;
        }

        if (!this.isDone && guest.actionState.isDone) {
            debug(EatAndDrink.LOGGER_TAG,"Switching action", this.eatItem.bitesLeft)
            switch (this.currAction) {
                case "eat":
                        this.eatItem.eat();
                        this.currAction = "drink";
                        guest.actionState = new Drinking(this.drinkItem.menuItem);
                    break;
                case "drink":
                    if ((this.eatItem.bitesLeft === Math.floor(this.eatItem.bitesTot / 2) || this.eatItem.bitesLeft === 1) && this.drinkItem.sipsLeft > 0) this.drinkItem.drink();
                        this.currAction = "eat";
                        guest.actionState = new Eating(this.eatItem.menuItem);
                    break;
            }
        }
    }
}

export class ReceiveOrder extends LifeCycleState {
    static LOGGER_TAG = "ReceiveOrder";

    constructor() {
        super();
    }

    init(guest) {
        if(!guest.isIdleSitting()) guest.actionState = new IdleSitting();
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if (!this.isDone) {

            const message = guest.scene.art.services.messages.receive(guest);

            if (message !== undefined) {
                debug(ReceiveOrder.LOGGER_TAG, "is done");
                this.isDone = true;
            }
        }
    }
}

export class GetBill extends LifeCycleState {
       static LOGGER_TAG = "GetBill";
    /**
     * @param {boolean} shouldPay
     */
    constructor(shouldPay) {
        super();
        this.shouldPay = shouldPay;
        debug(GetBill.LOGGER_TAG, this.shouldPay);
    }

    init(guest) {
        if(!guest.isIdleSitting()) guest.actionState = new IdleSitting();
    }

    
    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if(!this.isDone) {
            if(this.shouldPay) {
                const message = guest.scene.art.services.messages.receive(guest);

                if (message !== undefined) {
                    debug(GetBill.LOGGER_TAG, "is done");
                    this.isDone = true;
                }
            } else {

                // Just wait for the other guest to get the bill

                const group = guest.scene.getGroupFor(guest);
                this.isDone = group.guests.find(g => g.lifeCycleState.shouldPay)?.lifeCycleState.isDone;
            }
        }
    
    }
}

export class AskForBill extends LifeCycleState {
     static LOGGER_TAG = "AskForBill"
    /**
     * @param {boolean} shouldPay
     */
    constructor(shouldPay) {
        super();
        this.waiter = null;
        this.shouldPay = shouldPay;
    }


    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if (!this.isDone) {

            if (this.shouldPay) {

                // Ask for the bill when waiter approchaes

                const message = guest.scene.art.services.messages.receive(guest);

                if (message !== undefined) {
                    // TODO: show dollar sign bill
                    guest.messageBubble.showMessage(guest.scene.createSymbol("bill"), { x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height });
                    this.waiter = message.from;
                }  else if (this.waiter !== null) {
                    if (!guest.messageBubble.isShowing) {
                                guest.scene.art.services.messages.send("bill plz", guest, this.waiter);
                                this.isDone = true;
                    }
                }
                
           
            } else {

                // Just wait for the other guest to ask for the bill

                const group = guest.scene.getGroupFor(guest);
                this.isDone = group.guests.find(g => g.lifeCycleState.shouldPay)?.lifeCycleState.isDone;
            }
        }
    }
}


export class Order extends LifeCycleState {
    static LOGGER_TAG = "Order"

    /**
     * @param {"food" | "dessert"} type
     */
    constructor(type) {
        super();
        this.type = type;
        this.waiter = null;
        this.items = [];
        this.haveOrderedDrink = false;
        this.haveOrderedEat = false;
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if (!this.isDone) {
            if (!this.haveOrderedDrink) {

                const message = guest.scene.art.services.messages.receive(guest);

                if (message !== undefined) {

                    const eat = menu[this.type].random();
                    const drink = menu["drink"].random();

                    const guestGroup = guest.scene.getGroupFor(guest);

                    this.items = [new OrderedMenuItem(guest, eat, guestGroup.table.getMenuItemTablePos(this.type, eat, guest.tableSide)),
                    new OrderedMenuItem(guest, drink, guestGroup.table.getMenuItemTablePos("drink", drink, guest.tableSide))];
                    
                    // Show ordering of drink item
                    guest.messageBubble.showMessage(
                        guest.scene.createMenuItemArtObj(this.items[1].menuItem),
                        { x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height }, 1000);
                
                    this.waiter = message.from;
                    this.haveOrderedDrink = true;
                }
            } else if (!guest.messageBubble.isShowing) {

                if(!this.haveOrderedEat) {
                    // Show ordering of eat item next
                    guest.messageBubble.showMessage(guest.scene.createMenuItemArtObj(this.items[0].menuItem), 
                    { x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height }, 1000);
                    this.haveOrderedEat = true;

                } else {
                    guest.scene.art.services.messages.send({ items: this.items }, guest, this.waiter);
                    this.isDone = true;
                }

            }
        }
    }
}

export class EatDrinkDone extends LifeCycleState {
    static LOGGER_TAG = "EatDrinkDone"

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if (!this.isDone) {

            const message = guest.scene.art.services.messages.receive(guest);

            if (message !== undefined) {
                this.isDone = true;
            }
        }
    }
}

/**
 * The leaving state is when the guest is done and walks out of the restaurant. 
 */
export class Leave extends LifeCycleState {
    static LOGGER_TAG = "Leave"
    /**
     * @param {Guest} guest 
     */
    init(guest) {
        setTimeout(() => {
            this.shouldLeave = true;
        }, [3000, 2000, 2000, 1000][guest.tableSide])

    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if(guest.isIdleSitting()) {
            if(this.shouldLeave) {
                guest.actionState = new StandingUp(guest.direction);
            }
        } else if (guest.isIdleStanding()) {
            guest.actionState = new Walking({ x: 0, y: guest.scene.art.tileSize * (Math.random() > 0.5 ? 6 : 7)});
        } else if (guest.isWalking() && guest.actionState.path.hasReachedGoal) {

            // Keep walking out, guest group will take this guest away
            if(guest.pos.x < -guest.scene.art.tileSize * 2) {
                this.isDone = true;
            }

            guest.pos.x -= 1;
            guest.direction = "w";
            

        } 
    }
}


class Eating extends ActionState {

    static LOGGER_TAG = "Eating"

    /**
     * @param {import("./menu.js").MenuItem} menuItem
     */
    constructor(menuItem) {
        super();
        this.menuItem = menuItem;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {

        let overlay;

        switch (guest.direction) {
            case "s":
                overlay = { frames: `${this.menuItem.image}-bite`, startIdx: 0 };
                break;
            case "n":
                overlay = undefined;
                break;
            case "e":
                overlay = { frames: `${this.menuItem.image}-bite`, startIdx: 3 };
                break;
            case "w":
                overlay = { frames: `${this.menuItem.image}-bite`, startIdx: 5 };
                break;
            case "nw":
            case "ne":
            case "se":
            case "sw":
                throw new Error("Guest has the wrong direction for this state hmmmmmmm");
        }

        guest.animations.play(`eat-${guest.direction}`, overlay);
    }

     /**
     * @param {Guest} guest 
     */
    update(guest) {
        if(guest.animations.loopCount() > 3){
            debug(Eating.LOGGER_TAG, "done loop count is past 3")
            this.isDone = true;
        } else {
            debug(Eating.LOGGER_TAG, "loop count", guest.animations.loopCount())
        }

    }
}


class Drinking extends ActionState {

    static LOGGER_TAG = "Drinking"

    /**
     * @param {import("./menu.js").MenuItem} menuItem
     */
    constructor(menuItem) {
        super();
        this.menuItem = menuItem;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {

        switch (guest.direction) {
            case "s":
                guest.animations.play(`drink-${guest.direction}`, { frames: `${this.menuItem.image}-a`, startIdx: 0 });
                break;
            case "n":
                guest.animations.play(`drink-${guest.direction}`);
                break;
            case "e":
                guest.animations.play(`drink-${guest.direction}`, { frames: `${this.menuItem.image}-a`, startIdx: 2 });
                break;
            case "w":
                guest.animations.play(`drink-${guest.direction}`, { frames: `${this.menuItem.image}-a`, startIdx: 1 });
                break;
            case "nw":
            case "ne":
            case "se":
            case "sw":
                throw new Error("Guest has the wrong direction for this state hmmmmmmm")
        }

    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if (guest.animations.loopCount() === 1) {
            debug(Eating.LOGGER_TAG, "done loop count is 1")
            this.isDone = true;
        }
    }

}

class Walking extends ActionState {

    static LOGGER_TAG = "Walking"

    /**
     * @type {{x: number, y: number} | undefined}
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

        if(this.goal) {
            if (this.path === null) {
                    this.path = new WalkPath(guest, { x: this.goal.x, y: this.goal.y });
                }

                this.path.update(guest);

                guest.pos = this.path.getPos();

        }

   
        if (!guest.animations.isPlaying(`walk-${guest.direction}`)) {
            guest.animations.play(`walk-${guest.direction}`);
        }

    }
}


export class IdleSitting extends ActionState {

    static LOGGER_TAG = "IdleSitting"

    /**
     * @param {number?} [duration]
     */
    constructor(duration) {
        super();
        this.duration = duration ?? null;
    }

    init(guest) {

        const guestGroup = guest.scene.getGroupFor(guest);

        guest.direction = guestGroup.table.chairDirections[guest.tableSide];
        guest.animations.play(`idle-sit-${guest.direction}`);
        guest.pos = guestGroup.table.getChairPos(guest.tableSide);

        if (this.duration !== null) {
            setTimeout(() => {
                this.isDone = true;
            }, this.duration)
        }
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

    }
}


class IdleStanding extends ActionState {

    static LOGGER_TAG = "IdleStanding"

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

        static LOGGER_TAG = "StandingUp"
    constructor() {
        super();
        this.initialized = false;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {

        switch (guest.tableSide) {
            case 0:
                guest.direction = "w";
                break;
            case 1:
                guest.direction = "n";
                break;
            case 2:
                guest.direction = "e";
                break;
            case 3:
                guest.direction = "s";
                break;
        }

        guest.animations.play(`walk-${guest.direction}`);

    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        // Guest will walk from the chair to the corner position

        const cornerPos = guest.scene.getGroupFor(guest).table.corners[guest.tableSide];

        const diff = { x: Math.floor(cornerPos.x - guest.pos.x), y: Math.floor(cornerPos.y - guest.pos.y) };

        const diffNormalize = { x: diff.x === 0 ? 0 : diff.x < 0 ? -1 : 1, y: diff.y === 0 ? 0 : diff.y < 0 ? -1 : 1 };

        if (diffNormalize.x !== 0 || diffNormalize.y !== 0) {
            if (diffNormalize.x !== 0) {
                guest.pos.x += diffNormalize.x;
                return;
            }

            if (diffNormalize.y !== 0) {
                guest.pos.y += diffNormalize.y;
                return;
            }

        } else {
            guest.actionState = new IdleStanding();
        }

    }
}


class SittingDown extends ActionState {

    static LOGGER_TAG = "SittingDown"
    /**
     * @param {Guest} guest 
     */
    init(guest) {
        // Initial direction when walking from corner position to the chair.

        switch (guest.tableSide) {
            // Standing in north west corner walking towards north
            case 0:
                guest.direction = "e";
                break;
            // Standing in north east corner walking downwards to east
            case 1:
                guest.direction = "s";
                break;
            // standing in the south east corner walking to the left (south chair)
            case 2:
                guest.direction = "w";
                break;
            // Standing in the south west corner walking upwards 
            case 3:
                guest.direction = "n";
                break;
        }

        guest.animations.play(`walk-${guest.direction}`);

    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {

        // Guest will walk from the corner to the chair position

        const table = guest.scene.getGroupFor(guest).table;

        const chairPos = table.getChairPos(guest.tableSide);

        const diff = { x: Math.floor(chairPos.x - guest.pos.x), y: Math.floor(chairPos.y - guest.pos.y) };

        const diffNormalize = { x: diff.x === 0 ? 0 : diff.x < 0 ? -1 : 1, y: diff.y === 0 ? 0 : diff.y < 0 ? -1 : 1 };

        if (diffNormalize.x !== 0) {
            guest.pos.x += diffNormalize.x;
            return;
        }

        if (diffNormalize.y !== 0) {
            guest.pos.y += diffNormalize.y;
            if (guest.tableSide !== 0) return;

        }

        // Guest will sit when arriving to chair 

        guest.actionState = new IdleSitting();

    }
}

export default class Guest extends Sprite {

    static LOGGER_TAG = "Guest";

    static VARIANTS = ["asian-man-1", "asian-man-2", "black-man-1", "black-woman-1", "black-woman-2", "blondie", "brunette", "ginger-1", "granny", "granny2", "jb-old-school",
        "old-man-1", "old-man-2", "man-brown"
    ];

    static VARIANTS_POOL = ["asian-man-1", "asian-man-2", "black-man-1", "black-woman-1", "black-woman-2", "blondie", "brunette", "ginger-1", "granny", "granny2", "jb-old-school",
        "old-man-1", "old-man-2", "man-brown"
    ];

    /**
     * @type {LifeCycleState}
     */
    #lifeCycleState;

    /**
     * @type {ActionState}  
     */
    #actionState;

    #direction;

    /**
     * @type {number}
     */
    tableSide;

    /**
     * @param {Play} scene
     * @param {"1" | "2"} variant
     * @param {{ x: number, y: number }} pos
     * @param {number} tableSide
     */
    constructor(scene, variant, pos, tableSide) {
        super(scene, Symbol("guest"), pos, 17, variant === "asian-man-2" ? 34 : 32);

        /**
         * @type {Direction}
         */
        this.#direction = "e";
        this.messageBubble = new MessageBubble(scene);
        this.tableSide = tableSide;
        this.variant = variant;

        this.gridPos = null;
        this.animations.create("walk-s", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 4, loop: true });
        this.animations.create("walk-e", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 8, loop: true });
        this.animations.create("walk-ne", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 16, loop: true });
        this.animations.create("walk-nw", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true });
        this.animations.create("walk-w", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 24, loop: true });
        this.animations.create("walk-sw", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 28, loop: true });

        this.animations.create("idle-s", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 0, loop: true });
        this.animations.create("idle-se", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 4, loop: true });
        this.animations.create("idle-e", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 8, loop: true });
        this.animations.create("idle-ne", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 12, loop: true });
        this.animations.create("idle-n", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 16, loop: true });
        this.animations.create("idle-nw", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 20, loop: true });
        this.animations.create("idle-w", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 24, loop: true });
        this.animations.create("idle-sw", { type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 28, loop: true });

        this.animations.create("idle-sit-n", { type: "spritesheet", frames: `${variant}-sit`, frameRate: 100000, numberOfFrames: 1, startIdx: 3, loop: true });
        this.animations.create("idle-sit-e", { type: "spritesheet", frames: `${variant}-sit`, frameRate: 100000, numberOfFrames: 1, startIdx: 1, loop: true });
        this.animations.create("idle-sit-s", { type: "spritesheet", frames: `${variant}-sit`, frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true });
        this.animations.create("idle-sit-w", { type: "spritesheet", frames: `${variant}-sit`, frameRate: 100000, numberOfFrames: 1, startIdx: 2, loop: true });

        this.animations.create("eat-n", { type: "spritesheet", frames: `${variant}-eat`, frameRate: 1500, numberOfFrames: 1, startIdx: 7, loop: true });
        this.animations.create("eat-e", { type: "spritesheet", frames: `${variant}-eat`, frameRate: 750, numberOfFrames: 2, startIdx: 3, loop: true });
        this.animations.create("eat-s", { type: "spritesheet", frames: `${variant}-eat`, frameRate: 500, numberOfFrames: 3, startIdx: 0, loop: true });
        this.animations.create("eat-w", { type: "spritesheet", frames: `${variant}-eat`, frameRate: 750, numberOfFrames: 2, startIdx: 5, loop: true });

        this.animations.create("drink-n", { type: "spritesheet", frames: `${variant}-drink`, frameRate: 1000, numberOfFrames: 1, startIdx: 9, loop: true });
        this.animations.create("drink-e", { type: "spritesheet", frames: `${variant}-drink`, frameRate: 1000, numberOfFrames: 1, startIdx: 4, loop: true });
        this.animations.create("drink-s", { type: "spritesheet", frames: `${variant}-drink`, frameRate: 1000, numberOfFrames: 1, startIdx: 1, loop: true });
        this.animations.create("drink-w", { type: "spritesheet", frames: `${variant}-drink`, frameRate: 1000, numberOfFrames: 1, startIdx: 7, loop: true });
    }

    static GetVariant() {
        const randomVariant = Guest.VARIANTS_POOL.random();

        Guest.VARIANTS_POOL.remove(randomVariant);

        if(!randomVariant){
            console.error("Variant is undefined, resetting pool");
            Guest.VARIANTS_POOL = [...Guest.VARIANTS];
            return Guest.GetVariant();
        }

        return randomVariant;
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

    get lifeCycleState() {
        return this.#lifeCycleState;
    }

    /**
     * @param {LifeCycleState} state
     */
    set lifeCycleState(state) {
        this.#lifeCycleState = state;
        debug(this.#lifeCycleState.constructor.LOGGER_TAG, "init");
        this.#lifeCycleState.init(this);

    }

    get direction() {
        return this.#direction
    }
    set direction(direction) {
        this.#direction = direction;
    }

    isIdleStanding() {
        return this.#actionState instanceof IdleStanding;
    }

    isIdleSitting() {
        return this.#actionState instanceof IdleSitting;
    }

    isSittingDown() {
        return this.#actionState instanceof SittingDown;
    }

    isStandingUp() {
        return this.#actionState instanceof StandingUp;
    }

    isWalking() {
        return this.#actionState instanceof Walking;
    }

    isArriving() {
        return this.#lifeCycleState instanceof Arrive;
    }

    isEating() {
        return this.#actionState instanceof Eating;
    }

    isDrinking() {
        return this.#actionState instanceof Drinking;
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

    isAskingForBill() {
        return this.#lifeCycleState instanceof AskForBill;
    }

    isGettingBill() {
        return this.#lifeCycleState instanceof GetBill;
    }

    isSittingOnChair() {
        return this.isEating() || this.isDrinking() || this.isIdleSitting() || this.isSittingDown() || this.isStandingUp();
    }

    update() {
       
        this.#lifeCycleState.update(this);
        this.#actionState.update(this);
        this.animations.update();

        const gridPos = { row: Math.floor(this.pos.y / this.scene.art.tileSize), col: Math.floor(this.pos.x / this.scene.art.tileSize) };

        if (this.gridPos === null || !(this.gridPos.row === gridPos.row && this.gridPos.col === gridPos.col)) {
            if(this.gridPos !== null && this.gridPos !== null && this.scene.grid[this.gridPos.row][this.gridPos.col] === this.id) {
                this.scene.grid[this.gridPos.row][this.gridPos.col] = 2; // Set previous cell to cool down to avoid swapping  
            }

            this.gridPos = gridPos; 

            // occupy this grid pos if the guest isn't at its chair position, that causes the sprite id to remain when finally seated without getting cleared. 
            if(this.scene.grid[gridPos.row][gridPos.col] === 0 && !this.isSittingOnChair()) {
                this.scene.grid[this.gridPos.row][this.gridPos.col] = this.id;
            }
        } 

        if(this.isSittingOnChair() && this.scene.grid[this.gridPos.row][this.gridPos.col] === this.id) this.scene.grid[this.gridPos.row][this.gridPos.col] = 0;

    }
}