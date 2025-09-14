import { Sprite } from "./pim-art/index.js";

export default class Dan extends Sprite {
    /**
     * @param {Scene} scene
     * @param {Symbol} id
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     */
    constructor(scene) {
        super(scene, Symbol("dan"), {x: scene.art.width - 20 * 2, y: 75}, 20, 44);
        this.animations.create("dan", { type: "spritesheet", frames: "dan", frameRate: 250, numberOfFrames: 2, startIdx: 0, loop: true });
        this.animations.play("dan");
    }

    update() {
        this.animations.update();
    }
}