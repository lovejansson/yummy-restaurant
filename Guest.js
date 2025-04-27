import DialogManager, { phrases } from "./message.js";

const messagesManager = DialogManager.GetInstance();

class State {
    update(guest) {
        throw new Error("Method 'update' must be implemented by subclass.");
    }
}

class OrderState extends State {
    static OrderType = {
        DRINK: "drink",
        FOOD: "food",
        DESSERT: "dessert",
        BILL: "bill"
    };

    hasOrdered = false;

    /**
     * @param {string} type
     */
    constructor(type) {
        super();
        this.type = type;
    }

    /**
     * @param {Guest} guest
     */
    update(guest) {
        if (guest.messageBubble.isShowing()) {
            if (guest.messageBubble.shouldHide()) {
                const receiver = ["guest1", "guest2", "guest3", "guest4"].random(); // Get IDs of guests near the waiter.
                dialogManager.send(this.messageBubble.msg, this.id, receiver);
                this.messageBubble.hideMessage();

                if (this.hasOrdered) {
                    // Set new state for guest, since the conversation is done.
                }
            }
        } else {
            // Check if waiter is asking the guest for an order.
            const message = dialogManager.receive(guest.id);

            if (message !== undefined) {
                // Show the message in the message bubble.
                this.messageBubble.showMessage(message.message);

                // Has all guests answered? - If so, show last message bubble saying that the order is taken and will arrive soon.
                hasSentLastMessage = true;
            }
        }
    }
}

export default class Guest {
    /**
     * @type {State}
     */
    state;

    constructor(id) {
        this.id = id;
    }

    update() {
        this.state.update(this);
    }
}
