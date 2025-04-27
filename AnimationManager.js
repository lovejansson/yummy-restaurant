import AssetManager from "./AssetManager";

/**
 * @typedef {Object} AnimationConfig
 * @property {(string|string[])} frames - An array of string asset keys or a single string key for a sprite sheet asset.
 * @property {boolean} loop - Whether the animation should loop.
 * @property {number} [numberOfFrames] - Optional number of frames to play in the animation.
 */

/**
 * Manages the animations for a given game object.
 */
export class AnimationManager {

    /**
     * @param {GameObject} obj - The game object that this animation manager controls.
     */
    constructor(obj) {
        /** @type {GameObject} */
        this.obj = obj;

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

        

        this.playingAnimation = { config: animation, key, currentIndex: 0, frameCount: 0 };
    }

    /**
     * Stops the currently playing animation.
     * 
     * @param {string} key - The key of the animation to stop.
     */
    stop(key) {
        if (key === this.playingAnimation?.key) {
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
        return key === this.playingAnimation?.key;
    }

    /**
     * Updates the playing animation frame. It is usually called every frame in the game loop.
     */
    update() {
        if (this.playingAnimation !== null) {
            // Change sprite frame
            if (this.playingAnimation.frameCount === 5) {
                // If it is the last frame, check if it should loop or stop
                if ((this.playingAnimation.config.numberOfFrames ?? 0) - 1 === this.playingAnimation.currentIndex
                    || this.playingAnimation.currentIndex === this.playingAnimation.config.frames.length - 1) {
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

            // Is sprite sheet
            if (typeof this.playingAnimation.config.frames === "string") {
                const image = AssetManager.getInstance().get(this.playingAnimation.config.frames);
                ctx.drawImage(image, this.playingAnimation.currentIndex * (this.obj.width / 2), 0, this.obj.width / 2, this.obj.height / 2, pos.x || this.obj.pos.x, pos.y || this.obj.pos.y, this.obj.width, this.obj.height);
            } else {
                const image = AssetManager.getInstance().get(this.playingAnimation.config.frames[this.playingAnimation.currentIndex]);
                ctx.drawImage(image, this.obj.pos.x, this.obj.pos.y);
            }
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
        super(`Animation: ${key} not registered.`);
    }
}
