import AudioPlayer from "./AudioPlayer.js";
import ImagesManager from "./ImagesManager.js";

/**
 * @typedef {import("./Scene.js").Scene} Scene
 */


/**
 * @typedef ArtConfig
 * 
 * @property {number} width Width of the art canvas
 * @property {number} height Height of the art canvas
 * @property {tileSize} tileSize The size of each tile in the art canvas
 * @property {Scene} play The play scene
 * @property {Scene} pause The pause scene
 * @property {string} canvas The canvas css selector
 * @property {number} [frameRate] The frame rate of update cycle
 * @property {boolean} [willReadFrequently] Attribute for CanvasRendering2Dcontext see [MDN](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/getContextAttributes) for reference. 
 * @property {{}} [services] Custom services to the art instance
 * @property {{}} [state] Custom state to the art instance
 */

const FRAME_RATE_DEFAULT = 60; 
const CANVAS_SELECTOR_DEFAULT = "canvas";
const DEFAULT_TILE_SIZE = 16;


/**
 * @description The main class for managing the art piece; switching between the play and pause scenes, loading assets, and managing services like images and audio. 
 */
export default class Art {

    /**
    * @type {{ 
    * up: boolean,
    * right: boolean,
    * down: boolean,
    * left: boolean,
    * space: boolean}}
    */
    keys;

    /**
     * @type {boolean}
     */
    #isPlaying;

    /**
     * @type {ImagesManager}
     */
    images;

    /**
     * @type {AudioPlayer}
     */
    audio;

    /**
     *  @type {ArtConfig}
     */
    config;

    /**
     * @type {CanvasRenderingContext2D}
     */
    ctx;

    /**
     * @type {{}?} 
     */
    services;

    /**
     * @type {{}?} 
     */
    state;

    /**
     * @param {ArtConfig} config 
     */
    constructor(config) {
        this.images = new ImagesManager();
        this.audio = new AudioPlayer();
        this.#isPlaying = false;
        this.config = config;
        this.elapsedAcc = 0; 
        this.elapsedPrev = 0; 
        this.width = config.width;
        this.height = config.height;
        this.tileSize = config.tileSize || DEFAULT_TILE_SIZE; // Default tile size is 16px
        this.state = config.state ? config.state : null;
        this.services = config.services ? config.services : null;
        this.keys = { 
            up: false,
            right: false,
            down: false,
            left: false,
            space: false
        }
        this.frameRate = config.frameRate || FRAME_RATE_DEFAULT; 
    }


    play() {
        this.#init().then(() => {
            this.#privatePlay(this.ctx);
        });
    }

    
    /**
     * @param {boolean} val
     */
    set isPlaying(val) {

        if(val) {
            this.config.play.start();
            this.config.pause.stop();
        } else {
            this.config.play.stop();
            this.config.pause.start();
        }

        this.#isPlaying = val;
    }


    get isPlaying(){
        return this.#isPlaying;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    async #privatePlay(ctx, elapsed = 0) {

        this.elapsedAcc = (this.elapsedAcc || 0) + elapsed - this.elapsedPrev;
  
        if(this.elapsedAcc >= (1000 / (this.frameRate))) {

            if (this.#isPlaying) {
                
                if(!this.config.play.isInitialized) {
                    await this.config.play.init();
                }

                const currentTransform = ctx.getTransform();
                ctx.clearRect(0 - currentTransform.e, 0 - currentTransform.f, this.width, this.height);

                this.config.play.update();
                this.config.play.draw(ctx);

            } else {
           
                if(!this.config.pause.isInitialized) {
                    await this.config.pause.init();
                }

                const currentTransform = ctx.getTransform();

                ctx.clearRect(0 - currentTransform.e, 0 - currentTransform.f, this.width, this.height);
            
                this.config.pause.update();
                this.config.pause.draw(ctx);
            }

            this.elapsedAcc = 0;
        }

        this.elapsedPrev = elapsed;
        requestAnimationFrame((elapsed) => this.#privatePlay(ctx, elapsed));
    }


    async #init() {

        const  ctx = this.#initCanvas(this.config.canvas || CANVAS_SELECTOR_DEFAULT);
    
        this.config.play.art = this; 
        this.config.pause.art = this; 

        addEventListener("keydown",  (e) => {

            if(!this.keys.up && ["ArrowUp", "w", "w"].includes(e.key)) {
                this.keys.up = true;
            } else if(!this.keys.right && ["ArrowRight", "d", "D"].includes(e.key)) {
                this.keys.right = true;
            } else if(!this.keys.down && ["ArrowDown", "s", "S"].includes(e.key)) {
                this.keys.down = true;
            } else if(!this.keys.left && ["ArrowLeft", "a", "A"].includes(e.key)) {
                this.keys.left = true;
            } else if(!this.keys.space && [" "].includes(e.key)) {
                this.keys.space = true;
            }
        });

        addEventListener("keyup",  (e) => {

            if(this.keys.up && ["ArrowUp", "w", "w"].includes(e.key)) {
                this.keys.up = false;
            } else if(this.keys.right && ["ArrowRight", "d", "D"].includes(e.key)) {
                this.keys.right = false;
            } else if(this.keys.down && ["ArrowDown", "s", "S"].includes(e.key)) {
                this.keys.down = false;
            } else if(this.keys.left && ["ArrowLeft", "a", "A"].includes(e.key)) {
                this.keys.left = false;
            } else if(this.keys.space && [" "].includes(e.key)) {
                this.keys.space = false;
            }
        });

        this.ctx = ctx;

    }


    #initCanvas(selector) {
        const canvas = document.querySelector(selector);

        if (canvas === null) {
            console.error("canvas is null");
            throw new Error("canvas is null");
        }

        const ctx = canvas.getContext("2d");

        if (ctx === null) {
            console.error("ctx is null");
            throw new Error("ctx is null");
        }

        canvas.width = this.width;
        canvas.height = this.height;

        if(this.config.willReadFrequently) {
            ctx.willReadFrequently = this.config.willReadFrequently; // Enable willReadFrequently for better performance when reading pixel data frequently.
        }

        ctx.imageSmoothingEnabled = true; // For smooth scaling of images so that pixel art doesn't look blurry.

        return ctx;

    }
}