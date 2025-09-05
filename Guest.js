import { menu, OrderedMenuItem } from "./menu.js";
import { MessageBubble } from "./message.js";
import { NotImplementedError } from "./pim-art/errors.js";
import { Sprite } from "./pim-art/index.js";
import { WalkPath } from "./WalkPath.js";

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
    init(guest) {}

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
                
                const message = guest.scene.art.services.messages.receive(guest);

                if (message !== undefined) {
                    console.log(message)
                    const guestGroup = guest.scene.getGroupFor(guest);
                    const cornerPos = guestGroup.table.corners[guest.tableSide];

                    console.debug(Arrive.LOGGER_TAG, "guest corner pos", cornerPos, guest.tableSide)
                    guest.actionState = new Walking(cornerPos); 
                }   

            } else if (guest.isWalking()) {
                if (guest.actionState.path.hasReachedGoal) {
                    console.debug(Arrive.LOGGER_TAG, "reached chair", guest.pos, );
                    guest.actionState = new SittingDown();
                } else if(guest.actionState.path.cellCount === 2 && !this.hasNotifiedNextGuest) {
                    this.hasNotifiedNextGuest = true;
                    const guestGroup = guest.scene.getGroupFor(guest);
                    const idx = guestGroup.guests.indexOf(guest);
                    console.log("SFAF", idx)
                    if(idx === guestGroup.guests.length - 1) return;
                    guest.scene.art.services.messages.send("walk", guest, guestGroup.guests[idx + 1]);
                }
            } else if (guest.isIdleSitting() && !this.hasNotifiedNextGuest) {
                 this.hasNotifiedNextGuest = true;
                    const guestGroup = guest.scene.getGroupFor(guest);
                    const idx = guestGroup.guests.indexOf(guest);
                               console.log("SFAF", idx)
                    if(idx === guestGroup.guests.length - 1) return;
                                        guest.scene.art.services.messages.send("walk", guest, guestGroup.guests[idx + 1]);

              
                this.isDone = true;
            }
        }
    }
}


class Eating extends ActionState {

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

        guest.animations.play(`eat-${guest.direction}`);

        let overlay;

        switch(guest.direction) {
            case "s":
                overlay = {frames:`${this.menuItem.image}-bite`, startIdx: 0};
                break;
            case "n":
                overlay = undefined;
                break;
            case "e":
                overlay = {frames:`${this.menuItem.image}-bite`, startIdx: 3};
                break;
            case "w":
                overlay = {frames: `${this.menuItem.image}-bite`, startIdx: 5};
                break;
            case "nw":
            case "ne":
            case "se":
            case "sw":
                throw new Error("Guest has the wrong direction for this state hmmmmmmm");
        }

        guest.animations.play(`eat-${guest.direction}`, overlay);

        setTimeout(() => {
            this.isDone = true;
        }, 5000);
    }
}


class Drinking extends ActionState {

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
    
        switch(guest.direction) {
            case "s":
                guest.animations.play(`drink-${guest.direction}`, {frames:`${this.menuItem.image}-a`, startIdx: 0});
                break;
            case "n":
                guest.animations.play(`drink-${guest.direction}`);
                break;
            case "e":
                guest.animations.play(`drink-${guest.direction}`, {frames:`${this.menuItem.image}-a`, startIdx: 2});
                break;
            case "w":
                guest.animations.play(`drink-${guest.direction}`, {frames:`${this.menuItem.image}-a`, startIdx: 1});
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
   
        if(!guest.animations.isPlaying(`drink-${guest.direction}`)) {
            this.isDone = true;
        }
    }

}

// det ska försvinna en pixel per eat???

export class EatAndDrink extends LifeCycleState {

    /**
     * @typedef  {"eat" | "drink" | "idle"} Action
     */

    /**
     * @type {Action[]}
     */
    static ACTIONS = ["eat", "drink", "idle"];

    /**
     * @param {OrderedMenuItem} drinkItem
     * @param {OrderedMenuItem} eatItem
     * @param {"food" | "dessert"} type 
     */
    constructor(type, drinkItem, eatItem) {
        super();
        this.type = type;
        this.switchAction = false;
        this.drinkItem = drinkItem;
        this.eatItem = eatItem;
    }

    /**
     * @param {Guest} guest 
     */
    init(guest) {

        this.currAction ="eat"

        switch(this.currAction) {
            case "eat":
                guest.actionState = new Eating(this.eatItem.menuItem);
                break;
            case "drink":
                guest.actionState = new Drinking(this.drinkItem.menuItem);
                break;
            case "idle":
                guest.actionState = new IdleSitting(3000);
                break;
        }
    }
       
    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if(this.eatItem.bitesLeft === 0) {
            this.isDone = true;
            return;
        }

        if(!this.isDone && guest.actionState.isDone) {

            switch(this.currAction) {
                case "eat":
                    this.eatItem.eat();
                    this.currAction = "idle";
                    guest.actionState = new IdleSitting(3000);
                    break;
                case "drink":
                    if(this.eatItem.bitesLeft === this.eatItem.bitesTot / 2 || this.eatItem.bitesLeft === 1 && this.drinkItem.sipsLeft > 0) this.drinkItem.drink();
                    this.currAction = "idle";
                    guest.actionState = new IdleSitting(3000);
                    break;
                case "idle":
                    this.currAction = ["eat", "drink"].random();
                    guest.actionState = this.currAction === "eat" ? new Eating(this.eatItem.menuItem) : new Drinking(this.drinkItem.menuItem)
                    break;
            }
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

                const message = guest.scene.art.services.messages.receive(guest);

                if (message !== undefined) {
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
 * then the ordering begins. 
 */
export class Order extends LifeCycleState {

    /**
     * @param {"food" | "dessert" | "bill"} type
     * @param {boolean} shouldTakeBill
     */
    constructor(type, shouldTakeBill) {
        super();
        this.type = type;
        this.waiter = null;
        this.shouldTakeBill = shouldTakeBill;
        this.items = [];
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if(!this.isDone) {
            if(["drink", "food", "dessert"].includes(this.type) || this.shouldTakeBill) {

                if(this.waiter === null) {

                    const message = guest.scene.art.services.messages.receive(guest);
            
                    if (message !== undefined) {

                        if(this.type === "bill") {
                            guest.messageBubble.showMessage(guest.scene.createSymbol("heart"), {x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height});

                        }  else {

                            const eat = menu[this.type].random();
                            const drink = menu["drink"].random();

                            const guestGroup = guest.scene.getGroupFor(guest);
                            
                            this.items = [new OrderedMenuItem(guest, eat, guestGroup.table.getMenuItemTablePos(this.type, eat, guest.tableSide)),
                             new OrderedMenuItem(guest, drink, guestGroup.table.getMenuItemTablePos("drink", drink, guest.tableSide))];
                            
                            guest.messageBubble.showMessage(guest.scene.createMenuItemArtObj(this.items[0].menuItem), {x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height});
                        }

                        this.waiter = message.from;
                    }
                } else if (!guest.messageBubble.isShowing) {

                    guest.scene.art.services.messages.send({items: this.items}, guest, this.waiter);
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

export class EatDrinkDone extends LifeCycleState {

    init(guest) {
        // console.log("INIT ORDER");
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
       
        if(!this.isDone) {

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
    /**
     * @param {Guest} guest 
     */
    init(guest) {
        // console.log("Guest is done, leaving");
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
            // console.log("GOAL", this.goal)
            this.path = new WalkPath(guest, {x: this.goal.x, y: this.goal.y});
        }

        this.path.update(guest);

        guest.pos = this.path.getPos();
  
        if (!guest.animations.isPlaying(`walk-${guest.direction}`)) {
            guest.animations.play(`walk-${guest.direction}`);
        }

    }
}


export class IdleSitting extends ActionState {

    /**
     * @param {number} [duration] 
     */
    constructor(duration) {
        super();
        this.duration = duration;
    }

    init(guest) {
  
        const guestGroup = guest.scene.getGroupFor(guest);

        guest.direction = guestGroup.table.chairDirections[guest.tableSide];
        guest.animations.play(`idle-sit-${guest.direction}`);
        guest.pos = guestGroup.table.getChairPos(guest.tableSide);

        if(this.duration !== undefined) {
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
    init(guest) {

        switch(guest.tableSide) {
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

        const diff = {x: Math.floor(cornerPos.x - guest.pos.x), y: Math.floor(cornerPos.y - guest.pos.y)};

        const diffNormalize = {x: diff.x === 0 ? 0 : diff.x < 0 ? -1 : 1, y: diff.y === 0 ? 0 : diff.y < 0 ? -1 : 1};

        if(diffNormalize.x !== 0 || diffNormalize.y !== 0) {
            if(diffNormalize.x !== 0) {
                guest.pos.x += diffNormalize.x;
                return;
            }

            if(diffNormalize.y !== 0) {
                guest.pos.y += diffNormalize.y;
                return;
            }

        } else {
            guest.actionState = new IdleStanding();
        }
        
    }
}


class SittingDown extends ActionState {


    /**
     * @param {Guest} guest 
     */
    init(guest) {
        // Initial direction when walking from corner position to the chair.

        switch(guest.tableSide) {
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

        const diff = {x: Math.floor(chairPos.x - guest.pos.x), y: Math.floor(chairPos.y - guest.pos.y)};

        const diffNormalize = {x: diff.x === 0 ? 0 : diff.x < 0 ? -1 : 1, y: diff.y === 0 ? 0 : diff.y < 0 ? -1 : 1};
        
        if(diffNormalize.x !== 0) {
            guest.pos.x += diffNormalize.x;
            return;
        }

        if(diffNormalize.y !== 0) {
            guest.pos.y += diffNormalize.y;
            if(guest.tableSide !== 0)  return;
           
        }

        // Guest will sit when arriving to chair 

        guest.actionState = new IdleSitting();
    
    }
}

export default class Guest extends Sprite {

    static LOGGER_TAG = "Guest";

    static VARIANTS = ["asian-man-1", "asian-man-2","black-man-1", "black-woman", "blondie", "brunette", "ginger-1", "granny", "granny2", "jb-old-school", 
        "old-man-1", "old-man-2"
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
    constructor(scene, variant, pos, tableSide)  {
        super(scene, Symbol("guest"), pos, 17, 32);

        /**
         * @type {Direction}
         */
        this.#direction = "e";
        this.messageBubble = new MessageBubble(scene);
        this.tableSide = tableSide;
        this.variant = variant;
        this.gridPos = { row: Math.floor(this.pos.y / this.scene.art.tileSize), col: Math.floor(this.pos.x / this.scene.art.tileSize)};

        this.animations.create("walk-s", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se", {type: "spritesheet", frames:`${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 4, loop: true });
        this.animations.create("walk-e", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 8 , loop: true});
        this.animations.create("walk-ne", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 16 , loop: true});
        this.animations.create("walk-nw", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true });
        this.animations.create("walk-w", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 24 , loop: true});
        this.animations.create("walk-sw", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 100, numberOfFrames: 4, startIdx: 28 , loop: true});

        this.animations.create("idle-s", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 0, loop: true });
        this.animations.create("idle-se", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 4 , loop: true});
        this.animations.create("idle-e", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 8, loop: true });
        this.animations.create("idle-ne", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 12 , loop: true});
        this.animations.create("idle-n", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 16 , loop: true});
        this.animations.create("idle-nw", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 20 , loop: true});
        this.animations.create("idle-w", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 24 , loop: true});
        this.animations.create("idle-sw", {type: "spritesheet", frames: `${variant}-walk`, frameRate: 250, numberOfFrames: 1, startIdx: 28, loop: true });

        this.animations.create("idle-sit-n", {type: "spritesheet", frames: `${variant}-sit`, frameRate: 100000, numberOfFrames: 1, startIdx: 3, loop: true});
        this.animations.create("idle-sit-e", {type: "spritesheet", frames:`${variant}-sit`, frameRate: 100000, numberOfFrames: 1, startIdx: 1, loop: true});
        this.animations.create("idle-sit-s", {type: "spritesheet", frames: `${variant}-sit`, frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("idle-sit-w", {type: "spritesheet", frames: `${variant}-sit`, frameRate: 100000, numberOfFrames: 1, startIdx: 2, loop: true});
        
        this.animations.create("eat-n", {type: "spritesheet", frames: `${variant}-eat`, frameRate: 100000, numberOfFrames: 1, startIdx: 7, loop: true});
        this.animations.create("eat-e", {type: "spritesheet", frames:`${variant}-eat`, frameRate: 1000, numberOfFrames: 2, startIdx: 3, loop: true});
        this.animations.create("eat-s", {type: "spritesheet", frames: `${variant}-eat`, frameRate: 1000, numberOfFrames: 3, startIdx: 0, loop: true});
        this.animations.create("eat-w", {type: "spritesheet", frames: `${variant}-eat`, frameRate: 1000, numberOfFrames: 2, startIdx: 5, loop: true});
        
        this.animations.create("drink-n", {type: "spritesheet", frames: `${variant}-drink`, frameRate: 1000, numberOfFrames: 1, startIdx: 9, loop: false});
        this.animations.create("drink-e", {type: "spritesheet", frames:`${variant}-drink`, frameRate: 1000, numberOfFrames: 1, startIdx: 4, loop: false});
        this.animations.create("drink-s", {type: "spritesheet", frames: `${variant}-drink`, frameRate: 1000, numberOfFrames: 1, startIdx: 1, loop: false});
        this.animations.create("drink-w", {type: "spritesheet", frames: `${variant}-drink`, frameRate: 1000, numberOfFrames: 1, startIdx: 7, loop: false});
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

    get direction(){
        return this.#direction
    }
    set direction(direction) {
        this.#direction = direction;
    }

    isIdleStanding() {
        return this.actionState instanceof IdleStanding;
    }

    isIdleSitting() {
        return this.actionState instanceof IdleSitting;
    }

    isSittingDown() {
        return this.actionState instanceof SittingDown;
    }

    isStandingUp() {
        return this.actionState instanceof StandingUp;
    }

    isWalking() {
        return this.actionState instanceof Walking;
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

    update() {
        const gridPos = { row: Math.floor(this.pos.y / this.scene.art.tileSize), col: Math.floor(this.pos.x / this.scene.art.tileSize)};
        
        if(!(this.gridPos.row === gridPos.row && this.gridPos.col === gridPos.col)) {
            
           this.scene.grid[this.gridPos.row][this.gridPos.col] = this.prevGridValue ?? 0;

           // When guest is walking or about to walk we mark the current cells as occupied
           if(this.isArriving() || this.isLeaving()) {
                this.gridPos = gridPos;
                this.prevGridValue = this.scene.grid[this.gridPos.row][this.gridPos.col];
                this.scene.grid[this.gridPos.row][this.gridPos.col] = this.id;
           }
        }

        this.animations.update();
        this.#actionState.update(this);
        this.#lifeCycleState.update(this);
    }
}