



/**
 * @typedef RestaurantEvent 
 * @property {number} string
 * @property {any} data
 */


export const EVENT_TYPE = {
    GUEST_ORDER_DRINK: "guest-order-drink",
    GUEST_ORDER_FOOD: "guest-order-food",
    GUEST_ORDER_DESSERT: "guest-order-dessert",
    GUEST_BILL: "guest-bill",
    GUEST_ARRIVE: "guest-arrive",
    CHEF_ORDER_READY: "chef-order-ready",
};


export default class EventsManager {

    /**
     * @private
     */
    static #instance;


    /**
     * @type {RestaurantEvent[]}
     */
    #events;

    constructor() {
        if (EventsManager.#instance) {
            throw new Error("Use EventsManager.getInstance() to get the singleton instance.");
        }

        this.#events = [];
        EventsManager.#instance = this;
    }

    /**
     * 
     * @returns {EventsManager} the global instance of the EventsManager
     */
    static GetInstance() {

        if(!EventsManager.#instance) EventsManager.#instance = new EventsManager();

        return EventsManager.#instance;
    }

    /**
     * 
     * @param {RestaurantEvent} event 
     */
    add(event) {
        if(!Object.values(EVENT_TYPE).has(event.name)) throw new InvalidEvent(event.name);
        this.#events.push(event);
    }

    /**
     * Get the next event in the event queue
     * @returns {RestaurantEvent | undefined}
     */
    next() {
        return this.#events.shift();
    }
    
}


class InvalidEvent extends Error {
    constructor(event) {
        super(`Invalid event '${event}' for EventsManager.`);
    }
}