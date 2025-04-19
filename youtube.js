export async function getSongs() {

    const channelIdRes = await fetch("https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=@love321Nine&" + "key=" + "AIzaSyBTo6fA6FG3EMktAx93lAxD2blSbuej1Sg");
    const channelId = await channelIdRes.json();
 
    const playListsRes = await fetch("https://www.googleapis.com/youtube/v3/playlists?key=" + "AIzaSyBTo6fA6FG3EMktAx93lAxD2blSbuej1Sg&channelId=" + channelId.items[0].id);
     
    const playLists = await playListsRes.json();

    const playListItemsRes = await fetch ("https://www.googleapis.com/youtube/v3/playlistItems?key=" + "AIzaSyBTo6fA6FG3EMktAx93lAxD2blSbuej1Sg&playlistId=" + playLists.items[0].id + "&part=snippet,contentDetails&maxResults=50" );
    
    const playListItems =  await playListItemsRes.json();

    return playListItems.items.map(i => ({title:  i.snippet.description.split("\n").slice(1).find(el => el !== ""), videoId: i.snippet.resourceId.videoId}));
}