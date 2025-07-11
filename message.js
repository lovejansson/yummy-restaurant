

/**
 * @typedef MenuItem
 * @property {string} name - The name of the menu item.
 * @property {number} price - The price of the menu item.
 */

export const phrases = {
    /**
     * @param {MenuItem} item 
     * @returns string - A random phrase for ordering a menu item.
     */
    order: (item) => [`I'll take the ${item}.`,
            `The ${item} sounds great, I'll have that.`,
        `I'd like the ${item}, please.`,
        `${item}, please.`].random()
    ,

    /**
     * @param {string} orderType 
     * @returns string - A random phrase for taking an order.
     */
    takingOrder: (orderType) => {

        const phrases = {
            drink: [
                "Welcome! What would you like to drink?",
                "Hi there! Can I get you started with something to drink?",
                "Hello! Would you like to order a drink first?",
                "Good to see you! What can I get you to drink?",
            ],
            food: [
                "What would you like to eat today?",
                "Can I take your food order now?",
                "What sounds good for your meal?",
                "Are you ready to order your food?",
            ],
            dessert: [
                "Would you like to try one of our desserts?",
                "Can I tempt you with something sweet?",
                "What dessert would you like to finish your meal with?",
                "Would you like to see our dessert menu?",
            ],
        };
    
        return phrases[orderType]?.random() || "How can I assist you today?";
    },

    askingForBill: () => ([
        "Can we pay please?", "Can we have the bill please?"]).random(),       

    welcomeGuest: (numberOfGuests) => (["Welcome to The Yummy Restaurant! Follow me.", "Welcome!", 
        `Welcome to The Yummy Restaurant! A table for ${numberOfGuests}?.`, "Welcome!"].random()),

    orderReady: (meal, table) => ([
        `Two ${meal} for table ${table}!`,
        `${meal} is ready for table ${table}!`,
        `Order up! ${meal} for table ${table}!`,
        `Table ${table}, your ${meal} is ready!`,
        `Kitchen says: ${meal} for table ${table}!`,
        `Order ready: ${meal} for table ${table}!`,
        `Table ${table}, come get your ${meal}!`,
        `Hot and fresh: ${meal} for table ${table}!`,
    ]).random(),

    /**
     * @param {string} orderType 
     * @returns string - A random phrase for giving an order to the guest.
     */
    givingOrder: (orderType) => {
        const phrases = {
            drinks: [
                "Here’s your drink. Enjoy!",
                "Your drink is ready. Cheers!",
                "Here you go!",
                "Enjoy your drink!",
            ],
            food: [
                "Here’s your food. Bon appétit!",
                "Your meal is ready. Enjoy!",
                "Here you go!",
                "Enjoy your meal!",
            ],
            dessert: [
                "Here’s your dessert. Enjoy the sweet treat!",
                "Your dessert is ready. Hope you love it!",
                "Here you go!",
                "Enjoy your dessert!",
            ],
        };

        return phrases[orderType]?.random() || "Here you go!";
    },

    guestHasQuestion: "Hello, how can I help you?",

    billComments: [
        "How much should we tip?",
        "Wanana split the bill?",
    ],

    foodComments: [
        "This looks amazing!",
        "Wow, this smells great!",
        "It looks so delicious!",
        "Let’s eat!",
    ],
    
    drinkComments: [
        "So refreshing!",
        "This is perfect!",
        "The flavor is amazing!",
        "Cheers!",
    ],
    
    dessertComments: [
        "This looks heavenly!",
        "So good!",
        "Perfect way to end the meal!",
        "This dessert is next level!",
        "You’ve gotta try this!",
    ],

    musicComments: [
        "Justin is killing it!",
        "This is such a vibe!",
        "He’s so good live!",
        "His voice is unreal!",
        "I’ve waited all night for this!",
        "Justin is a legend!",
        "This is fire!",
        "I’ve got chills. He’s amazing!",
    ],

    drinkingSounds: [
        "Sip sip!",
        "Slurp!",
        "Ahh, refreshing!",
        "Mmm, that's good!",
        "Cheers!",
    ],

    eatingSounds: [
        "Mmm, delicious!",
        "Yum!",
        "Yummy!",
        "Nom nom nom!",
        "This is so good!",
    ],

    menuComment: () => ["Please take a look at our menu.",
        "Here’s our menu, take your time.",
        ].random(),
};




/**
 * Dialog manager functions as a mail box or mail man were parts 
 * of the program can send messages and others can check if they have received any messages.
 */
export default class MessagesManager {

    /**
     * @type {Map<Symbol, {content: any, from: Symbol}>}
     */
    #messages;

    constructor() {
        this.#messages = new Map();
    }

    /**
     * @param {any} msg 
     * @param {string} from 
     * @param {Symbol[] | Symbol} to 
     */
    send(msg, from, to) {
        if(typeof to === 'symbol') {
            this.#messages.set(to, {content: msg, from});
        } else {
            for(const t of to) {
                this.#messages.set(t, {content: msg, from});
            }
        }
    }

     /**
     * @param {Symbol} to id for the receiver of the message
     */
    receive(to) {
        const message = this.#messages.get(to);

        // Message is 'picked up' 
        if(message !== undefined) {
            this.#messages.delete(to);
        }

        return message;
    }
}


/**
 * Message bubble is handling logic for displaying a message bubble next to the sprite 
 * with given message inside. 
 */
export class MessageBubble {

    /**
     * @type {string | null}
     */
    message;

    /**
     * @type {boolean}
     */
    #shouldHideMessage;

    constructor() {
        this.message = null;
        this.#shouldHideMessage = false;
    }

    showMessage(message, duration = 2000) {
        this.message = message;

        setTimeout(() => {
            this.#shouldHideMessage = true;
        }, duration);
    }

    shouldHide() {
        return this.message !== null && this.#shouldHideMessage;
    }

    hideMessage() {
        this.message = null;
        this.#shouldHideMessage = false;
    }

    isShowing() {
        return this.message !== null;
    }
}