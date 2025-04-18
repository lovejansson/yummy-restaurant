/**
 * Returns a random element from the array.
 *
 * @returns {*} A random element from the array. The type can be any, depending on the contents of the array.
 */
Array.prototype.random = function() {
    const randomIdx = Math.floor(Math.random() * this.length);
    return this[randomIdx];
}