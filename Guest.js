import MessagesManager, { phrases } from "./message.js";

const messagesManager = MessagesManager.GetInstance();

interface State {
    update(guest: Guest): void;
}

class OrderState implements State {

    static OrderType = {
        DRINK: "drink",
        FOOD: "food",
        DESSERT: "dessert",
        BILL: "bill"
    };

  
    hasOrdered = false;

    /**
     * @param {OrderType} type
     */
    constructor(type) {
        this.type = type;
    }

    /**
     * @param {Guest} guest
     */
    update(guest) {

        if(guest.messageBubble.isShowing()) {

            if(guest.messageBubble.shouldHide()){  
                const receiver = ["guest1", "guest2", "guest3", "guest4"].random(); // Ta ut ids för de gäster som är i närheten av waitorn. 
                dialogManager.send(this.messageBubble.msg, this.id, receiver);
                this.messageBubble.hideMessage();

                if(this.hasOrdered) {
                   // set new state for guest, since the conversation is done. 
                }
            }

        } else {

            // Check if waitor is asking the guest for an order.

            const message = dialogManager.receive(guest.id);

            if(message !== undefined) {
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
    private state; 

    constructor(id) {
        this.id = id;
        
    }

    update() {
        
        this.state.update(this);
    }
}