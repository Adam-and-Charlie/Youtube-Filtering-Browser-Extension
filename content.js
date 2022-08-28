window.onload = init;
const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay));

async function init() {
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

    let lastScrollTop;

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
            if (!keywords.some(keyword => rowVids[i].querySelector("#video-title").innerHTML.toLowerCase().includes(keyword))) { // if the video isn't filtered, add it as a replacement
                replacementVids.push(rowVids[i]);
            }
        }

        last_row.remove();
        getTitles();
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
        await wait(4000); //wait 2 sec so that all vids load
        getTitles(); 
        console.log("105");
        console.log(vid_titles);
        blurUnwantedVids();
        getReplacementVidsWatchState();

        await wait(4000);
        for (let i = 0; i < vid_titles.length; i++) {
            replaceVidWatchState(vid_titles[i]);
        }
        vid_titles = [];
    }
    else {
        console.log("nothing is playing");
        
        // get the titles before the user starts scrolling
        await wait(2000);
        getTitles(); 
        blurUnwantedVids();
        getReplacementVids(); // wait for the filtered titles to be set, then get replacements
        console.log(replacementVids);
        for (let i = 0; i < vid_titles.length; i++) {
            replaceVid(vid_titles[i]);
        }
        vid_titles = []; // empty the videos to filter array

        lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        document.addEventListener("scroll", scrollHandler);
    }

    console.log("huhu");

    setInterval(async ()=>{
        if (currentUrl != window.location.href) {
            console.log("once");
            currentUrl = window.location.href;
            replacementVids = []; // Emptying the replacementVid array because the videos are formatted differently

            if (currentUrl.includes("youtube.com/watch")) {
                document.removeEventListener("scroll", scrollHandler);
                await wait(4000);
                console.log("here");
                getTitles(); 
                blurUnwantedVids();

                getReplacementVidsWatchState();

                await wait(4000); 
                for (let i = 0; i < vid_titles.length; i++) {
                    replaceVidWatchState(vid_titles[i]);
                }
                vid_titles = [];
            }
            else {
                console.log("nothing is playing");
                
                // get the titles before the user starts scrolling
                await wait(2000);
                getTitles(); 
                console.log(vid_titles);
                blurUnwantedVids();
                getReplacementVids(); // wait for the filtered titles to be set, then get replacements
                for (let i = 0; i < vid_titles.length; i++) {
                    replaceVid(vid_titles[i]);
                }
                vid_titles = []; // empty the videos to filter array

                lastScrollTop = window.pageYOffset || document.documentElement.scrollTop;
                document.addEventListener("scroll", scrollHandler);
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

        location.reload();
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

    function scrollHandler(e) { // get the titles that load after the user scrolls
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
    }

    async function getReplacementVidsWatchState() {
        var loopNum = 0;
        while (replacementVids.length < replacementNum) { // keeping adding replacements until there is enough
            var loadMoreBtn = await waitForElm("tp-yt-paper-button[class='style-scope ytd-button-renderer style-suggestive size-default']");
            loadMoreBtn.click();
            console.log("clicked!");
            // var j = 1;

            await wait(2000);

            var loadedVidsNodeList = document.querySelectorAll("ytd-compact-video-renderer");
            var loadedVids = Array.from(loadedVidsNodeList).slice(20);

            console.log(loadedVids);

            // replacementVids = toNodeList(loadedVids);
            for (let i=0; i < loadedVids.length; i++) {
                if (!keywords.some(keyword => loadedVids[i].querySelector("#video-title").innerHTML.toLowerCase().includes(keyword))) { // if the video isn't filtered, add it as a replacement
                    replacementVids.push(loadedVids[i])
                }
            }

            for (let i = 0; i < loadedVids.length; i++) {
                loadedVids[i].remove();
            }

            console.log(replacementVids[0]);

            console.log(replacementVids.length);
            loopNum++;
        }

        // Deleting the extra auto-generated show more buttons
        for (let i=0; i < loopNum - 1; i++) {
            var showMoreBtn = document.querySelectorAll("ytd-continuation-item-renderer[class='style-scope ytd-item-section-renderer']")[1];
            // var showMoreBtnContainer = showMoreBtn.parentElement;
            showMoreBtn.remove();
        }
    }

    function replaceVidWatchState(unwantedVidTitle) {
        var unwantedVid = unwantedVidTitle.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
        var unwantedVidContainer = unwantedVid.parentElement;
        unwantedVid.remove();
    
        console.log(replacementVids[0]);
        unwantedVidContainer.appendChild(replacementVids[0]);
        replacementVids.splice(0, 1);
    
        if (replacementVids.length == 0) {
            getReplacementVids();
        }
    
        var showMoreBtn = document.querySelectorAll("ytd-continuation-item-renderer[class='style-scope ytd-item-section-renderer']")[1];
        showMoreBtn.remove();
        unwantedVidContainer.appendChild(showMoreBtn);
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