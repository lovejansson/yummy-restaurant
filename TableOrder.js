import GuestGroup from "./GuestGroup.js";
import { ArtObject } from "./pim-art/index.js";
import { OrderedMenuItem } from "./menu.js";

/**
 * @typedef GuestOrder
 * @property {Symbol} guestId
 * @property {OrderedMenuItem[]} items
 */
export default class TableOrder extends ArtObject {

    /**
     * @param {"food" | "dessert" | "bill"} type
     * @param {GuestGroup} guestGroup
     */
    constructor(type, guestGroup) {
        super(guestGroup.scene, Symbol("TableOrder"));
        
        this.type = type;
        this.guestGroup = guestGroup;
        this.isServed = false;

        /**
         * @type {GuestOrder}
         */
        this.guestOrders = [];
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        if(this.isServed) {
   
            for(const go of this.guestOrders) {
              
                for(const i of go.items) {
                    if(!(go.guest.isDrinking() && i.menuItem.type === "drink")) {

                        i.menuItemObj.draw(ctx);
                    }
                }
            } 
        }
    }
}