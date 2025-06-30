
import {Art} from "./pim-art/index.js";
import Play from "./Play.js";
import Pause from "./Pause.js";
import EventsManager from "./EventsManager.js";
import MessagesManager from "./message.js";


const art = new Art({ 
    pause: new Pause(),
    play: new Play(),
    width: 400,
    height: 225,
    canvas: "#art-canvas",
    services: {events: new EventsManager(), messages: new MessagesManager()},
});

art.play();
   

const musicPlayerEl = document.querySelector("music-player");

musicPlayerEl.addEventListener("play", () => {
    if(!art.isPlaying) {
        art.isPlaying = true;
    }
});


musicPlayerEl.addEventListener("pause", () => {
    if(art.isPlaying) {
        art.isPlaying = false;
    }
});