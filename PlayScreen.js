import { Screen } from "./lib/index.js";
import EventsManager from "./EventManager.js";
import { createGrid } from "./path.js";
import { EVENT_TYPE } from "./EventManager.js";
import  Waiter from "./Waitor.js";

const TABLE_WIDTH = 32;
const TABLE_HEIGHT = 32;
const ROWS = 14;
const COLS = 20;

export const grid = createGrid(ROWS, COLS, 1);

const eventsManager = EventsManager.GetInstance();
eventsManager.add({name: EVENT_TYPE.GUEST_ORDER_DRINK, data: {pos: {row: 7, col: 6}}})


export default class Play extends Screen {
    constructor() {
        super();
        this.art = null; // Will be set by the Art class
        this.waiter = new Waiter("waitor1", {x: 0, y: 2 * 16}, 16, 16);


    }

    update() {
        waitor.update();
        waitor.draw(ctx);
    }

    draw(ctx) {
        console.log("Play.draw()");
        ctx.clearRect(0, 0, this.art.config.width, this.art.config.height);

        const background = new StaticImage({x: 0, y: 0}, 320, 226, "static");

        background.draw(ctx);

        
        ctx.fillStyle = "black";
        
        for(const r of [2, 7, 12]) {
            for (let c = 0; c < COLS -4 ; ++c) {
                grid[r][c] = 0;
                ctx.fillRect(c * 16, r * 16,  16, 16);
            }
        }

        for(const c of [0, 5, 10, 15]) {
            for(let r = 2; r < ROWS; ++r) {
                grid[r][c] = 0;
                ctx.fillRect(c * 16, r * 16,  16, 16);
            }
        }

        drawGrid(ctx, ROWS, COLS, 16);

        this.#drawTables();

        waitor.draw(ctx);

    }

    #drawTables() {
        let firstX = 32;
        let firstY = 64;
    
        for(let r = 0; r < 2; ++r) {
            for (let c = 0; c < 3; ++c) {
                const table = new StaticImage({x: firstX + c * 80, y: firstY + r * 80}, TABLE_WIDTH, TABLE_HEIGHT, "table");
                table.draw(ctx);
            }
        }
    }
    
}