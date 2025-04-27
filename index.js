
import MusicPlayer from "./music-player/MusicPlayer.js";
import Table from "./Table.js";
import EventsManager
, { EVENT_TYPE } from "./EventManager.js";
import { createPathBFS, drawGrid, createGrid, createPathAStar } from "./path.js";
import Waitor from "./Waitor.js";

const musicPlayer = document.querySelector("music-player");

const canvas = document.querySelector("canvas");

const ctx = canvas.getContext("2d");

const rows = 10;
const cols = 20;

canvas.width = 64 * cols;
canvas.height = 64 * rows;

export const grid = createGrid(rows, cols, 0);

const waitor = new Waitor("waitor1", {x: 0, y: 0}, 64, 64);

drawGrid(ctx, rows, cols, 64)

const table = (row, col) => {
    const cells = [];
    for(let r = 0; r < 2; ++r) {
        for(let c = 0; c < 2; ++c) {
            cells.push({row: r + row, col: c + col});
        }
    } 

    return cells;
}



const tableCells = [
   ...table(1, 1), ...table(1, 6),
   ...table(6, 1), ...table(6, 6)
];


ctx.fillStyle = "black";

for(let r = 0; r < rows; ++r) {
    for(let c = 0; c < cols; ++c) {
        if(tableCells.find((tC) => tC.row == r && tC.col == c) !== undefined) {
            ctx.fillRect(c * 64, r * 64,  64, 64);
            grid[r][c] = 1;
        }
    }
}

const path = createPathAStar({row: 0, col: 0}, {row: 4, col: 6}, grid);
ctx.fillStyle = "red";


for (const c of path) {
    ctx.fillRect(c.col * 64, c.row * 64,  64, 64);
}

const eventsManager = EventsManager.GetInstance();
eventsManager.add({name: EVENT_TYPE.GUEST_ORDER_DRINK, data: {pos: {row: 4, col: 6}}})

function play() {
    waitor.update();
    waitor.draw(ctx);
    requestAnimationFrame(play);
}

play();


/**
 * 
 * Waitor States
 * 
 * Idle -> standing at some position watching justin. (Might say commentary stuff and look at someone next to them)
 * 
 * WalkingState -> Har alltid ett mål? och sköter animering för walk
 * 
 * WalkingToPlaceWhereOrderIsPlaced
 * 
 * WalkingToPickUpOrder
 * 
 * WalkingToGuestWithOrder
 * 
 * WalkingToGuest -> Walks to guest at some position when there is a guest that 'needs something' (Hur ska det statet skötas?)
 * s
 * WalkingToArrivingGuest
 * 
 * WalkingToTable to escort Guest there
 * 
 * DialogState -> När waitor talks to guest in some way
 * 
 * TakingOrder -> Takes order from guest
 * 
 * LeavingOrder -> Guest receives the order
 * 
 * PlacesOrder -> places order at kitchen
 * 
 * PickupOrder -> Picks up order from kitchen
 * 
 * 
 * Guest States
 * 
 * Walking States:
 * 
 * WalkingState Walks after Waitor to table / walks out of resturant
 * 
 * IdleStates:
 * 
 * EatingState -> Eats makes eating sounds 
 * 
 * DrinkingState -> Drinks makes drinking sounds
 * 
 * ListeningToMusic -> listens to music, comments music 
 *
 * DialogStates:
 * 
 * Ordering (drinks, food, dessert, taking the bill)
 * 
 * Receiving order
 * 
 * 
 * Guest måste inte veta nånting 
 * 
 * Waitor måste veta om en guest vill ha något så det måste finns något event system som säger det
 * 
 */