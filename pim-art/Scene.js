import { NotImplementedError} from "./errors.js";

/**
 * @typedef {import("./Art.js").default} Art
 */

export default class Scene {

    /**
    * @description the art object that this scene belongs to, will be set by the Art class
    * @type {Art}
    */
    art;

    /**
    * @type {boolean}
    */
    isInitialized;

    constructor() {
        if (new.target === Scene) {
            throw new TypeError("Cannot construct Scene instances directly");
        }

        this.art = null; // Will be set by the Art class on initialization. 
        this.isInitialized = false; // Will be set by the Scene subclass on initialization.
    }

    async init(){
        throw new NotImplementedError("Scene", "init");
    }

    draw() {
        throw new NotImplementedError("Scene", "draw");
    }

    update() {  
    }

    start() {
    }

    stop() {
    }

}