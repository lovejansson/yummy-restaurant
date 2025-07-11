import { StaticImage } from "./pim-art/index.js";

export default class Table extends StaticImage {

    /**
     * @type {{x: number, y: number}[]}
     */
    corners;

    /**
     * @param {Scene} scene
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     * @param {string} image
     */
    constructor(scene, pos) {
        super(scene, Symbol("table"), pos, 32, 32, "table");

        this.isAvailable = true;

        this.corners = [{ x: pos.x - scene.art.tileSize * 2, y: pos.y - scene.art.tileSize * 2},
                        { x: pos.x + scene.art.tileSize * 3, y: pos.y - scene.art.tileSize * 2 },
                        { x: pos.x + scene.art.tileSize * 3, y: pos.y + scene.art.tileSize * 3 },
                        { x: pos.x - scene.art.tileSize * 2, y: pos.y + scene.art.tileSize * 3 }];

        // Seats are relative to the guest sitting direction, 
        // so s means south which means that the guest is facing south i.e. sitting at the top of the table for example.
        this.seats = {
            s: { x: pos.x + scene.art.tileSize / 2, y: pos.y - scene.art.tileSize  },
            w: { x: pos.x + scene.art.tileSize * 3, y: pos.y + scene.art.tileSize * 1.5 },
            n: { x: pos.x + scene.art.tileSize / 2, y: pos.y + scene.art.tileSize * 3},
            e: { x: pos.x - scene.art.tileSize, y: pos.y + scene.art.tileSize * 1.5 }
        }
    }
}

/**
 * @description Represents a company of guests in the restaurant. Used to manage states of guests at a table. 
 */
export class Company {

    /**
     * @param {Scene} scene
     * @param {Guest[]} guests
     * @param {"arriving" | "eating" | "ordering" | "leaving"} initalState
     */
    constructor(scene, guests, initalState ) {
        this.scene = scene;
        this.guests = guests; 
        this.state = initalState; 
    }

    update() {
        switch(this.state) {
            case "arriving": 
                if(this.guests.every(g => g.isOrdering())) {
                    this.state = "ordering";
                    // TODO: set table before this and add table id to event
                    this.scene.art.services.events.add({name: "order-food", data: {tableId:  guest.scene.getTableFor(guest.id).id}});
                }
                break;
            case "eating":
                if(this.guests.every(g => g.isOrdering())) {
                    this.state = "ordering";
                    // TODO: set table before this and add table id to event
                    this.scene.art.services.events.add({name: "order-dessert", data: {tableId:  guest.scene.getTableFor(guest.id).id}});
                }
                break;
            case "ordering":
                if(this.guests.every(g => g.isReceivingOrder())) {
                    this.state = "eating";
                    // TODO: set table before this and add table id to event
                    this.scene.art.services.events.add({name: "order-dessert", data: {tableId:  guest.scene.getTableFor(guest.id).id}});
                }
                break;
            case "leaving":
                if(this.guests.every(g => g.isReceivingOrder())) {
                    this.state = "eating";
                    
                    // TODO: set table before this and add table id to event
                    this.scene.art.services.events.add({name: "order-dessert", data: {tableId:  guest.scene.getTableFor(guest.id).id}});
                }
                break;
        }
    }
}