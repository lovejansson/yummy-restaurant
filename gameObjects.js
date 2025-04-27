
class GameObject {
    /**
     * The position of the game object.
     * @type {{ x: number, y: number }}
     */
    pos;

    /**
     * The width of the game object.
     * @type {number}
     */
    width;

    /**
     * The height of the game object.
     * @type {number}
     */
    height;

    /**
     * Creates a new game object.
     * @param {{ x: number, y: number }} pos - The position of the game object.
     * @param {number} width - The width of the game object.
     * @param {number} height - The height of the game object.
     */
    constructor(pos, width, height) {
        this.pos = pos;
        this.width = width;
        this.height = height;
    }


    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        throw new NotImplementedError("GameObject", "draw")
    }
}


export class StaticImage extends GameObject {

    /**
     * Creates a new static image object.
     * @param {{ x: number, y: number }} pos - The position of the game object.
     * @param {number} width - The width of the game object.
     * @param {number} height - The height of the game object.
     */
    constructor(pos, width, height) {
        super(pos, width, height);
    }


    /**
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {
        throw new NotImplementedError("StaticImage", "draw")
    }

}


export class Sprite extends GameObject {

    /**
     * Creates a new sprite object. 
     * @param {{ x: number, y: number }} pos - The position of the game object.
     * @param {number} width - The width of the game object.
     * @param {number} height - The height of the game object.
     */
    constructor(pos, width, height) {
        super(pos, width, height);
    }

    update() {
        throw new NotImplementedError("Sprite", "update");
    }

    draw(_) {
        throw new NotImplementedError("Sprite", "draw");
    }
}


class NotImplementedError extends Error {
    constructor(baseClass, method) {
        super(`Method '${method}' must be implemented by child class when extending from ${baseClass}`);
    }
}
