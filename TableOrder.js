import { OrderedMenuItem } from "./menu.js";


export default class TableOrder  {

    /**
     * @param {"food" | "dessert" | "bill"} type
     */
    constructor(type) {
        this.type = type;
        this.isServed = false;

        /**
         * @type {OrderedMenuItem[]}
         */
        this.guestOrders = [];

    }
}
