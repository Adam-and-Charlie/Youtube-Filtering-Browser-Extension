const favTeamsLocalStorageKey = "favTeamsData";
var vid_titles = [];
var prev_vid_title_count = 0;
var regex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g; // to remove punctuation from vid titles
if(localStorage.getItem(favTeamsLocalStorageKey) != null)
{var keywords = localStorage.getItem(favTeamsLocalStorageKey).split(",");}
else
{var keywords = []}
chrome.runtime.onMessage.addListener(receiver); // Receiving the popup.js message with favourite teams

function getTitles(){
    vid_titles = [];
    let title;
    let yt_content_tags = [
        "ytd-rich-grid-media", "ytd-rich-grid-slim-media", "ytd-grid-video-renderer",
        "ytd-grid-playlist-renderer", "ytd-compact-video-renderer", "ytd-video-renderer", 
        "ytd-compact-radio-renderer", "ytd-radio-renderer", "ytd-reel-item-renderer"]
    let all = []
    yt_content_tags.forEach(elem => {
        all = all.concat(Array.prototype.slice.call(document.getElementsByTagName(elem)))
    });
    for (let i=0; i<all.length; i++){
        title = all[i].querySelector("#video-title");
        if (!vid_titles.includes(title) && (title.innerText.replace(regex, "").toLowerCase().split(" ").filter(elem => keywords.includes(elem))).length > 0){
            // if the vid title contains a word from the keywords
            vid_titles.push(title);
        }
    }
}

function blurUnwantedVids(){
    for (let i=0; i<vid_titles.length; i++){
        vid_titles[i].parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.background = "red";
    }
}

function unBlurUnwantedVids(){
    for (let i=0; i<vid_titles.length; i++){
        vid_titles[i].parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.style.background = "";
    }
}

// get the titles before the user starts scrolling
setTimeout(()=>{
    getTitles(); 
    blurUnwantedVids();
}, 500); //wait 0.5 sec so that all vids load

let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
window.onscroll = function (e) { // get the titles that load after the user scrolls
    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
    if (currentScroll > lastScrollTop){
        prev_vid_title_count = vid_titles.length;
        getTitles();
        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }
    if (vid_titles.length > prev_vid_title_count){ // if more vid titles added to the vid title arr
        blurUnwantedVids();
    }
}

// Receiving the message as an event object
function receiver(request) {
    // Update keywords
    unBlurUnwantedVids();
    console.log(request);
    if (request["subject"] == "favTeams"){
        let popupFavTeams = request["data"];
        if (popupFavTeams != null){
            localStorage.setItem(favTeamsLocalStorageKey, popupFavTeams);
            keywords = localStorage.getItem(favTeamsLocalStorageKey).split(",");
        }
        else{
            localStorage.removeItem(favTeamsLocalStorageKey);
            keywords = []
        }

        console.log(keywords);
        getTitles();
        blurUnwantedVids();
    }
}
