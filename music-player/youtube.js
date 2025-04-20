

const BASE_URL = "https://www.googleapis.com/youtube/v3";
const API_KEY = "AIzaSyBTo6fA6FG3EMktAx93lAxD2blSbuej1Sg";

/**
 * 
 * @param {string} channel the name of the channel 
 * @param {string} playlist the name of the playlist
 * @returns {Promise<{title: string, videoId: string}[]>} list of songs including the title and the video id
 */
export async function getSongs(channel, playlist) {

    const channelIdRes = await fetch(`${BASE_URL}/channels?part=id&forHandle=${channel}&key=${API_KEY}`);
    const channelId = await channelIdRes.json();
 
    const playListsRes = await fetch(`${BASE_URL}/playlists?key=${API_KEY}&channelId=${channelId.items[0].id}&part=snippet`);
    const playLists = await playListsRes.json();

    const playList = playLists.items.find(p => p.snippet.title === playlist);

    if(playList === undefined) throw new Error("Youtube: playlist not found");

    console.log(playLists)

    const playListItemsRes = await fetch(`${BASE_URL}/playlistItems?key=${API_KEY}&playlistId=${playList.id}&part=snippet,contentDetails&maxResults=50`);
    
    const playListItems =  await playListItemsRes.json();

    return playListItems.items.map(i => ({title:  i.snippet.description.split("\n").slice(1).find(el => el !== ""), videoId: i.snippet.resourceId.videoId}));
}