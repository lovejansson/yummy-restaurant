import AudioPlayer from "./AudioPlayer.js";
import ImagesManager from "./ImagesManager.js";
import { debug } from "../index.js";

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

const FRAME_RATE_DEFAULT = 30;
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
        this.startTime = null;
    }


    async play() {   
        await this.#init();
        await this.#privatePlay(this.ctx);

        setInterval(()=> {
            const {hours, minutes, seconds} = diffHMS(new Date(), this.startTime)
            debug(`Time since start ${hours}:${minutes}:${seconds}`);
            for(const gg of this.config.play.guestGroups) {
                debug(`GuestGroup at table ${gg.table.tableNum} has state ${gg.state.name} ${gg.state.type ?? ""}`);
            }
        }, 1000 * 60 * 10); // every 10 minutes
    }


    /**
     * @param {boolean} val
     */
    set isPlaying(val) {

        if (val) {
            this.config.play.start();
            this.config.pause.stop();
        } else {
            this.config.play.stop();
            this.config.pause.start();
        }

        this.#isPlaying = val;
    }


    get isPlaying() {
        return this.#isPlaying;
    }

    /**
     * @param {CanvasRenderingContext2D} ctx
     */
    async #privatePlay(ctx, elapsed = 0) {
   try {
        this.elapsedAcc = (this.elapsedAcc || 0) + elapsed - this.elapsedPrev;

        if (this.elapsedAcc >= (1000 / (this.frameRate))) {

            if (this.#isPlaying) {

                if (!this.config.play.isInitialized) {
                    await this.config.play.init();
                }

                const currentTransform = ctx.getTransform();
                ctx.clearRect(0 - currentTransform.e, 0 - currentTransform.f, this.width, this.height);

                this.config.play.update();
                this.config.play.draw(ctx);

            } else {

                if (!this.config.pause.isInitialized) {
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

        } catch (e) {
                const {hours, minutes, seconds} = diffHMS(new Date(), this.startTime)
                console.log(`Time since start ${hours}:${minutes}:${seconds}`);
                console.error(e);
                this.isPlaying = false;
        }

        requestAnimationFrame((elapsed) => {
            this.#privatePlay(ctx, elapsed) 
        });
    }


    async #init() {
        this.startTime = new Date();
        const ctx = this.#initCanvas(this.config.canvas || CANVAS_SELECTOR_DEFAULT);

        this.config.play.art = this;
        this.config.pause.art = this;

        addEventListener("keydown", (e) => {

            if (!this.keys.up && ["ArrowUp", "w", "w"].includes(e.key)) {
                this.keys.up = true;
            } else if (!this.keys.right && ["ArrowRight", "d", "D"].includes(e.key)) {
                this.keys.right = true;
            } else if (!this.keys.down && ["ArrowDown", "s", "S"].includes(e.key)) {
                this.keys.down = true;
            } else if (!this.keys.left && ["ArrowLeft", "a", "A"].includes(e.key)) {
                this.keys.left = true;
            } else if (!this.keys.space && [" "].includes(e.key)) {
                this.keys.space = true;
            }
        });

        addEventListener("keyup", (e) => {

            if (this.keys.up && ["ArrowUp", "w", "w"].includes(e.key)) {
                this.keys.up = false;
            } else if (this.keys.right && ["ArrowRight", "d", "D"].includes(e.key)) {
                this.keys.right = false;
            } else if (this.keys.down && ["ArrowDown", "s", "S"].includes(e.key)) {
                this.keys.down = false;
            } else if (this.keys.left && ["ArrowLeft", "a", "A"].includes(e.key)) {
                this.keys.left = false;
            } else if (this.keys.space && [" "].includes(e.key)) {
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

        if (this.config.willReadFrequently) {
            ctx.willReadFrequently = this.config.willReadFrequently; // Enable willReadFrequently for better performance when reading pixel data frequently.
        }

        ctx.imageSmoothingEnabled = true; // For smooth scaling of images so that pixel art doesn't look blurry.

        return ctx;

    }
}

function diffHMS(date1, date2) {
  // difference in milliseconds
  let diff = Math.abs(date2 - date1);

  const hours = Math.floor(diff / (1000 * 60 * 60));
  diff -= hours * 1000 * 60 * 60;

  const minutes = Math.floor(diff / (1000 * 60));
  diff -= minutes * 1000 * 60;

  const seconds = Math.floor(diff / 1000);

  return { hours, minutes, seconds };
}