import { ArtObject, Scene, StaticImage } from "./pim-art/index.js";


/**
 * Dialog manager functions as a mail box or mail man were parts 
 * of the program can send messages and others can check if they have received any messages.
 */
export default class MessagesManager {

    /**
     * @type {Map<Symbol, {content: any, from: ArtObject}>}
     */
    #messages;

    constructor() {
        this.#messages = new Map();
    }

    /**
     * @param {any} msg 
     * @param {ArtObject} from 
     * @param {ArtObject[] | ArtObject} to 
     */
    send(msg, from, to) {
        if(Array.isArray(to)) {
             for(const t of to) {
                this.#messages.set(t.id, {content: msg, from});
            }
           
        } else {
           this.#messages.set(to.id, {content: msg, from});
        }
    }

     /**
     * @param {ArtObject} to id for the receiver of the message
     */
    receive(to) {
        const message = this.#messages.get(to.id);

        // Message is 'picked up' 
        if(message !== undefined) {
            this.#messages.delete(to.id);
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
        this.halfWidth = this.bubble.halfWidth;
        this.halfHeight = this.bubble.halfHeight;
    }

    /**
     * 
     * @param {StaticImage} msg 
     * @param {{x: number, y: number}} bubblePos 
     * @param {number} [duration] 
     */
    showMessage(msg, bubblePos, duration = 2000) {
        this.bubble.pos = bubblePos;

        const bubbleCenterPos = {x: bubblePos.x + this.bubble.halfWidth, y: bubblePos.y + this.bubble.halfHeight};

        this.content = msg;

        this.content.pos = {x: Math.floor(bubbleCenterPos.x - this.content.halfWidth), y: Math.floor(bubbleCenterPos.y - this.content.halfHeight) };

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