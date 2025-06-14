import { NotImplementedError} from "./errors.js";

/**
 * @typedef {import("./Art.js").default} Art
 */

export default class Screen {

    /**
    * @description the art object that this screen belongs to, will be set by the Art class
    * @type {Art}
    */
    art;

    update() {
        throw new NotImplementedError("Screen", "update");
    }


    draw(ctx) {
        throw new NotImplementedError("Screen", "draw");
    }

}