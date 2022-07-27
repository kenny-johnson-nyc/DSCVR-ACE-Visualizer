const endTime = new Date();
let startTime;
let aceData = [];
let dscovrData = [];
let dscovrBackgroundColor = [];
let aceBackgroundColor = [];


/**
* Called when the browser finished construction of the DOM. 
 */
$(function () {
 
  // compute the time range of data to request from NASA
  defineEndTime();
  const start = convertTime(startTime);
  const end = convertTime(endTime);
  console.log('start ' + start + ' end ' + end);
  let sscUrl = 'https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/' + start + ',' + end + '/';
  console.log('sscurl ' + sscUrl);
  $.get(sscUrl, displayObservatories, 'json');
});

function defineEndTime() {
  let end = endTime.getTime();
  let offset = weeksPerOrbit * pointsPerWeek * minutesPerPoint * millisPerMinute;  
  //convert hours to milliseconds. hours back in time.
  let start = end - offset;
  startTime = new Date(start);
}

//concatinate string to access SSC api
function convertTime(time) {  
    let d = '' + time.getUTCFullYear() + zeroPad(time.getUTCMonth() + 1) + zeroPad(time.getUTCDate());
    let t = 'T' + zeroPad(time.getUTCHours()) + zeroPad(time.getUTCMinutes()) + zeroPad(time.getUTCSeconds()) + 'Z';
    return '' + d + t;
  }