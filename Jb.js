import { Sprite } from "./pim-art/index.js";

export default class JB extends Sprite {
    /**
     * @param {Scene} scene
     * @param {Symbol} id
     * @param {{ x: number, y: number }} pos
     * @param {number} width
     * @param {number} height
     */
    constructor(scene) {
        super(scene, Symbol("jb"), {x: scene.art.width - 20 * 2, y: 100}, 20, 44);
        this.animations.create("jb", { type: "spritesheet", frames: "jb", frameRate: 3000, numberOfFrames: 2, startIdx: 0, loop: true });
        this.animations.play("jb");
    }

    update() {
        this.animations.update();
    }
}