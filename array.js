/**
 * Returns a random element from the array.
 *
 * @returns {*} A random element from the array. The type can be any, depending on the contents of the array.
 */
Array.prototype.random = function() {
    const randomIdx = this.randomIdx();
    return this[randomIdx];
}

/**
 * Removes an element from the array
 */
Array.prototype.remove = function(el) {
    const idx = this.indexOf(el);
    this.splice(idx, 1);
}

/**
 * Returns a random index of the array.
 *
 * @returns {number} A random index of the array.
 */
Array.prototype.randomIdx = function() {
    return Math.floor(Math.random() * this.length);
}