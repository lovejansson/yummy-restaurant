/**
 * @typedef { "arrive" | "order-food" | "order-dessert" | "clean-order" | "bill" | "order-ready" | "bill-ready"} EventType
 */

/**
 * @typedef RestaurantEvent 
 * @property {EventType} name
 * @property {any} data
 */
export default class EventsManager {

    /**
     * @type {RestaurantEvent[]}
     */
    #events;

    constructor() {
        this.#events = [];
    }

    /**
     * @param {RestaurantEvent} event 
     */
    add(event) {
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