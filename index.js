
import MusicPlayer from "./music-player/MusicPlayer.js";
import {Art} from "./lib/index.js";
import Play from "./PlayScreen.js";
import Pause from "./Pause.js";


const art = new Art({
    pause: new Pause(),
    play: new Play(),
    width: 320,
    height: 266,
    canvasId: "art-canvas"
});

art.play();
   