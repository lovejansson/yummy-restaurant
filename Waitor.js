import MessagesManager, { phrases } from "./message.js";
import MessageBubble from "./MessageBubble.js";

const messagesManager = MessagesManager.GetInstance();

class TakeOrderState {

    static OrderType = {
        DRINK: "drink",
        FOOD: "food",
        DESSERT: "dessert",
        BILL: "bill"
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


export default class Waitor {

    /**
     * @type {MessageBubble}
     * @private 
     */
    messageBubble;

    constructor(id) {
        this.id = id;
        this.messageBubble = new MessageBubble();
    }

    update() {
        if(this.messageBubble.shouldHide()) {
        // Send the message to the recevier after the bubble has been shown for a while.
    
    
        }else if(!this.messageBubble.isShowing()) {
            this.messageBubble.showMessage(phrases.greeting.random());
        }
    }
}