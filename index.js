
import {Art} from "./pim-art/index.js";
import Play from "./Play.js";
import Pause from "./Pause.js";
import EventsManager from "./EventsManager.js";
import MessagesManager from "./message.js";
import {Debugger} from "./debugger.js";

export const debug = Debugger(true);

const art = new Art({ 
    pause: new Pause(),
    play: new Play(),
    width: 400,
    height: 225,
    tileSize: 16,
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

addEventListener("keydown", (e) => {
  if (e.key === " " || e.key === "Spacebar") {
    e.preventDefault();
    togglePlayPause();
  } else if(e.key === "f" || e.key === "F") {
     art.enterFullScreen();
  }
});

/**
 * Communication from parent document (pimpixels): 
 * 
 * F/f keydown events is relayed here via message "enter-fullscreen".
 * Space keydown events is relayed here via message "toggle-play-pause".
 * 
 */
addEventListener("message", (event) => {
    const data = event.data;
    if(data.action === "toggle-play-pause"){
        togglePlayPause();
    } else if (data.action === "enter-fullscreen") {
        art.enterFullScreen();
    }
});

function togglePlayPause() {
 if(musicPlayerEl.isOn()) {
        musicPlayerEl.pause();
    } else {
        musicPlayerEl.play();
    }
}