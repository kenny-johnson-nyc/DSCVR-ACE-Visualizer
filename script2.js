// @ts-check

const endTime = new Date();
const minutesPerPoint = 12;// SSCweb data for ACE and DSCOVR is resolution 720 = 12 minutes
const millisPerMinute = 60 * 1000;
const distanceToSun = 93000000; // miles
const radiusSun = 432690; // miles
const distanceToL1 = 1000000;
const E = 8;
let weeksPerOrbit = 26;  // # of samples, e.g., 26 weeks = months = 1 orbit
let radiusSunPx;
let startTime;
let aceData = [];
let dscovrData = [];
let dscovrBackgroundColor = [];
let aceBackgroundColor = [];
let pointsPerWeek = 7 * 24 * (60 / minutesPerPoint);
let bubbleChart;
let lineChart;
let chartDataBubble;
let chartDataLine;
let configBubble;
let configLine;
let alpha = Math.atan(radiusSun / distanceToSun);
let radiusSunAtL1 = distanceToL1 * Math.tan(alpha) * 1.6;



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
  $.get(sscUrl, fetchData, 'json');
});

// ***************************************************************************************************
// spacecraft position data related functions
// ***************************************************************************************************

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

function zeroPad(num) {
  return (num >= 0 && num < 10) ? '0' + num : num; //between 0 and 10 add to num
}

function fetchData(positionData) {

  let ace = {};
  ace.time_tag = positionData.Result.Data[1][0].Time[1][1];
  let size = positionData.Result.Data[1][0].Time[1].length;
  ace.x_gse = positionData.Result.Data[1][0].Coordinates[1][0].X[1];
  ace.y_gse = positionData.Result.Data[1][0].Coordinates[1][0].Y[1];
  ace.z_gse = positionData.Result.Data[1][0].Coordinates[1][0].Z[1];
  for (let i = 0; i < ace.x_gse.length; i++) {
    aceData.push({ source: 'ace', x_gse: ace.x_gse[i], z_gse: ace.z_gse[i], y_gse: ace.y_gse[i] });
  }

  let dscovr = {};
  dscovr.time_tag = positionData.Result.Data[1][1].Time[1][1];
  dscovr.x_gse = positionData.Result.Data[1][1].Coordinates[1][0].X[1];
  dscovr.y_gse = positionData.Result.Data[1][1].Coordinates[1][0].Y[1];
  dscovr.z_gse = positionData.Result.Data[1][1].Coordinates[1][0].Z[1];
  for (let i = 0; i < dscovr.x_gse.length; i++) {
    dscovrData.push({ source: 'dscovr', x_gse: dscovr.x_gse[i], z_gse: dscovr.z_gse[i], y_gse: dscovr.y_gse[i] });
  }

  // clean up the data and reverse the time order      
  let tempAce = skipDuplicates(aceData);
  let tempDscovr = skipDuplicates(dscovrData);

  // subsample the data to improve the rendering performance 
  aceData = subsample(tempAce);
  dscovrData = subsample(tempDscovr);

  createCharts();
}

function skipDuplicates(input) {
  let results = [];  // the cleaned up and reversed array to be returned
  let i;
  let last;  // used to keep the last element examined

  // walk through the array in reverse order
  for (i = input.length - 1; i >= 0; i--) {

    // is this element is not the same as the last one? (assumes that dupliates are adjacent)
    if (input[i] !== last) {
      // not the same, so keep it by assigning to the array to be returned
      results.push(input[i]);
    }
    // retain this element for the next pass through the loop
    last = input[i];
  }

  // return the reversed array which does not contain duplicates
  return results;
}

function subsample(inputData) {
  let i;
  let outputData = [];

  console.log('only subsampling up to point # ' + (pointsPerWeek * weeksPerOrbit) + ', total # of points ' + inputData.length);
  for (i = 0; i < pointsPerWeek * weeksPerOrbit; i += pointsPerWeek) {
    outputData.push(inputData[i]);
    // console.log('i ' + i);
  }
  console.log('inputData # ' + inputData.length + " outputData # " + outputData.length);
  return outputData;
}

function convertKmToPx(km) {
  // need DPR?
  let chartPx = (bubbleChart !== undefined) ? bubbleChart.canvas.width : 600;
  console.log('chart width in pixels ' + chartPx);

  // compute the pixel per km ratio
  let ratio = chartPx / 600000;
  console.log('km to pixel ratio ' + ratio);

  let px = Math.round(km * ratio);
  console.log('converted km to px ' + px);

  return px;
}


// ***************************************************************************************************
// chart related functions
// ***************************************************************************************************

function createCharts() {

  // force chart to reload  
  createBubbleChart();
  createLineChart();

  // createLineChart();

  loadData();

  // default to darkMode at startup, toggle button should be to the left
  // darkMode(document.getElementById('dark-mode-checkbox'), localStorage.getItem('darkmode-cookie'));
}

/**
 * Create a Chart.js bubble chart for displaying the spacecraft position data.
 */
function createBubbleChart() {
  bubbleChart = new Chart(
    document.getElementById('bubbleChart'),
    {
      type: "bubble",
      data: chartDataBubble,
      options: {
        responsive: true,
        animation: {
          duration: 2000,
          easing: 'easeOutQuart',
        },
        plugins: {
          title: {
            display: false
          },
          subtitle: {
            display: false
          },
          legend: {
            labels: {
              font: {
                size: 10
              },
            }
          }
        },
        scales: {
          x: {
            color: '666',
            // backgroundColor: '#222',
            min: -300000,
            max: 300000,
            title: {
              display: true,
              text: 'GSE Y-axis (km)',
              font: {
                size: 15
              }
            }
          },
          y: {
            color: '#0F0',
            // backgroundColor: '#222',
            min: -300000,
            max: 300000,
            title: {
              display: true,
              text: 'GSE Z-axis (km)',
              font: {
                size: 15
              }
            }
          }
        }
      },
      lables: ['DSCOVR', 'ACE', 'SUN'],
      datasets: [
        {
          label: ['DSCOVR'],
          backgroundColor: dscovrBackgroundColor,
          borderColor: 'rgba(255,221,50,0)',
          order: 0,
          data: [{

          }]
        },
        {
          label: ['ACE'],
          backgroundColor: aceBackgroundColor,
          borderColor: 'rgba(60,186,159,0)',
          order: 1,
          data: [{

          }]
        },
        {
          label: ['SUN'],
          backgroundColor: 'rgba(255,214,0,.9)',
          borderColor: 'rgba(255,214,0,.5)',
          data: [{
            x: 0,
            y: 0,
            r: convertKmToPx(radiusSunAtL1),
          }]
        }
      ]
    }
  )
}


function darkMode(checkbox, value) {
  // slider button left = darkmode = true    
  const x = bubbleChart.config.options.scales.x;
  const y = bubbleChart.config.options.scales.y;

  if (checkbox.checked === true) {
    x.grid.color = 'black';
    y.grid.color = 'black';
    $('a:link').css({ color: 'red' });
    $('body').removeClass('darkmode');
    localStorage.setItem('darkmode-cookie', 'darkmode');
  } else {
    x.grid.color = 'hsl(0, 0%, 50%)';
    y.grid.color = 'hsl(0, 0%, 50%)';
    $('a:link').css({ color: 'green' });
    $('body').addClass('darkmode');
    localStorage.setItem('darkmode-cookie', 'lightmode');
  }

  // destroy chart data (chart.js peculiarity)
  bubbleChart.destroy();
  lineChart.destroy();

  // force chart to reload  
  createBubbleChart(configBubble);
  createLineChart();
}




function loadData() {
  // put the retreived and massaged data into the globals
  bubbleFader(dscovrData, dscovrBackgroundColor, 'rgba(0,195,255,', 0);
  bubbleFader(aceData, aceBackgroundColor, 'rgba(203,51,58,', 1);
}

function updateChart() {
  bubbleChart.update();
  lineChart.update();
}




function createLineChart() {

  let delayBetweenPoints = 200;
  let started = {};
  let ctx2 = document.getElementById('lineChart').getContext('2d');
  lineChart = new Chart(ctx2, {
    type: 'line',
    data: {
      datasets: [
        {
          label: ['DSCOVR'],
          backgroundColor: dscovrBackgroundColor,
          borderColor: 'rgba(255,221,50,0)',
          order: 0,
          data: [{

          }]
        },
        {
          label: ['ACE'],
          backgroundColor: aceBackgroundColor,
          borderColor: 'rgba(60,186,159,0)',
          order: 1,
          data: [{

          }]
        },
      ]
    },
    options: {
      responsive: true,
      animation: {
        duration: 2000,
        easing: 'easeOutQuart',
      },
      plugins: {
        title: {
          display: false
        },
        subtitle: {
          display: false
        },
        legend: {
          labels: {
            font: {
              size: 10
            }
          }
        }
      },

      scales: {
        x: {
          type: 'linear',
          min: -300000,
          max: 300000,
          title: {
            display: true,
            text: '',
            font: {
              size: 15
            }
          }
        },
        y: {
          type: 'linear',
          min: -300000,
          max: 300000,
          title: {
            display: true,
            text: '',
            font: {
              size: 15
            }
          }
        }
      }
    },

  });
}
