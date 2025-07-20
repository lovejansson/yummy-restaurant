import { Scene, StaticImage } from "./pim-art/index.js";


/**
 * Dialog manager functions as a mail box or mail man were parts 
 * of the program can send messages and others can check if they have received any messages.
 */
export default class MessagesManager {

    /**
     * @type {Map<Symbol, {content: any, from: Symbol}>}
     */
    #messages;

    constructor() {
        this.#messages = new Map();
    }

    /**
     * @param {any} msg 
     * @param {string} from 
     * @param {Symbol[] | Symbol} to 
     */
    send(msg, from, to) {
        if(typeof to === 'symbol') {
            this.#messages.set(to, {content: msg, from});
        } else {
            for(const t of to) {
                this.#messages.set(t, {content: msg, from});
            }
        }
    }

     /**
     * @param {Symbol} to id for the receiver of the message
     */
    receive(to) {
        const message = this.#messages.get(to);

        // Message is 'picked up' 
        if(message !== undefined) {
            this.#messages.delete(to);
        }

        return message;
    }
}


/**
 * A message bubble that will be displayed on top of the art object for x amount of ms. 
 */
export class MessageBubble {
    /**
     * @type {boolean}
     */
    isShowing;

    /**
     * @param {Scene} scene 
     */
    constructor(scene) {
        this.scene = scene;
        this.isShowing = false;
        this.bubble = new StaticImage(scene, Symbol("msg-bubble"),  {x: 0, y: 0}, 15, 16, "msg-bubble");
        this.width = this.bubble.width;
        this.height = this.bubble.height;
    }

    /**
     * 
     * @param {StaticImage} msg 
     * @param {{x: number, y: number}} pos 
     * @param {number} [duration] 
     */
    showMessage(msg, pos, duration = 2000) {
        this.bubble.pos = pos;

        const bubbleCenterPos = {x: pos.x + this.bubble.width / 2, y: pos.y + this.bubble.height / 2};

        this.content = msg;

        this.content.pos = {x: Math.floor(bubbleCenterPos.x - this.content.width / 2), y: Math.floor(bubbleCenterPos.y - this.content.height / 2) };

        this.isShowing = true;

        setTimeout(() => {
            this.isShowing = false;
        }, duration);
    }

    draw(ctx) {
        if(this.isShowing) {
     
            this.bubble.draw(ctx);
            this.content.draw(ctx);
        }
    }
}