
/**
 * @typedef MenuItem
 * @property {string} name
 * @property {number} price
 * @property {string} image
 */


/**
 * @typedef Menu
 * @property {MenuItem[]} drinks
 * @property {MenuItem[]} food
 * @property {MenuItem[]} dessert
 */


/**
 * @type {Menu}
 */
export const menu = {
    drink: [
        { name: "Milk", price: 1.0, image: "milk" },
        { name: "Corn Silk Ice Tea", price: 2.0, image: "corn-silk-ice-tea" },
        { name: "Coca-Cola Zero", price: 2.0, image: "coca-cola-zero" },
        { name: "Rhubarb Lemonade", price: 2.0, image: "rhubarb-lemonade" },
        { name: "Water With Ice", price: 1.0, image: "water-with-ice" },
        { name: "Ice Coffee Latte", price: 3.0, image: "ice-coffee-latte" },
        { name: "Coffee Latte", price: 3.0, image: "coffee-latte" },
    ],

    food: [
        { name: "Spaghetti Bolognese", price: 10.0, image: "spaghetti-bolognese" },
        { name: "Pizza Pineapple", price: 9.0, image: "pizza-pineapple" },
        { name: "Tacos", price: 7.0, image: "tacos" },
        { name: "Curry With Fried Egg", price: 9.0, image: "curry-with-fried-egg" },
        { name: "Tonkotsu Ramen", price: 12.0, image: "tonkotsu-ramen" },
        { name: "Poke Bowl", price: 11.0, image: "poke-bowl" },
        { name: "Apple Salad", price: 5.0, image: "apple-salad" },
        { name: "Halloumi Salad", price: 6.0, image: "halloumi-salad" },
    ],

    dessert: [
        { name: "Blueberry Pie", price: 4.0, image: "blueberry-pie" },
        { name: "Banana Split", price: 4.0, image: "banana-split" },
        { name: "Frozen Cheesecake With Fresh Raspberries", price: 3.5, image: "frozen-cheesecake-with-fresh-raspberries" },
        { name: "Chocolate Ball", price: 2.0, image: "chocolate-ball" },
        { name: "White Chocolate Chip Cookie", price: 2.0, image: "white-chocolate-chip-cookie" },
        { name: "Panna Cotta With Red Berry Sauce", price: 3.5, image: "panna-cotta-with-red-berry-sauce" },
        { name: "Strawberry Cake", price: 4.0, image: "strawberry-cake" },
    ],
};