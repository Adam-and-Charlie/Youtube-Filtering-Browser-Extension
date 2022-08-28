window.onload = init;
const wait = (timeToDelay) => new Promise((resolve) => setTimeout(resolve, timeToDelay)); // synchrons delay

// Function to call once page is loaded
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

        last_row.remove(); // remove the row
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

    // function to wait for an element to load
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

    // if watching a video
    if (currentUrl.includes("youtube.com/watch")) {
        // get the titles before the user starts scrolling
        await wait(4000); //wait 4 sec so that all vids load
        getTitles(); 
        blurUnwantedVids();
        getReplacementVidsWatchState();

        await wait(4000); // wait until replacements are found
        for (let i = 0; i < vid_titles.length; i++) {
            replaceVidWatchState(vid_titles[i]);
        }
        vid_titles = []; // emptying unwanted video array
    }
    else { // on recommendations page
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
        document.addEventListener("scroll", scrollHandler); // add filter function to scroll event
    }

    setInterval(async ()=>{ // polling to check for url changes
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
        // item rendering element of the video
        var unwantedVid = unwantedVidTitle.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
        var unwantedVidContainer = unwantedVid.parentElement; // container (parent element) of the video item renderer element
        unwantedVid.remove();

        unwantedVidContainer.appendChild(replacementVids[0]); // adding replacement
        replacementVids.splice(0, 1); // removing replacement from replacement array

        if (replacementVids.length == 0) { // refill replacements if empty
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

    async function getReplacementVidsWatchState() { // getting replacement when on a watching state page
        var loopNum = 0; // number of times the show more button was pressed, used later to delete extra auto-generated show more buttons
        while (replacementVids.length < replacementNum) { // keeping adding replacements until there is enough
            var loadMoreBtn = await waitForElm("tp-yt-paper-button[class='style-scope ytd-button-renderer style-suggestive size-default']"); // wait for show more button to load
            loadMoreBtn.click(); // click the show more button to find replacements
            console.log("clicked!");

            await wait(2000);

            var loadedVidsNodeList = document.querySelectorAll("ytd-compact-video-renderer"); // nodelist of new loaded videos
            var loadedVids = Array.from(loadedVidsNodeList).slice(20); // convert to array

            for (let i=0; i < loadedVids.length; i++) {
                if (!keywords.some(keyword => loadedVids[i].querySelector("#video-title").innerHTML.toLowerCase().includes(keyword))) { // if the video isn't filtered, add it as a replacement
                    replacementVids.push(loadedVids[i])
                }
            }

            for (let i = 0; i < loadedVids.length; i++) {
                loadedVids[i].remove(); // remove the new loaded videos
            }

            loopNum++;
        }

        // Deleting the extra auto-generated show more buttons
        for (let i=0; i < loopNum - 1; i++) {
            var showMoreBtn = document.querySelectorAll("ytd-continuation-item-renderer[class='style-scope ytd-item-section-renderer']")[1];
            showMoreBtn.remove();
        }
    }

    // replace unwanted videos in the watching state page
    function replaceVidWatchState(unwantedVidTitle) {
        var unwantedVid = unwantedVidTitle.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement;
        var unwantedVidContainer = unwantedVid.parentElement;
        unwantedVid.remove();
    
        unwantedVidContainer.appendChild(replacementVids[0]);
        replacementVids.splice(0, 1);
    
        if (replacementVids.length == 0) {
            getReplacementVids();
        }
    
        // reappending the show more button to ensure it is below all the videos
        var showMoreBtn = document.querySelectorAll("ytd-continuation-item-renderer[class='style-scope ytd-item-section-renderer']")[1];
        showMoreBtn.remove();
        unwantedVidContainer.appendChild(showMoreBtn);
    }
}