import AudioPlayer from "./AudioPlayer.js";
import ImagesManager from "./ImagesManager.js";
import {BASE_URL} from "./config.js";


/**
 * @typedef {import("./Screen.js").default} Screen
 */

/**
 * @typedef ArtConfig
 * 
 * @property {number} width
 * @property {number} height
 * @property {Screen} play
 * @property {Screen} pause
 * @property {string} canvasId
 */

/**
 * @description The main class for managing the art piece; switching between play and pause scenes, loading assets, and managing services like images and audio. 
 */
export default class Art  {

    /**
     * @type {boolean}
     */
    isPlaying;


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
     * @param {ArtConfig} config 
     */
    constructor(config) {

        this.images = new ImagesManager();
       // this.audio = new AudioPlayer();

        this.isPlaying = false;

        this.config = config;

        this.config.play.art = this;
        this.config.pause.art = this;
    }


    play() {
        this.#init().then(ctx => {
            this.#privatePlay(ctx);
        })
    }


    #privatePlay(ctx) {

        if(this.isPlaying) {
            ctx.clearReact(0, 0, this.config.width, this.config.height);
            this.config.play.update();
            this.config.play.draw(ctx);
        } else {
            this.config.pause.update();
            this.config.pause.draw(ctx);
        }

        requestAnimationFrame(() => this.#privatePlay(ctx));
    }


    async #init() {

        const canvas = document.querySelector(`#${this.config.canvasId}`);

        if(canvas === null) {
            console.error("canvas is null");
            throw new Error("canvas is null");
        }

        const ctx = canvas.getContext("2d");

        if(ctx === null) {
            console.error("ctx is null");
            throw new Error("ctx is null");
        }

        canvas.width = this.config.width;
        canvas.height = this.config.height;

        ctx.imageSmoothingEnabled = true; // For smooth scaling of images so that pixel art doesn't look blurry.

   
        await this.#loadAssets();

        canvas.addEventListener("click", () => {
            this.isPlaying = !this.isPlaying;
        });

        return ctx;
    }


    async #loadAssets() {
        
        const assets = await fetch(`${BASE_URL}assets.json`);

   
        if(!assets.ok) {

            console.error("Failed to load assets.json");
            throw new Error("Failed to load assets.json");
        }

        const json = await assets.json();

        if(json.images) {
            for (const {name, path} of json.images) {
                this.images.add(name, `${BASE_URL}${path}`);
            }

            await this.images.load();
        }

        // if(json.audio) {
         
        //     for (const {name, path} of json.audio) {
        //         this.audio.add(name, `${BASE_URL}${path}`);
        //     } 
        //     await this.audio.load();
       
        // }



    }
}