
/**
 * @typedef MenuItem
 * @property {string} name - The name of the menu item.
 * @property {number} price - The price of the menu item.
 */

/**
 * @typedef Menu
 * @property {MenuItem[]} drinks - The drinks menu.
 * @property {MenuItem[]} food - The food menu.
 * @property {MenuItem[]} dessert - The dessert menu.
 */


/**
 * @type {Menu}
 */
export const menu = {
    drink: [
        { name: "Milk", price: 1.0 },
        { name: "Corn Silk Ice Tea", price: 2.0 },
        { name: "Coca-Cola Zero", price: 2.0 },
        { name: "Rhubarb Lemonade", price: 2.0 },
        { name: "Water With Ice", price: 1.0 },
        { name: "Ice Coffee Latte", price: 3.0 },
        { name: "Coffee Latte", price: 3.0 },
    ],

    food: [
        { name: "Spaghetti Bolognese", price: 10.0 },
        { name: "Pizza Pineapple", price: 9.0 },
        { name: "Tacos", price: 7.0 },
        { name: "Curry With Fried Egg", price: 9.0 },
        { name: "Tonkotsu Ramen", price: 12.0 },
        { name: "Poke Bowl", price: 11.0 },
        { name: "Apple Salad", price: 5.0 },
        { name: "Halloumi Salad", price: 6.0 },
    ],

    dessert: [
        { name: "Blueberry Pie", price: 4.0 },
        { name: "Vanilla Ice Cream Cone", price: 3.0 },
        { name: "Banana Split", price: 4.0 },
        { name: "Frozen Cheesecake With Fresh Raspberries", price: 3.5 },
        { name: "Chocolate Ball", price: 2.0 },
        { name: "White Chocolate Chip Cookie", price: 2.0 },
        { name: "Panna Cotta With Red Berry Sauce", price: 3.5 },
        { name: "Strawberry Cake", price: 4.0 },
    ],
};


