
export const phrases = {
    // Taking and receiving orders. 
    orderFood: [],
    orderDrink: [],
    orderDessert: [],

    takingOrderFood: [],
    takingOrderDrink: [],
    takingOrderDessert: [],

    foodQuestions: [],
    drinkQuestions: [],
    
    // Things to say when order has arrived.
    foodComments: [],
    drinkComments: [],
    dessertComments: [],

    // Things to say when guest is looking at stage. 
    musicComments: [],

    // Sounds when guest is eating or drinking.
    drinkSounds: [],
    eatingSounds: [],
};


export default class MessagesManager {

    /**
     * @type {Map<string, {message: string, from: string}>}
     * @private
     */
    messages;

    /**
     * @type {MessagesManager}
     * @private
     */
    instance;

    /**
     * Use getInstance to get the dialog engine
     * @private
     */
    constructor() {
        this.messages = new Map();
    }

    /**
     * @static
     * @returns {DialogManager}
     */
    static GetInstance() {
        if(this.instance === undefined) {
            this.instance = new DialogManager();
        }

        return this.instance;
    }

    /**
     * @param {string} msg 
     * @param {string} from 
     * @param string} to 
     */
    send(msg, from, to) {
        this.messages.set(to, {message: msg, from});
    }


     /**
     * @param string} to id for the receiver of the message
     */
    receive(to) {
        const message = this.messages.get(to);

        // Message is 'picked up' 
        if(message !== undefined) {
            this.messages.delete(to);
        }

        return message;
    }
}


export class MessageBubble {

    /**
     * @type {string | null}
     */
    message;

    /**
     * @type {boolean}
     * @private
     */
    shouldHideMessage;

    /**
     * @param {string} message 
     */
    constructor() {
        this.message = null;
        this.shouldHideMessage = false;
    }

    showMessage(message, duration = 2000) {
        this.message = message;

        setTimeout(() => {
            this.shouldHideMessage = true;
        }, duration);
    }


    shouldHide() {
        return this.message !== null && this.shouldHideMessage;
    }

    hideMessage() {
        this.message = null;
        this.shouldHideMessage = false;
    }

    isShowing() {
        return this.message !== null;
    }
}