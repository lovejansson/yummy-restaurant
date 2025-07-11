
/** 
* @typedef {import("./objects/Sprite.js").default} Sprite
*/

/**
 * @typedef {(SpriteSheetAnimation | FramesArray) & {loop: boolean}} AnimationConfig
 */


/**
 * @typedef FramesArray
 * @property {"frames"} type 
 * @property {{image: string, duration: number}[]} frames
 */

/**
 * @typedef SpriteSheetAnimation
 * @property {"spritesheet"} type 
 * @property {string} frames
 * @property {number} frameRate
 * @property {number} numberOfFrames
 * @property {number} [startIdx]
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

        /** @type {{config: AnimationConfig, currentIndex: number, frameCount: number}|null} */
        this.playingAnimation = null;  

        
    }

    /**
     * Creates and adds a new animation. 
     * 
     * @param {string} key 
     * @param {AnimationConfig} config
     */
    create(key, config) {
        if(config.type === "spritesheet" && config.startIdx === undefined) config.startIdx = 0;
        this.animations.set(key, config);
    }

    /**
     * Starts playing the animation.
     * 
     * @param {string} key
     * @throws {AnimationNotAddedError}
     */
    play(key) {


        const animation = this.animations.get(key);

        if (!animation) throw new AnimationNotAddedError(key);

        this.playingAnimation = { key, config: animation, currentIndex: animation.type === "spritesheet" ? animation.startIdx : 0, frameCount: 0 };
    }

    /**
     * Stops the currently playing animation.
     * 
     * @param {string} key
     */
    stop(key) {
        if (this.playingAnimation !== null && key === this.playingAnimation.key) {
            this.playingAnimation = null;
        }
    }

    /**
     * Checks if a specific animation is currently playing.
     * 
     * @param {string} key
     * @returns {boolean}
     */
    isPlaying(key) {
        return this.playingAnimation !== null && key === this.playingAnimation.key;
    }

    update() {
        if (this.playingAnimation !== null) {
            if(this.playingAnimation.config.type === "frames") {

                if(this.playingAnimation.frameCount >= Math.floor(this.playingAnimation.config.frames[this.playingAnimation.currentIndex].duration / (1000 / 60))) {

                    if (this.playingAnimation.config.frames.length - 1 === this.playingAnimation.currentIndex) {

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

            } else if (this.playingAnimation.config.type === "spritesheet") {
                // 1000 / 60 = 16.67 ms per frame 
                // 100 / 16.67 = 5.99 update frames in art cycle per sprite frame 
                 if (this.playingAnimation.frameCount >= Math.floor(this.playingAnimation.config.frameRate / (1000 / this.sprite.scene.art.frameRate))) {
                
                    if (this.playingAnimation.config.numberOfFrames - 1 === this.playingAnimation.currentIndex - this.playingAnimation.config.startIdx ) {
        
                        if (!this.playingAnimation.config.loop) {
            
                            this.playingAnimation = null;
                            return;
                        } else {
                            this.playingAnimation.currentIndex = this.playingAnimation.config.startIdx;
                        }

                    } else {
                        this.playingAnimation.currentIndex++;
                    }

                    this.playingAnimation.frameCount = 0;
                }

                this.playingAnimation.frameCount++;

            } else {
                throw new Error("Unknown animation type: " + this.playingAnimation.config.animation.type);
            } 
        }
    }

    /**
     * Draws the current frame of the animation on the given canvas context.
     * 
     * @param {CanvasRenderingContext2D} ctx 
     */
    draw(ctx) {

        if (this.playingAnimation) {

            if(this.playingAnimation.config.type === "frames") {
                const image = this.sprite.scene.art.images.get(this.playingAnimation.config.frames[this.playingAnimation.currentIndex].image);
                ctx.drawImage(image, 
                    this.playingAnimation.currentIndex * (this.sprite.width), 
                    0, 
                    this.sprite.width, 
                    this.sprite.height, 
                    this.sprite.pos.x, 
                   this.sprite.pos.y, 
                    this.sprite.width, 
                    this.sprite.height);
            } else if (this.playingAnimation.config.type === "spritesheet") {
                const image = this.sprite.scene.art.images.get(this.playingAnimation.config.frames);
                ctx.drawImage(image,
                    this.playingAnimation.currentIndex * this.sprite.width,
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
}


class AnimationNotAddedError extends Error {
    constructor(key) {
        super(`Animation: ${key} not added.`);
    }
}