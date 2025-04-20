
import MusicPlayer from "./music-player/MusicPlayer.js";


const musicPlayer = document.querySelector("music-player");
musicPlayer.addEventListener("ready", () => {
    console.log("LOADED MUSIC PLAYER")
})