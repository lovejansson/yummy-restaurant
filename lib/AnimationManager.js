


/**
 * @typedef AnimationConfig
 * @property {string} spritesheet
 * @property {boolean} loop
 * @property {number} frameRate
 * @property {number} [numberOfFrames]
 */

/** 
* @typedef {import("./objects/Sprite.js").default} Sprite
*/


/**
 * @description Manages the animations for a sprite.
 */
export default class AnimationManager {

    /**
     * @param {Sprite} sprite
     */
    constructor(sprite) {
        /**
         * @type {Sprite}
         */
        this.sprite = sprite;

        /** @type {Map<string, AnimationConfig>} */
        this.animations = new Map();

        /** @type {Object|null} */
        this.playingAnimation = null;
        
    }

    /**
     * Creates and registers a new animation. 
     * 
     * @param {string} key - The unique key for the animation.
     * @param {AnimationConfig} config - The configuration of the animation.
     */
    create(key, config) {
        this.animations.set(key, config);
    }

    /**
     * Starts playing the animation.
     * 
     * @param {string} key - The unique key of the animation to play.
     * @throws {AnimationNotRegisteredError} - If the animation is not registered.
     */
    play(key) {
        const animation = this.animations.get(key);
        if (!animation) throw new AnimationNotRegisteredError(key);

        this.playingAnimation = { config: animation, currentIndex: 0, frameCount: 0 };
    }

    /**
     * Stops the currently playing animation.
     * 
     * @param {string} key - The key of the animation to stop.
     */
    stop(key) {
        if (this.playingAnimation !== null && key === this.playingAnimation.key) {
            this.playingAnimation = null;
        }
    }

    /**
     * Checks if a specific animation is currently playing.
     * 
     * @param {string} key - The key of the animation to check.
     * @returns {boolean} - Whether the animation is currently playing.
     */
    isPlaying(key) {
        return this.playingAnimation !== null && key === this.playingAnimation.key;
    }

    /**
     * Updates the playing animation frame. It is usually called every frame in the game loop.
     */
    update() {
        if (this.playingAnimation !== null) {

            // Change sprite frame
            if (this.playingAnimation.frameCount === this.playingAnimation.config.frameRate) {
                
                // Last frame of sprite sheet
                if (this.playingAnimation.config.numberOfFrames - 1 === this.playingAnimation.currentIndex) {

                    if (!this.playingAnimation.config.loop) {
                        this.playingAnimation = null;
                        return;
                    } else {
                        this.playingAnimation.currentIndex = 0;
                    }
                } else {
                    this.playingAnimation.currentIndex++;
                }

                this.playingAnimation.frameCount = 0;
            }

            this.playingAnimation.frameCount++;
        }
    }

    /**
     * Draws the current frame of the animation on the given canvas context.
     * 
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context to draw the animation frame on.
     * @param {Pos | undefined} 
     */
    draw(ctx, pos) {

        if (this.playingAnimation) {
            const image = this.sprite.screen.art.images.get(this.playingAnimation.config.spritesheet);
            ctx.drawImage(image, 
                this.playingAnimation.currentIndex * (this.sprite.width), 
                0, 
                this.sprite.width, 
                this.sprite.height, 
                this.sprite.pos.x, 
                this.sprite.pos.y, 
                this.sprite.width, 
                this.sprite.height);
        }
    }
}

/**
 * Error thrown when an animation is not registered.
 */
class AnimationNotRegisteredError extends Error {
    /**
     * @param {string} key - The key of the animation that wasn't registered.
     */
    constructor(key) {
        super(`Animation: ${key} not added.`);
    }
}