import EventsManager, { EVENT_TYPE,  } from "./EventManager.js";
import  { phrases,DialogManager } from "./message.js";
import { MessageBubble } from "./message.js";
import { Sprite } from "./gameObjects.js";
import { WalkPath } from "./WalkPath.js";

const dialogManager = DialogManager.GetInstance();
const eventsManager = EventsManager.GetInstance();


class State {
    update(guest) {
        throw new Error("Method 'update' must be implemented by subclass.");
    }
}


class ConversationState extends State {

    static DialogType = {
        GUEST_ORDER_DRINK: 0,
        GUEST_ORDER_FOOD: 1,
        GUEST_ORDER_DESSERT: 2,
        GUEST_BILL: 3,
        GUEST_TABLE: 4,
        GUEST_ARRIVE: 5,
        PLACE_ORDER: 6,
        CHEF_ORDER_READY: 7,
    };

    #hasStartedConversation;

    #hasSentLastMessage;

    #waitor;

    #dialogType;

    /**
     * @param {ConversationState.DialogType} dialogType
     */
    constructor(waitor, dialogType) {
        super();
        this.#dialogType = dialogType;
        this.#hasSentLastMessage = false;
        this.#hasStartedConversation = false;
        this.#waitor = waitor;
    }


    update() {

        // All conversations are 3 messages long, the waitor says something to the guest, the guest responds and then the waitor has final word! easy peasy

        if (!this.#hasStartedConversation) {

            // Start conversation by saying the first phrase!
            console.log(this.#dialogType,ConversationState.DialogType.GUEST_ORDER_DRINK)
            switch (this.#dialogType) {
                case ConversationState.DialogType.GUEST_ORDER_DRINK:
                    this.#waitor.messageBubble.showMessage(phrases.takingOrder("drink"));
                    break;
                case ConversationState.DialogType.GUEST_ORDER_FOOD:
                    this.#waitor.messageBubble.showMessage(phrases.takingOrder("food"));
                    break;
                case ConversationState.DialogType.GUEST_ORDER_DESSERT:
                    this.#waitor.messageBubble.showMessage(phrases.takingOrder("dessert"));
                    break;
                case ConversationState.DialogType.GUEST_BILL:
                    this.#waitor.messageBubble.showMessage(phrases.guestHasQuestion);
                    break;
                case ConversationState.DialogType.GUEST_TABLE:
                    this.#waitor.messageBubble.showMessage(phrases.guestHasQuestion);
                    break;
                case ConversationState.DialogType.GUEST_ARRIVE:
                    this.#waitor.messageBubble.showMessage(phrases.welcomeGuest());
                    break;
                case ConversationState.DialogType.PLACE_ORDER:
                    this.#waitor.messageBubble.showMessage(phrases.placeOrder());
                    break;
                case ConversationState.DialogType.CHEF_ORDER_READY: 
                    this.#waitor.messageBubble.showMessage(phrases.greeting.random() + "\n" + phrases.askDrink.random());
                    break;
                default:
                    console.log("Unknown dialog type.");
                    break;
            }

            this.#hasStartedConversation = true;
            return;
        }

        if (this.#waitor.messageBubble.isShowing()) {
            console.log("MESSAGE IS SHOWING");
            if (this.#waitor.messageBubble.shouldHide()) {
                console.log("SENDING THE MESSAGE TO GUEST");

                // Ta ut ids för de gäster som är i närheten av waitorn. 

                const receiver = ["guest1", "guest2", "guest3", "guest4"].random(); 

                dialogManager.send(this.messageBubble.message, this.id, receiver);

                this.#waitor.messageBubble.hideMessage();

                if (this.#hasSentLastMessage) {

                    switch (this.#dialogType) { 

                        case ConversationState.DialogType.GUEST_ORDER_DRINK:
                        case ConversationState.DialogType.GUEST_ORDER_FOOD:
                        case ConversationState.DialogType.GUEST_ORDER_DESSERT:
                            this.#waitor.state = new WalkState(this.#waitor, {row: 0, col: 0}, WalkState.GOAL.PLACE_ORDER);
                            break;
                        case ConversationState.DialogType.GUEST_BILL:
                            this.#waitor.state = new WalkState(this.#waitor, {row: 0, col: 0}, WalkState.GOAL.IDLE_SPOT);
                            break;
                        case ConversationState.DialogType.GUEST_TABLE:
                            this.#waitor.state = new WalkState(this.#waitor, {row: 0, col: 0}, WalkState.GOAL.GUEST_TABLE);
                            break;
                        case ConversationState.DialogType.GUEST_ARRIVE:
                            this.#waitor.state = new WalkState(this.#waitor, {row: 0, col: 0}, WalkState.GOAL.GUEST_ARRIVE);
                            break;
                        case ConversationState.DialogType.PLACE_ORDER:
                            this.#waitor.state = new WalkState(this.#waitor, {row: 0, col: 0}, WalkState.GOAL.IDLE_SPOT);
                        break;
                        case ConversationState.DialogType.CHEF_ORDER_READY:
                            this.#waitor.state = new WalkState(this.#waitor, {row: 0, col: 0}, WalkState.GOAL.GUEST_TABLE);
                            break;
                        default:
                            console.log("Unknown dialog type.");
                            break;
                    }
                }
            }

        } else {
            console.log("WAITING FOR GUEST TO ANSWER");
            // Check if guest has answered.
            const message = dialogManager.receive(this.#waitor.id);

            if (message !== undefined) {
                // When message is received again, the waitor shows the last message in the message bubble
                console.log("Guest answered");
                this.#hasSentLastMessage = true;
            }
        }
    }
}

class WalkState extends State {

    static GOAL = {...EVENT_TYPE, GUEST_TABLE: "guest-table", PLACE_ORDER: "place-order", IDLE_SPOT: "idle-spot" }

    /**
     * @type {Waitor}
     */
    #waitor;

    /**
     * 
     * @type {WalkPath}
     */
    #walkPath;


    /**
     * @type {GOAL}
     */
    #goal;


    /**
     * @param {Waitor} waitor 
     * @param {Cell} goalCell 
     * @param {GOAL} goal 
     */
    constructor(waitor, goalCell, goal) {
        super();
        this.#waitor = waitor;
        this.#goal = goal;
        this.#walkPath = new WalkPath(waitor.getGridCellPosition(), goalCell);
    }


    update() {
   
        if(this.#walkPath.hasReachedGoal) {
            switch (this.#goal) { 
                case WalkState.GOAL.GUEST_ARRIVE:
                    this.#waitor.state = new ConversationState(this.#waitor, ConversationState.DialogType.GUEST_ARRIVE);
                    break;
                case WalkState.GOAL.GUEST_ORDER_DRINK:
                    this.#waitor.state = new ConversationState(this.#waitor, ConversationState.DialogType.GUEST_ORDER_DRINK);
                    break;
                case WalkState.GOAL.GUEST_ORDER_FOOD:
                    this.#waitor.state = new ConversationState(this.#waitor, ConversationState.DialogType.GUEST_ORDER_FOOD);
                    break;
                case WalkState.GOAL.GUEST_ORDER_DESSERT:
                    this.#waitor.state = new ConversationState(this.#waitor, ConversationState.DialogType.GUEST_ORDER_DESSERT);
                    break;
                case WalkState.GOAL.GUEST_BILL:
                    this.#waitor.state = new ConversationState(this.#waitor, ConversationState.DialogType.GUEST_BILL);
                    break;
                case WalkState.GOAL.ORDER_READY:
                    this.#waitor.state = new ConversationState(this.#waitor, ConversationState.DialogType.ORDER_READY);
                    break;
                case WalkState.GOAL.GUEST_TABLE:
                    this.#waitor.state = new ConversationState(this.#waitor, ConversationState.DialogType.GUEST_TABLE);
                    break;
                case WalkState.GOAL.PLACE_ORDER:
                    this.#waitor.state = new ConversationState(this.#waitor, ConversationState.DialogType.PLACE_ORDER);
                    break;
            }

        } else {
            this.#walkPath.update();
            const pos = this.#walkPath.getPositionXY();
            this.#waitor.pos.x = pos.x;
            this.#waitor.pos.y = pos.y;
        }
    }
}


class IdleState extends State {

    /**
     * @type {Waitor}
     */
    #waitor;

    constructor(waitor) {
        super();
        this.#waitor = waitor;
    }

    update() {

        // When idle, the waitor waits for a restaurant event to happen and if so they take action, otherwise they just stand somewhere.

        const event = eventsManager.next();

        console.log("EVENT ", event);

        if (event !== undefined) {
            this.#waitor.state = new WalkState(this.#waitor, event.data.pos, event.name);
        } else {

            if (!this.#waitor.isSayingSomething() && Math.random() > 0.75) {
                this.#waitor.say(phrases.musicComments.random());
            }
        }
    }
}


export default class Waitor extends Sprite {

    /**
     * @type {MessageBubble}
     */
    messageBubble;

    /**
     * @type {State}
     */
    state;


    constructor(id, pos, width, height) {
        super(pos, width, height);
        this.id = id;
        this.messageBubble = new MessageBubble();
        this.state = new IdleState(this);
    }


    getGridCellPosition() {
        return {row: this.pos.y / this.height, col: this.pos.x / this.width}
    }

    update() {
        this.state.update(this);
    }

    /**
     * Shows the message bubble with message.
     * @param {string} message 
     */
    say(message) {
        this.messageBubble.showMessage(message);
    }

    /**
     * Checks if the message bubble is showing, i.e. if the waitor is saying something.
     * @return {boolean}
     */
    isSayingSomething() {
        return this.messageBubble.isShowing();
    }

    /**
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.fillStyle = "blue";
        ctx.fillRect(this.pos.x, this.pos.y, 64, 64);
    }

}