import EventsManager, {EVENT_TYPE, RestaurantEvent} from "./EventManager.js";
import MessagesManager, { phrases } from "./message.js";
import MessageBubble from "./MessageBubble.js";

const messagesManager = MessagesManager.GetInstance();
const eventsManager = EventsManager.GetInstance();

class State {
    update(guest) {
        throw new Error("Method 'update' must be implemented by subclass.");
    }
}


class TalkState extends State {

    static DialogType = {
        GUEST_ORDER_DRINK: 0,
        GUEST_ORDER_FOOD: 1,
        GUEST_ORDER_DESSERT: 2,
        GUEST_BILL: 3,
        GUEST_TABLE: 4,
        GUEST_ARRIVE: 5,
        CHEF_ORDER_READY: 6,
    };

    hasStartedConversation = false;

    hasSentLastMessage = false;

    /**
     * @param {OrderType} type
     */
    constructor(type) {
        this.type = type;
    }

    /**
     * @param {Waitor} waitor
     */
    update(waitor) {

        if(!hasStartedConversation) {
            // Start conversation by showing the message bubble for the waitor. 
            waitor.messageBubble.showMessage(phrases.greeting.random() + " " + phrases.askDrink.random());
            return;
        }

        if(waitor.messageBubble.isShowing()) {

            if(waitor.messageBubble.shouldHide()){  
                const receiver = ["guest1", "guest2", "guest3", "guest4"].random(); // Ta ut ids för de gäster som är i närheten av waitorn. 
                dialogManager.send(this.messageBubble.msg, this.id, receiver);
                this.messageBubble.hideMessage();

                if(this.hasSentLastMessage) {
                   // set new state for waitor, since the conversation is done. 

                    switch (dialogType) {
                        case TalkState.DialogType.GUEST_ORDER_DRINK:
                            // GO to kitchen with note
                            console.log("Handling guest order for a drink.");
                            break;
                        case TalkState.DialogType.GUEST_ORDER_FOOD:
                            // GO to kitchen with note
                            console.log("Handling guest order for food.");
                            break;
                        case TalkState.DialogType.GUEST_ORDER_DESSERT:
                            // GO to kitchen with note
                            console.log("Handling guest order for dessert.");
                            break;
                        case TalkState.DialogType.GUEST_BILL:
                            // Go to idle spot
                            console.log("Handling guest bill.");
                            break;
                        case TalkState.DialogType.GUEST_TABLE:
                            // Go to idle spot
                            console.log("Handling guest table assignment.");
                            break;
                        case TalkState.DialogType.GUEST_ARRIVE:
                            // Go to vacant table
                            console.log("Handling guest arrival.");
                            break;
                        case TalkState.DialogType.CHEF_ORDER_READY:
                            // GO to guest table with order
                            console.log("Handling chef's order ready notification.");
                            break;
                        default:
                            console.log("Unknown dialog type.");
                            break;
                    }
                }
            }

        } else {

            // Check if guest has answered.
            const message = dialogManager.receive(waitor.id);

            if(message !== undefined) {

                // Om det finns gäster kvar:
                // Visa message bubble med "..." för när waitor skriver ned. (Betyder jag skriver ned din beställning och sen när det är klart så kolllar jag på 
                //  nästa gäst)
                // Annarrs visa meddelande osm säger att beställningen är tagen och kommer snart.
              
                // Has all guests answered? - If so, show last message bubble saying that the order is taken and will arrive soon.
                hasSentLastMessage = true;
            }
        }
    }
}

class WalkState extends State {

    static WALK_GOAL = {...EVENT_TYPE, GUEST_TABLE: "guest-table", PLACE_ORDER: "place-order"}
    /**
     * @type {Waitor}
     */
    #waitor;

    /**
     * @type {{x: number, y: number}}
     */
    #goalPos;

    /**
     * @type {WALK_GOAL}
     */
    #goalType;

    constructor(waitor, goalPos, goalType) {
        this.#waitor = waitor;
        this.#goalPos = goalPos;
        this.#goalType = goalType;
    }

    update() {

        if(this.hasReachedGoal()) {

            switch(this.#goalType) {
                case WALK_GOAL.GUEST_ARRIVE:
                    this.#waitor.state = new TalkState(TalkState.DialogType.GUEST_ARRIVE);
                    break;
                case WALK_GOAL.GUEST_ORDER_DRINK:
                    this.#waitor.state = new TalkState(TalkState.DialogType.GUEST_ORDER_DRINK);
                    break;
                case WALK_GOAL.GUEST_ORDER_FOOD:
                    this.#waitor.state  = new TalkState(TalkState.DialogType.GUEST_ORDER_FOOD);
                    break;
                case WALK_GOAL.GUEST_ORDER_DESSERT:
                    this.#waitor.state  = new TalkState(TalkState.DialogType.GUEST_ORDER_DESSERT);
                    break;
                case WALK_GOAL.GUEST_BILL:
                    this.#waitor.state  = new TalkState(TalkState.DialogType.GUEST_BILL);
                    break;
                case WALK_GOAL.ORDER_READY:
                    this.#waitor.state = new TalkState(TalkState.DialogType.ORDER_READY);                   
                    break;
                case WALK_GOAL.GUEST_TABLE:
                    this.#waitor.state = new TalkState(TalkState.DialogType.GUEST_TABLE); 
                    break;
                case WALK_GOAL.PLACE_ORDER:
                    // Idle state ? go to idle state
                    break;
            }

        } else {
                // update position and update walk animation
        }
    }


    hasReachedGoal() {
        return this.#goalPos.x === this.#waitor.pos.x && this.goalPos.y === this.#waitor.pos.y;
    }
    
}


class IdleState extends State {

    /**
     * @type {Waitor}
     */
    #waitor;
    constructor(waitor) {
        this.#waitor = waitor;
    }

    update() {
        const event = eventsManager.next();

        if(event !== undefined) {
            this.#waitor.state = new WalkState(this.#waitor, event.data.pos, event.name);
        } else {
            // Randomly say stuff if someone is next to them
        }
    }
}

export default class Waitor {

    /**
     * @type {MessageBubble}
     * @private 
     */
    messageBubble;

    /**
     * @type {State}
     */
    state;

    constructor(id) {
        this.id = id;
        this.messageBubble = new MessageBubble();
    }

    update() {
      this.state.update(this);
    }

}