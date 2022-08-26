window.onload = init;

function init() {
    const favTeamsLocalStorageKey = "favTeamsData";
    var vid_titles = [];
    var prev_vid_title_count = 0;
    var regex = /[!"#$%&'()*+,-./:;<=>?@[\]^_`{|}~]/g; // to remove punctuation from vid titles

    var replacementVids = []; // array to store the replacement vids
    var replacementNum; // number of replacements needed

    var currentUrl = window.location.href;

    if(localStorage.getItem(favTeamsLocalStorageKey) != null)
    {var keywords = localStorage.getItem(favTeamsLocalStorageKey).split(",");}
    else
    {var keywords = []}
    chrome.runtime.onMessage.addListener(receiver); // Receiving the popup.js message with favourite teams


    console.log("Keywords:")
    console.log(keywords);

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

        replacementNum = vid_titles.length; // setting the number of replacements
    }

    function getReplacementVids() {
        while (replacementVids.length < replacementNum) { // keeping adding replacements until there is enough
            getReplacementRow();
        }
    }

    function getReplacementRow() {
        var rows = document.getElementsByTagName("ytd-rich-grid-row");
        var last_row = rows[rows.length - 1];
        var rowVids = last_row.querySelectorAll("ytd-rich-item-renderer"); // node list of all the videos from the last row

        for (var i = 0; i < rowVids.length; i++) {
            if (vid_titles.indexOf(rowVids[i].querySelector("#video-title")) == -1) { // if the video isn't filtered, add it as a replacement
                replacementVids.push(rowVids[i]);
            }
        }

        last_row.remove();
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

    function waitForElm(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
    
            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });
    
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    if (currentUrl.includes("youtube.com/watch")) {
        // get the titles before the user starts scrolling
        setTimeout(()=>{
            getTitles(); 
            blurUnwantedVids();
        }, 2000); //wait 2 sec so that all vids load
    }
    else {
        console.log("nothing is playing");
        
        // get the titles before the user starts scrolling
        setTimeout(()=>{
            getTitles(); 
            blurUnwantedVids();
            getReplacementVids(); // wait for the filtered titles to be set, then get replacements
            for (let i = 0; i < vid_titles.length; i++) {
                replaceVid(vid_titles[i]);
            }
            vid_titles = []; // empty the videos to filter array
        }, 2000); //wait 2 sec so that all vids load

        let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        document.addEventListener("scroll", function _listener(e) { // get the titles that load after the user scrolls
            let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
            if (currentScroll > lastScrollTop){
                prev_vid_title_count = vid_titles.length;
                getTitles();
                lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
            }
            if (vid_titles.length > prev_vid_title_count){ // if more vid titles added to the vid title arr
                blurUnwantedVids();
                for (let i = 0; i < vid_titles.length; i++) {
                    replaceVid(vid_titles[i]);
                }
                vid_titles = [];
            }
        });
    }

    setInterval(()=>{
        if (currentUrl != window.location.href) {
            console.log("once");
            currentUrl = window.location.href;

            if (currentUrl.includes("youtube.com/watch")) {
                document.removeEventListener("scroll", _listener);
                console.log("here");
                getTitles(); 
                blurUnwantedVids();
            }
            else {
                console.log("nothing is playing");
                
                // get the titles before the user starts scrolling
                setTimeout(()=>{
                    getTitles(); 
                    blurUnwantedVids();
                    getReplacementVids(); // wait for the filtered titles to be set, then get replacements
                    for (let i = 0; i < vid_titles.length; i++) {
                        replaceVid(vid_titles[i]);
                    }
                    vid_titles = []; // empty the videos to filter array
                }, 2000); //wait 2 sec so that all vids load

                let lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                document.addEventListener("scroll", function _listener(e) { // get the titles that load after the user scrolls
                    let currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                    if (currentScroll > lastScrollTop){
                        prev_vid_title_count = vid_titles.length;
                        getTitles();
                        lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
                    }
                    if (vid_titles.length > prev_vid_title_count){ // if more vid titles added to the vid title arr
                        blurUnwantedVids();
                        for (let i = 0; i < vid_titles.length; i++) {
                            replaceVid(vid_titles[i]);
                        }
                        vid_titles = [];
                    }
                });
            }
        }
    }, 1500)

    // Receiving the message as an event object
    function receiver(request) {
        // Update keywords
        unBlurUnwantedVids();
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

            getTitles();
            blurUnwantedVids();
            // console.log(vid_titles);
            replacementVids = [];
            getReplacementVids();
            for (let i = 0; i < vid_titles.length; i++) {
                replaceVid(vid_titles[i]);
            }
            vid_titles = [];
        }
    }

    function replaceVid(unwantedVidTitle){
        console.log("bruh");
        var unwantedVid = unwantedVidTitle.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
        var unwantedVidContainer = unwantedVid.parentElement;
        unwantedVid.remove();

        unwantedVidContainer.appendChild(replacementVids[0]);
        replacementVids.splice(0, 1);

        if (replacementVids.length == 0) {
            getReplacementVids();
        }
    }
}

// function changeVid(unwantedVidTitle) {
//     var replacementVid = document.querySelectorAll("ytd-rich-item-renderer")[13];

//     if (replacementVid) {
//         var unwantedVid = unwantedVidTitle.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
//         var unwantedVidContainer = unwantedVid.parentElement;
//         unwantedVid.remove();

//         var replacementVidRow = replacementVid.parentElement.parentElement;
//         unwantedVidContainer.appendChild(replacementVid);
//         replacementVidRow.remove();
//     }
//     return replacementVid;
// }

// setTimeout(()=>{
//     setInterval(()=>{
//         getTitles();
//         if (vid_titles.length > 0) {
//             replacementVids = [];
//             getReplacementVids();
//             for (let i = 0; i < vid_titles.length; i++) {
//                 replaceVid(vid_titles[i]);
//             }
//             vid_titles = [];
//         }
//     }, 5000)
// }, 8000)