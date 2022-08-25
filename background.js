// async function getVideo(request) {
//     var requestOptions = {
//         method: 'GET',
//         redirect: 'follow'
//     };
  
//     var videoResponse = await fetch(`https://youtube.googleapis.com/youtube/v3/search?part=snippet&maxResults=1&order=relevance&q=mlb&key=${key}`, requestOptions)
//     var videoResult = await videoResponse.json();
  
//     var videoId = videoResult.items[0].id.videoId;
//     var videoTitle = videoResult.items[0].snippet.title;
//     var channelTitle = videoResult.items[0].snippet.channelTitle;
//     var thumbnail = videoResult.items[0].snippet.thumbnails.high.url;
//     var channelId = videoResult.items[0].snippet.channelId;
//     var publishedAt = videoResult.items[0].snippet.publishedAt;
//     var videoAge;
  
//     var publishedDate =  new Date(publishedAt).getTime();
  
//     // console.log(dateNow - publishedDate);
//     if ((Date.now() - publishedDate) / 1000 < 60) {
//         videoAge = calculateTimeDifference(publishedDate, "second", 1000);
//     }
//     else if ((Date.now() - publishedDate) / 1000 / 60 < 60) {
//         videoAge = calculateTimeDifference(publishedDate, "minute", 1000 * 60);
//     }
//     else if ((Date.now() - publishedDate) / 1000 / 60 / 60 < 24) {
//         videoAge = calculateTimeDifference(publishedDate, "hour", 1000 * 60 * 60);
//     }
//     else if ((Date.now() - publishedDate) / 1000 / 60 / 60 / 24 < 7) {
//         videoAge = calculateTimeDifference(publishedDate, "day", 1000 * 60 * 60 * 24);
//     }
//     else if ((Date.now() - publishedDate) / 1000 / 60 / 60 / 24 < 30) {
//         videoAge = calculateTimeDifference(publishedDate, "week", 1000 * 60 * 60 * 24 * 7);
//     }
//     else if ((Date.now() - publishedDate) / 1000 / 60 / 60 / 24 < 365) {
//         videoAge = calculateTimeDifference(publishedDate, "month", 1000 * 60 * 60 * 24 * 30);
//     }
//     else {
//         videoAge = calculateTimeDifference(publishedDate, "year", 1000 * 60 * 60 * 24 * 365);
//     }
  
//     var viewResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoId}&key=${key}`, requestOptions);
//     var viewResult = await viewResponse.json();
    
//     var videoViewCount = viewResult.items[0].statistics.viewCount;
    
//     if (videoViewCount > 999999999) {
//         videoViewCount = calculateViewCount(videoViewCount, 3, "B");
//     }
//     else if (videoViewCount > 999999) {
//         videoViewCount = calculateViewCount(videoViewCount, 2, "M");
//     }
//     else if (videoViewCount > 999) {
//         videoViewCount = calculateViewCount(videoViewCount, 1, "K");
//     }
  
//     var channelResponse = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=channel&key=${key}`, requestOptions);
//     var channelResult = await channelResponse.json();
  
//     var channelThumbnail = channelResult.items[0].snippet.thumbnails.high.url;
  
//     var durationResponse = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoId}&key=${key}`, requestOptions);
//     var durationResult = await durationResponse.json();
  
//     // var duration = durationResult.items[0].contentDetails.duration;
//     var duration = "PT1H10M15S";
    
//     var secondIndex = duration.indexOf("S");
//     var minuteIndex = duration.indexOf("M");
//     var hourIndex = duration.indexOf("H");
  
//     duration = calculateDuration(duration, hourIndex) + ":" + calculateDuration(duration, minuteIndex) + ":" + calculateDuration(duration, secondIndex);
    
//     while ((duration[0] == 0 || duration[0] == ":") && duration.length != 4) {
//         duration = duration.slice(1, duration.length);
//     }

//     var videoData = {
//         "video ID": videoId,
//         "video title": videoTitle,
//         "video thumbnail url": thumbnail,
//         "video age": videoAge,
//         "video view count": videoViewCount,
//         "channel ID": channelId,
//         "channel title": channelTitle,
//         "channel thumbnail url": channelThumbnail,
//         "duration": duration
//     }

//     // var videoData = {
//     //     "video title": "videoTitle",
//     //     "video thumbnail url": "thumbnail",
//     //     "video age": "videoAge",
//     //     "video view count": "videoViewCount",
//     //     "channel title": "channelTitle",
//     //     "channel thumbnail url": "channelThumbnail",
//     //     "duration": "duration"
//     // }

//     chrome.tabs.query({currentWindow: true, active: true}, tabs => {
//         var tabID = tabs[0].id;
//         chrome.tabs.sendMessage(tabID, videoData);; // Process the page
//     });
// }

// function calculateTimeDifference(publishedDate, timeUnit, divisor) {
//     if (Math.floor((Date.now() - publishedDate) / divisor) == 1) {
//         return `1 ${timeUnit} ago`;
//     }
//     else {
//         return Math.floor((Date.now() - publishedDate) / divisor) + ` ${timeUnit}s ago`;
//     }
// }

// function calculateViewCount(viewCount, commaNum, symbol) {
//     var digits = viewCount.substring(0, viewCount.length - (commaNum * 3) + 1);
//     if (digits[digits.length - 1] != 0 && digits.length == 2) {
//         digits = digits.substring(0, digits.length - 1) + "." + digits.substring(digits.length - 1);
//     }
//     else {
//         digits = digits.substring(0, digits.length - 1);
//     }
//     return digits + symbol;
// }

// function calculateDuration(duration, timeIndex) {
//     if (timeIndex != -1) {
//         var num = "" + duration[timeIndex - 2] + duration[timeIndex - 1];
//         if (isNaN(num)) {
//             num = "" + 0 + num[1];
//         }
//     }
//     else {
//         num = "00"
//     }
//     return num;
// }

// const key = "AIzaSyACGJyAIpVZfU97ku1waowhdW6uTKDvAXU";

// chrome.runtime.onMessage.addListener(getVideo)
// .catch(error => console.log('error', error));