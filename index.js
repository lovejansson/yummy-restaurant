import {getSongs} from "./youtube.js";
import "./array.js"

const songs = await getSongs()

let youTubePlayer;

const buttonPlayPause = document.querySelector("#play-pause");

const canvas = document.querySelector("canvas");

const playerTitle = document.querySelector("#player-title");

const play = '&#9654;';
const pause = '&#x23f8;'


if(canvas) {
    canvas.addEventListener("click", () => {
        if(youTubePlayer && youTubePlayer.getPlayerState() === 1) {
            youTubePlayer.pauseVideo();
            buttonPlayPause.innerHTML = play;
        } else {
            youTubePlayer.playVideo();
            buttonPlayPause.innerHTML = pause;
        }
    });
}


function onYouTubeIframeAPIReady() {

    youTubePlayer = new YT.Player('youtube-player', {    
        height: "1px",
        width: "1px",
        events: {
            'onReady': handlePlayerReady,
            'onStateChange': handlePlayerStateChange
          }
  });
}


function handlePlayerStateChange(event) {
    if(event.data === 0) {
        pickSong();
        event.target.playVideo();
    }
}


function handlePlayerReady() {
    pickSong();
}

function pickSong() {
    const song = songs.random();
    youTubePlayer.loadVideoById(song.videoId);
    playerTitle.innerHTML = song.title;
}

onYouTubeIframeAPIReady();