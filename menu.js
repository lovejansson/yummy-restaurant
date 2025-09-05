/**
 * @typedef Menu
 * @property {MenuItem[]} drinks
 * @property {MenuItem[]} food
 * @property {MenuItem[]} dessert
 */

import { ArtObject } from "./pim-art/index.js";

/**
 * @typedef MenuItem
 * @property {"drink"| "food" | "dessert"} type
 * @property {string} name
 * @property {number} price
 * @property {string} image
 * @property {number} width
 * @property {number} height
 */

export class OrderedMenuItem extends ArtObject {
     /** 
     * @param {MenuItem} menuItem
     * @param {Guest} guest
     * @param {{x: number, y: number}} pos
     */
    constructor(guest, menuItem, pos) {
        super(guest.scene, Symbol("ordered-menu-item"));
        this.menuItem = menuItem;

        this.width = menuItem.width;
        this.height = menuItem.height;
        this.halfWidth = menuItem.width / 2;
        this.halfHeight = menuItem.height / 2;
        this.guest = guest;
        this.pos = pos;

        this.bitesLeft = menuItem.type === "drink" ? null : menuItem.type === "dessert" ? 12 : 21;
        this.sipsLeft = menuItem.type === "drink" ? 2 : null;
        this.bitesTot = menuItem.type === "drink" ? null : menuItem.type === "dessert" ? 12 : 21;
        this.sipsTot = menuItem.type === "drink" ? 2 : null; 

        const canvas = document.createElement("canvas");

        canvas.width = this.menuItem.width;
        canvas.height = this.menuItem.height;
        this.ctx = canvas.getContext("2d");
        this.ctx.drawImage(this.guest.scene.art.images.get(this.menuItem.image), 0, 0);

    }

    drink() {
        if(this.menuItem.type !== "drink") throw new Error("Can't drink a food or dessert item");
        if (this.sipsLeft === 0) throw new Error("The glass is empty");
        
        takeSip(this.ctx);

        --this.sipsLeft;
    }

    eat() {
        if(this.menuItem.type !== "dessert" && this.menuItem.type !== "food") throw new Error("Can't eat a drink dööö");
        if (this.bitesLeft === 0) throw new Error("The plate is empty");
        
        takeBite(this.ctx);

        --this.bitesLeft;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        ctx.drawImage(this.ctx.canvas, this.pos.x, this.pos.y);
    }
}

export const menu = {
    drink: [
        { type: "drink", name: "Milk", price: 1.0, image: "milk", width: 3, height: 4 },
        { type: "drink", name: "Corn Silk Ice Tea", price: 2.0, image: "corn-silk-ice-tea", width: 3, height: 4 },
        { type: "drink", name: "Coca-Cola Zero", price: 2.0, image: "coca-cola-zero", width: 3, height: 4 },
        { type: "drink", name: "Rhubarb Lemonade", price: 2.0, image: "rhubarb-lemonade", width: 3, height: 4 },
        { type: "drink", name: "Water With Ice", price: 1.0, image: "water-with-ice", width: 3, height: 4 },
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

/**
 * Modifies the food canvas by removing a food pixel and replacing it with plate pixel.
 * @param {CanvasRenderingContext2D} ctx
 */
function takeBite(ctx) {
     
      const plateColor = {r: 117, g: 151, b: 163,a: 255};
      const plateLightColor = {r: 181, g: 215, b: 255,a: 255};
      const pixelData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
      
      const foodRIndexes = [];
      let {r, g, b, a} = {r: 0, g: 0, b: 0, a: 0};

      for(let row = 0; row < ctx.canvas.height; ++row) {
        for (let col = 0; col < ctx.canvas.width; ++col) {

            const firstIdx = row * ctx.canvas.width * 4 + col * 4;
            r = pixelData.data[firstIdx];
            g = pixelData.data[firstIdx + 1];
            b = pixelData.data[firstIdx + 2];
            a = pixelData.data[firstIdx + 3];

            if((r !== plateColor.r || g !== plateColor.g || b !== plateColor.b || a !== plateColor.a) && a === 255) {
                foodRIndexes.push(firstIdx);
            }
         
        }
    }

    if(foodRIndexes.length === 0) throw new Error("Not enough food pixels left");

        const rIndex = foodRIndexes.random();
        // Put plate color in pixel data
        pixelData.data[rIndex] = plateLightColor.r;
        pixelData.data[rIndex + 1] = plateLightColor.g;
        pixelData.data[rIndex + 2] = plateLightColor.b;
        pixelData.data[rIndex + 3] = plateLightColor.a;
        ctx.putImageData(pixelData, 0, 0);

}

/**
 * Modifies the drink image by removing a drink pixel and replacing it with glass pixel.
 * @param {CanvasRenderingContext2D} ctx
 */
function takeSip(ctx) {
     
      const glassColor = {r: 117, g: 151, b: 163,a: 255};
      const glassLightColor = {r: 181, g: 215, b: 255,a: 255};
      const pixelData = ctx.getImageData(0, 0, ctx.canvas.width, ctx.canvas.height)
      
      const foodRIndexes = [];
      let {r, g, b, a} = {r: 0, g: 0, b: 0, a: 0};

      for(let row = 0; row < ctx.canvas.height; ++row) {
        for (let col = 0; col < ctx.canvas.width; ++col) {

            const firstIdx = row * ctx.canvas.width * 4 + col * 4;
            r = pixelData.data[firstIdx];
            g = pixelData.data[firstIdx + 1];
            b = pixelData.data[firstIdx + 2];
            a = pixelData.data[firstIdx + 3];

            if((r !== glassColor.r || g !== glassColor.g || b !== glassColor.b || a !== glassColor.a) && a === 255) {
                foodRIndexes.push(firstIdx);
            }
         
        }
    }

    if(foodRIndexes.length === 0) throw new Error("Not enough food pixels left");

     const rIndex = foodRIndexes.random();
    // Put plate color in pixel data
    pixelData.data[rIndex] = glassLightColor.r;
    pixelData.data[rIndex + 1] = glassLightColor.g;
    pixelData.data[rIndex + 2] = glassLightColor.b;
    pixelData.data[rIndex + 3] = glassLightColor.a;
    ctx.putImageData(pixelData, 0, 0);

}