

import { ArtObject } from "./pim-art/index.js";

/**
 * @typedef Menu
 * @property {MenuItem[]} drinks
 * @property {MenuItem[]} food
 * @property {MenuItem[]} dessert
 */

/**
 * @typedef MenuItem
 * @property {string} name
 * @property {number} price
 * @property {string} image
 * @property {number} width
 * @property {number} height
 */


export class OrderedMenuItem extends ArtObject {

     /** 
     * @param {MenuItem} menuItem
     * @param {{x: number, y: number}} pos
     */
    constructor(scene, menuItem, pos) {
        super(scene, Symbol("menu-item-order"))
        this.menuItem = menuItem;
        this.menuItemObj = scene.createMenuItem(menuItem.image, pos);
        
    }
    



}
export const menu = {
    drink: [
        { type: "drink", name: "Milk", price: 1.0, image: "milk", width: 3, height: 4 },
        { type: "drink", name: "Corn Silk Ice Tea", price: 2.0, image: "corn-silk-ice-tea", width: 3, height: 4 },
        { type: "drink", name: "Coca-Cola Zero", price: 2.0, image: "coca-cola-zero", width: 3, height: 4 },
        { type: "drink", name: "Rhubarb Lemonade", price: 2.0, image: "rhubarb-lemonade", width: 3, height: 4 },
        { type: "drink", name: "Water With Ice", price: 1.0, image: "water-with-ice", width: 3, height: 4 },
        { type: "drink", name: "Ice Coffee Latte", price: 3.0, image: "ice-coffee-latte", width: 3, height: 4 },
        { type: "drink", name: "Coffee Latte", price: 3.0, image: "coffee-latte", width: 3, height: 4 },
    ],

    food: [
        { type: "food", name: "Spaghetti Bolognese", price: 10.0, image: "spaghetti-bolognese", width: 7, height: 7 },
        { type: "food", name: "Pizza Pineapple", price: 9.0, image: "pizza-pineapple", width: 7, height: 7 },
        { type: "food", name: "Tacos", price: 7.0, image: "tacos", width: 7, height: 7 },
        { type: "food", name: "Curry With Fried Egg", price: 9.0, image: "curry-with-fried-egg", width: 7, height: 7 },
        { type: "food", name: "Tonkotsu Ramen", price: 12.0, image: "tonkotsu-ramen", width: 7, height: 7 },
        { type: "food", name: "Poke Bowl", price: 11.0, image: "poke-bowl", width: 7, height: 7 },
        { type: "food", name: "Apple Salad", price: 5.0, image: "apple-salad", width: 7, height: 7 },
        { type: "food", name: "Halloumi Salad", price: 6.0, image: "halloumi-salad", width: 7, height: 7 },
    ],

    dessert: [
        { type: "dessert", name: "Blueberry Pie", price: 4.0, image: "blueberry-pie", width: 6, height: 6 },
        { type: "dessert", name: "Banana Split", price: 4.0, image: "banana-split", width: 6, height: 6 },
        { type: "dessert", name: "Frozen Cheesecake With Fresh Raspberries", price: 3.5, image: "frozen-cheesecake-with-fresh-raspberries", width: 6, height: 6 },
        { type: "dessert", name: "Chocolate Ball", price: 2.0, image: "chocolate-ball", width: 6, height: 6 },
        { type: "dessert", name: "White Chocolate Chip Cookie", price: 2.0, image: "white-chocolate-chip-cookie", width: 6, height: 6 },
        { type: "dessert", name: "Panna Cotta With Red Berry Sauce", price: 3.5, image: "panna-cotta-with-red-berry-sauce", width: 6, height: 6 },
        { type: "dessert", name: "Strawberry Cake", price: 4.0, image: "strawberry-cake", width: 6, height: 6 }
    ]
}