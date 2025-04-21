
import MusicPlayer from "./music-player/MusicPlayer.js";
import Table from "./Table.js";
import EventsManager
 from "./EventManager.js";

const musicPlayer = document.querySelector("music-player");

const canvas = document.querySelector("canvas");

const ctx = canvas.getContext("2d");

musicPlayer.addEventListener("ready", () => {
    console.log("LOADED MUSIC PLAYER")
});

const table = new Table({x: 50, y: 50}, 25, 25);

table.draw(ctx);



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
 * 
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