import { menu, OrderedMenuItem } from "./menu.js";
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
                
                const message = guest.scene.art.services.messages.receive(guest);
            
                // waiter signals to follow them to a table
                if (message !== undefined) { 

                    const cornerPos = message.content.table.corners[guest.tableSide]
                    guest.actionState = new Walking(cornerPos); 
                }   

            } else if (guest.isWalking()) {
                if (guest.actionState.path.hasReachedGoal) {
                    // console.log(guest.pos);
                    // console.log("Reached goal, sitting down");
            
                    guest.actionState = new SittingDown();
                }
            } else if (guest.isIdleSitting()) {
              
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
        guest.animations.play("eat-0");
    }
}


class Drinking extends ActionState {
   
    /**
     * @param {Guest} guest 
     */
    init(guest) {
        guest.animations.play("drink-0");
    }

}

export class EatAndDrink extends LifeCycleState {

    /**
     * @param {"food" | "dessert"} type 
     */
    constructor(type) {
        super();
        this.type = type;
        this.isDone = false;
        this.switchAction = false;
    }

    init(guest) {
    
        guest.actionState = new Drinking();

        setTimeout(() => {
            this.isDone = true;
        }, 1000 * 60);

        setInterval(() => {
            this.switchAction = true;
        }, 1000 * 10); 

    }
       
    /**
     * @param {Guest} guest 
     */
    update(guest) {

        if(!this.isDone) {
            if (this.switchAction) {
                if (guest.isEating()) {
                    guest.actionState = new Drinking();
                }
                else if(guest.isIdleSitting()) {
                      guest.actionState = new IdleSitting();
                } else {
                    guest.actionState = new Eating();
                }

                this.switchAction = false;
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
                // console.log("WAITING FOR MESSAGE FROM WEAITER")
                // Waiter says something when guest is receiving the order
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
 * then the ordering conversation begins. 
 */
export class Order extends LifeCycleState {

    /**
     * @param {"food" | "dessert" | "bill"} type 
     */
    constructor(type, shouldTakeBill) {
        super();
        this.type = type;
        this.waiter = null;
        this.shouldTakeBill = shouldTakeBill;
    }

    init(guest) {
     //   console.log("INIT ORDER");
    }

    /**
     * @param {Guest} guest 
     */
    update(guest) {
        if(!this.isDone) {
            if(["drink", "food", "dessert"].includes(this.type) || this.shouldTakeBill) {

                if(this.waiter === null) {
                    // Waiter asks this guest for the order 
                    const message = guest.scene.art.services.messages.receive(guest);

            
                    if (message !== undefined) {
                        // console.log("GOT MESSAGE FROM WAITER")
                        if(this.type === "bill") {
                            // Showing message bubble width dollar sign
                            guest.messageBubble.showMessage(guest.scene.createSymbol("heart"), {x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height});

                        }  else {
                            // console.log("SHOWING MESSAGE BUBBLE FOR ITEM")
                            // Show message bubble width selected menu item

                            const eat = menu[this.type].random();
                            const drink = menu["drink"].random();

                            const guestGroup = guest.scene.getGroupFor(guest);
                            
                            this.items = [new OrderedMenuItem(guest.scene, eat, guestGroup.table.getMenuItemPos(this.type, eat, guest.tableSide)),
                             new OrderedMenuItem(guest.scene, drink, guestGroup.table.getMenuItemPos("drink", drink, guest.tableSide))];
                            
                            guest.messageBubble.showMessage(guest.scene.createMenuItem(this.items[0].menuItem.image), {x: guest.pos.x, y: guest.pos.y - guest.messageBubble.height});
                        }

                        this.waiter = message.from;
                    }
                } else if (!guest.messageBubble.isShowing) {
                    
                    // console.log("SENDING BACK ORDER TO WAITER", this.waiterId)
                    // When message bubble is done, send order items to waiter
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

    init(guest) {
        guest.image = `idle-sit-${guest.tableSide}`;
        const chair = guest.scene.getChairFor(guest);
        guest.pos = chair.pos;
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

    constructor(){
        super();
    }

    
    /**
     * @param {Guest} guest 
     */
    init(guest) {
        switch(guest.tableSide) {
            case 0:
                 guest.direction = "e";
                 break;
            case 1:
                guest.direction = "s";
                break;
            case 2: 
                guest.direction = "w";
                break;
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
 
        const chair = guest.scene.getChairFor(guest);

        const diff = {x: Math.floor(chair.pos.x - guest.pos.x), y: Math.floor(chair.pos.y - guest.pos.y)};

        const diffNormalize = {x: diff.x === 0 ? 0 : diff.x < 0 ? -1 : 1, y: diff.y === 0 ? 0 : diff.y < 0 ? -1 : 1};
        
        if(diffNormalize.x !== 0) {
            guest.pos.x += diffNormalize.x;
            return;
        }

        if(diffNormalize.y !== 0) {
            guest.pos.y += diffNormalize.y;
            return;
        }

        // Guest will sit when arriving to chair 

        guest.actionState = new IdleSitting();
    
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
     * @param {Play} scene
     * @param {{ x: number, y: number }} pos
     * @param {number} tableSide
     */
    constructor(scene, pos, tableSide)  {

        super(scene, Symbol("guest"), pos, 15, 32);

        this.messageBubble = new MessageBubble(scene);
        this.tableSide = tableSide;

        this.animations.create("walk-s", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 0, loop: true });
        this.animations.create("walk-se", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 4, loop: true });
        this.animations.create("walk-e", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 8 , loop: true});
        this.animations.create("walk-ne", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 12, loop: true });
        this.animations.create("walk-n", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 16 , loop: true});
        this.animations.create("walk-nw", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 20, loop: true });
        this.animations.create("walk-w", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 24 , loop: true});
        this.animations.create("walk-sw", {type: "spritesheet", frames: "granny-walk", frameRate: 100, numberOfFrames: 4, startIdx: 28 , loop: true});

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
        this.animations.create("eat-0", {type: "spritesheet", frames: "idle-eat-0", overlayFrames: "bite", frameRate: 500, numberOfFrames: 17, startIdx: 0, loop: true})
        
        this.animations.create("drink-n", {type: "spritesheet", frames: "idle-sit-2", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("drink-e", {type: "spritesheet", frames: "idle-sit-3", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("drink-s", {type: "spritesheet", frames: "idle-sit-0", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});
        this.animations.create("drink-w", {type: "spritesheet", frames: "idle-sit-1", frameRate: 100000, numberOfFrames: 1, startIdx: 0, loop: true});

        this.animations.create("drink-0", {type: "spritesheet", frames: "idle-drink-0", overlayFrames: "corn-silk-ice-tea-drinking", frameRate: 1000, 
            numberOfFrames: 2, startIdx: 0, loop: true});
        

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
        this.image = null;
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

    getGridPos() {
        return {
            col: Math.floor(this.pos.x / this.scene.art.tileSize),
            row: Math.floor(this.pos.y / this.scene.art.tileSize)
        };
    }

    update() {
        if(this.#lifeCycleState) this.#lifeCycleState.update(this);
        this.#actionState.update(this);
        this.animations.update();
    }
}