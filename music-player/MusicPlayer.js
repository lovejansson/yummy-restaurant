import "../array.js";
import { getSongs } from "./youtube.js";

const playIcon = '<svg class="icon" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M10 20H8V4h2v2h2v3h2v2h2v2h-2v2h-2v3h-2v2z" fill="currentColor"/> </svg>';
const pauseIcon = '<svg class="icon" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"> <path d="M10 4H5v16h5V4zm9 0h-5v16h5V4z" fill="currentColor"/> </svg>';

const MAX_VOLUME = 100;
const DEFAULT_VOLUME = 20;

export default class MusicPlayer extends HTMLElement {
    static observedAttributes = ["channel", "playlist"];

    youTubePlayer;
    
    /**
     * @type {HTMLDivElement}
     */
    volumeControl;

    /**
     * @type {HTMLParagraphElement}
     */
    songTitle;

    constructor() {
        super();
        const template = document.getElementById("template-player");
        const templateContent = template.content;
        const shadowRoot = this.attachShadow({ mode: "open" });
        shadowRoot.appendChild(templateContent.cloneNode(true));
    }

    async connectedCallback() {

        const playerContainer = this.shadowRoot.querySelector("#player-container");
        const btnPlayPause = this.shadowRoot.querySelector("#btn-play-pause");
        const btnShuffle =  this.shadowRoot.querySelector("#btn-shuffle");
        const volumeControl =  this.shadowRoot.querySelector("#volume-control");
        const songTitle =  this.shadowRoot.querySelector("#song-title");
        const youtubePlayerDiv = this.shadowRoot.querySelector("#youtube-player");

        if(!playerContainer) throw new Error("Missing DOM element: player container");
        if (!youtubePlayerDiv) throw new Error("Missing DOM element: youtube-player");
        if (!btnPlayPause) throw new Error("Missing DOM element: btnPlayPause");
        if (!btnShuffle) throw new Error("Missing DOM element: btnShuffle");
        if (!volumeControl) throw new Error("Missing DOM element: volumeControl");
        if (!songTitle) throw new Error("Missing DOM element: songTitle");

        playerContainer.style.display = "none";

        this.songTitle = songTitle
        this.songs = await getSongs(this.getAttribute("channel"), this.getAttribute("playlist"));
        this.volumeControl = volumeControl;

        this.youTubePlayer = new YT.Player(youtubePlayerDiv, {
            videoId: this.songs.random(),
            height: "1px",
            width: "1px",
            events: {
                'onReady': () => {
                    this.pickSong();
                    playerContainer.style.display = "flex";
                    this.dispatchEvent(new Event("ready"));
                } ,
                'onStateChange': this.handlePlayerStateChange.bind(this),
            },
        });

        this.renderVolumeControl(DEFAULT_VOLUME);

        btnPlayPause.addEventListener("click", () => {
            if (this.youTubePlayer && this.youTubePlayer.getPlayerState() === 1) {
                this.youTubePlayer.pauseVideo();
                btnPlayPause.innerHTML = playIcon;
            } else {
                this.youTubePlayer.playVideo();
                btnPlayPause.innerHTML = pauseIcon;
            }
        });

        btnShuffle.addEventListener("click", () => {
            this.pickSong();
        });

        btnShuffle.addEventListener("click", () => {
            if (this.youTubePlayer && this.youTubePlayer.getPlayerState() === 1) {
                this.youTubePlayer.pauseVideo();
                btnPlayPause.innerHTML = playIcon;
            } else {
                this.youTubePlayer.playVideo();
                btnPlayPause.innerHTML = pauseIcon;
            }
        });

    }


    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`Attribute ${name} has changed.`, oldValue, newValue);
    }

    handlePlayerStateChange(event) {
        // If song is done (0)
        if (event.data === 0) {
            this.pickSong();
            event.target.playVideo();
        }
    }

    pickSong() {
        const song = this.songs.random();
        this.youTubePlayer.loadVideoById(song.videoId);
        this.songTitle.textContent = song.title;
    }

    renderVolumeControl(volume) {

        this.volumeControl.replaceChildren();

        for (let i = 0; i < 5; ++i) {
            const button = document.createElement("button");

            if ((MAX_VOLUME / 5) * (i + 1) <= volume) {
                button.classList.add("square-filled");
            } else {

                button.classList.add("square-empty");
            }

            button.addEventListener("click", () => {
                const newVolume = (MAX_VOLUME / 5) * (parseInt(i) + 1);
                const finalVolume = volume === newVolume ? volume - MAX_VOLUME / 5 : newVolume;
                this.youTubePlayer.setVolume(finalVolume);
                this.renderVolumeControl(finalVolume);
            });

            this.volumeControl.appendChild(button);
        }
    }

}

customElements.define("music-player", MusicPlayer);