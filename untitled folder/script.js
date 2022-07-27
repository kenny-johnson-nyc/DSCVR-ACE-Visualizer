let aceData = [];
let dscovrData = [];
let dscovrBackgroundColor = [];
let aceBackgroundColor = [];


const minutesPerPoint = 12;// SSCweb data for ACE and DSCOVR is resolution 720 = 12 minutes

let pointsPerWeek = 7 * 24 * (60 / minutesPerPoint);
const millisPerMinute = 60 * 1000;

// let sampleRate = 168 * 2;  // # of points in a sample period, e.g., 168 = 1 week 

let weeksPerOrbit = 26;  // # of samples, e.g., 26 weeks = months = 1 orbit
const E = 8;

// radius of the Sun projected onto the L1 plane in pixels
let radiusSunPx;

const distanceToSun = 93000000; // miles
const radiusSun = 432690; // miles
const distanceToL1 = 1000000;


//const sampleLength
//bubbleChart Setup Block
let chartDataBubble;
let chartDataLine;
let configBubble;
let configLine;
//  = {
//   lables: ['DSCOVR', 'ACE', 'SUN'],
//   datasets: [
//     {
//       label: ['DSCOVR'],
//       backgroundColor: dscovrBackgroundColor,
//       borderColor: 'rgba(255,221,50,0)',
//       order: 0,
//       data: [{

//       }]
//     }, {
//       label: ['ACE'],
//       backgroundColor: aceBackgroundColor,
//       borderColor: 'rgba(60,186,159,0)',
//       order: 1,
//       data: [{

//       }]
//     }, {
//       label: ['SUN'],
//       backgroundColor: 'rgba(255,214,0,.9)',
//       borderColor: 'rgba(255,214,0,.5)',
//       data: [{
//         x: 0,
//         y: 0,
//         r: radiusSunPx,
//       }]
//     }
//   ]
// };

function initChartData() {
  chartDataBubble = {
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
  };

  // console.log('chartData.datasets[2].data[0].r ' + chartDataBubble.datasets[2].data[0].r);
}

//bubbleChart config block
function initChartDataLine() {
  chartDataLine = {
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
  };

  // console.log('chartData.datasets[2].data[0].r ' + chartDataBubble.datasets[2].data[0].r);
}
/**
 * Initialize Chart.js bubble chart configuration and data
 
 * @returns Chart.js configuration object
 */
function initChartConfig() {
  console.log('starting initChartConfig');

  return {
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
    }
  };
}


/**
 * Create and draw the progressive line chart.
 */
function createLineChart() {
  // let data = dscovrData;
  // console.log('data check ' + JSON.stringify(data[0]));
  // let prev = 1;
  // for (let i = 0; i < 10; i++) {
  //     prev = 1 - Math.random() * 1;
  //     data.push({ x: i, y: prev });
  // }

  let delayBetweenPoints = 200;
  let started = {};
  let ctx2 = document.getElementById('lineChart').getContext('2d');
  lineChart = new Chart(ctx2, {
    type: 'line',
    data: chartDataBubble,
      // datasets: [
      //   {
      //     label: 'DSCOVR interpolated flight path',
      //     // cubicInterpolationMode: 'monotone',
      //     backgroundColor: 'transparent',
      //     borderColor: 'rgb(255, 99, 132)',
      //     borderWidth: 1,
      //     pointRadius: 1,
      //     data: chartDataBubble,
      //     // fill: true,
      //     // animation: (context) => {
      //     //   let delay = 0;
      //     //   let index = context.dataIndex;
      //     //   let chart = context.chart;
      //     //   if (!started[index]) {
      //     //     delay = index * delayBetweenPoints;
      //     //     started[index] = true;
      //     //   }

      //     //   let { x, y } = index > 0 ? chart.getDatasetMeta(0).data[index - 1].getProps(['y_gse', 'z_gse'], true) : { x: 0, y: chart.scales.y.getPixelForValue(100) };

      //     //   return {
      //     //     x: {
      //     //       easing: 'easeInQuint',
      //     //       duration: delayBetweenPoints,
      //     //       from: x,
      //     //       delay
      //     //     },
      //     //     y: {
      //     //       easing: 'easeInQuint',
      //     //       duration: delayBetweenPoints,
      //     //       from: y,
      //     //       delay
      //     //     },
      //     //     skip: {
      //     //       type: 'boolean',
      //     //       duration: delayBetweenPoints,
      //     //       from: true,
      //     //       to: false,
      //     //       delay: delay
      //     //     }
      //     //   };
      //     // }
      //   }
      // ]
    // },
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
      // parsing: {
      //   xAxisKey: 'y_gse',
      //   yAxisKey: 'z_gse'
      // },
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




//create a clone of bubbleChart config and data for a new chart (lineChart) that will render on top of bubbleChart

// let config2 = structuredClone(config);
// config2.type = 'line';
// let data2 = structuredClone(chartData);
//bubbleChart init block

let lineChart;

// function createLineChart(config) {
//   lineChart = new Chart(
//     document.getElementById('lineChart'),
//     config);
// }

let bubbleChart;

function createBubbleChart(config) {
  // console.log('createChart: configBubble ' + JSON.stringify(configBubble, null, '\t'));

  bubbleChart = new Chart(
    document.getElementById('bubbleChart'),
    config);
}

function updateChart() {
  // console.log('updateChart: dscovr data[1] ' + JSON.stringify(data.datasets[0].data[1]));
  // console.log('updateChart: dscovr backgroundColor[1] ' + JSON.stringify(data.datasets[0].backgroundColors[1]));

  bubbleChart.update();
  lineChart.update();
  //bubbleChart.data.datasets[0].data = x_gse
  // createLineChart();
}



// Dark/Light Mode Function

function darkMode(checkbox, value) {
  // slider button left = darkmode = true  
  console.log('darkMode: checked at start ' + checkbox.checked + ' value ' + value);
  // if (value != undefined) {
  //   if (value === 'darkmode') {
  //     checkbox.checked = false; // 'checkbox' slider
  //   } else if (value === 'lightmode') {
  //     checkbox.checked = true;
  //   }
  // }
  // console.log('checkbox.checked is now ' + checkbox.checked);

  const x = bubbleChart.config.options.scales.x;
  const y = bubbleChart.config.options.scales.y;

  if (checkbox.checked === true) {
    x.grid.color = 'black';
    y.grid.color = 'black';
    $('a:link').css({ color: 'red' });
    $('body').removeClass('darkmode');
    localStorage.setItem('darkmode-cookie', 'darkmode');
    // console.log('setting cookie to darkmode');



  } else {
    x.grid.color = 'hsl(0, 0%, 50%)';
    y.grid.color = 'hsl(0, 0%, 50%)';
    $('a:link').css({ color: 'green' });
    $('body').addClass('darkmode');
    localStorage.setItem('darkmode-cookie', 'lightmode');
    // console.log('setting cookie to empty string');


    // document.body.classList.add('anchor-style');

    // console.log('xAxes.grid ' + JSON.stringify(x.grid));
    // console.log('defaults ' + JSON.stringify(bubbleChart.defaults));

    // console.log('options ' + JSON.stringify(bubbleChart.config.options));
    // console.log('options.scales ' + JSON.stringify(bubbleChart.config.options.scales));     
  }

  // destroy chart data (chart.js peculiarity)
  bubbleChart.destroy();
  lineChart.destroy();

  // force chart to reload  
  createBubbleChart(configBubble);
  createLineChart();
}


// DARKMODE COOKIE

// On page load set the theme.
// (function() {
//   let onpageLoad = localStorage.getItem('theme') || '';
//   let element = document.body;
//   element.classList.add(onpageLoad);
//   document.getElementById('theme').textContent =
//     localStorage.getItem('theme') || 'light';
// })();

// function themeToggle() {
//   let element = document.body;
//   element.classList.toggle('dark-mode');

//   let theme = localStorage.getItem('theme');
//   if (theme && theme === 'dark-mode') {
//     localStorage.setItem('theme', '');
//   } else {
//     localStorage.setItem('theme', 'dark-mode');
//   }

//   document.getElementById('theme').textContent = localStorage.getItem('theme');
// }





function processData(results) {
  let i;
  let dscovr = [];
  let ace = [];

  //console.log('# of datapoints ' + results.length);

  // csv position file looks like 6 columns of data
  // time_tag	  active	sourcex_gse	  y_gse	  z_gse
  // 2016-01-19 0:00:00	1	ACE	1479696	-235986	63780
  // 2016-01-19 1:00:00	1	ACE	1479696	-235986	63780


  // Split data by spacecraft (source)

  let splitData = splitBySpacecraft(results);
  dscovr = splitData.dscovr;
  ace = splitData.ace;

  // skip duplicates create temp arrays

  let tempAce = skipDuplicates(ace);
  let tempDscovr = skipDuplicates(dscovr);

  // Sample rate in hours (1 week = 168 hours)

  // sampleRate = 48;


  console.log('dscovr data points ' + tempDscovr.length);
  dscovrData = subsample(tempDscovr);
  aceData = subsample(tempAce);

  loadData();
  updateChart();
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

//reduce bubble opacity (data points) each iteration

function bubbleFader(dataPoints, backgroundColors, colors, spaceCraft) {
  // console.log('bubbleFader dataPoints.length ' + dataPoints.length);
  let i;
  for (i = 0; i < dataPoints.length; i++) {
    // let bubbleRadius = 0.1 + Math.abs((i - dataPoints.length)) ** E / (dataPoints.length) ** E;
    let d = { x: dataPoints[i].y_gse, y: dataPoints[i].z_gse, r: 6 };
    // chartDataBubble.datasets[spaceCraft].data.push(d);

    //console.log('alpha ' + ((dataPoints.length-i)/ dataPoints.length));
    backgroundColors.push(colors + ((dataPoints.length - i) / dataPoints.length) + ')');
    //console.log('color[' + i + '] ' + backgroundColors[backgroundColors.length-1]);

    let d2 = {x: dataPoints[i].y_gse, y: dataPoints[i].z_gse};
    console.log("chartDataLine " + chartDataLine)
    chartDataLine.datasets[spaceCraft].data.push(d2);
  
  }
  // chartDataBubble.datasets[spaceCraft].backgroundColors = backgroundColors;
}

// LOAD DATA

function loadData() {
  // put the retreived and massaged data into the globals
  bubbleFader(dscovrData, dscovrBackgroundColor, 'rgba(0,195,255,', 0);
  bubbleFader(aceData, aceBackgroundColor, 'rgba(203,51,58,', 1);  
}

// split data by spacecraft

function splitBySpacecraft(results) {
  let splitData = {};
  let i;
  let dscovr = [];
  let ace = [];


  for (i = 0; i < results.data.length; i++) {
    if (results.data[i].source === 'ACE') {
      ace.push(results.data[i]);
    } else {
      dscovr.push(results.data[i]);
    }
  }

  splitData.ace = ace;
  splitData.dscovr = dscovr;
  return splitData;

}


// compute the visual angle to the edge of the Sun in radians
let alpha = Math.atan(radiusSun / distanceToSun);
console.log('alpha ' + alpha + ' radians ' + (alpha * 180 / Math.PI) + ' degrees ');

// now compute the projected size of the Sun on the L1 plane which is our graph Canvas
let radiusSunAtL1 = distanceToL1 * Math.tan(alpha) * 1.6;
console.log('projected radius ' + radiusSunAtL1 + ' km');

/**
 * Skip duplicates (spacecraft/time/x/y/z) and reverse time order.
 * @param {Array} input array of timetagged spacecraft positions
 * @return reversed array without duplicates
 */
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

const endTime = new Date();
let startTime;
function defineEndTime() {
  let end = endTime.getTime();
  let offset = weeksPerOrbit * pointsPerWeek * minutesPerPoint * millisPerMinute;  //convert hours to milliseconds. hours back in time.
  //  console.log('sampleCount apiscript ' + sampleCount);
  let start = end - offset;
  startTime = new Date(start);
  console.log(end + ' ' + offset + 'ms ' + start + ' ' + startTime);
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

// -- CREATE CHART -- 'document.ready'
let startStopwatch;


/**
* Called when the browser finished construction of the DOM. 
 */
$(function () {
  // get milliseconds since epoch
  startStopwatch = new Date().getTime();

  // determine the size of the Sun in pixels
  addEventListener('resize', (event) => { initChartConfig(); updateChart(); });


 

  // compute the time range of data to request from NASA
  defineEndTime();
  const start = convertTime(startTime);
  const end = convertTime(endTime);
  console.log('start ' + start + ' end ' + end);

  $('#dataTableVisibility').click(function () {
    $('#data').toggle();
  });

  stopWatch('done with chart creation, about to fetch data ');


  // 
  let sscUrl = 'https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/' + start + ',' + end + '/';
  console.log('sscurl ' + sscUrl);
  $.get(sscUrl, displayObservatories, 'json');

  let sscUrl2 = 'https://sscweb.gsfc.nasa.gov/WS/sscr/2/observatories/';
  console.log('sscurl2 ' + sscUrl2);
  //  $.get(sscUrl2, displayInfo, 'json');
  stopWatch('done with data fetch ');

});

function stopWatch(msg) {
  let endStopWatch = new Date().getTime();
  console.log(msg + ((endStopWatch - startStopwatch) / 1000) + ' sec');
}

function displayInfo(params) {
  console.log(JSON.stringify(params));
}

function displayObservatories(params) {
  // console.log(params);
  // for (const element of params.Result) {
  //     console.log(JSON.stringify(element));
  // }

  //  {
  //   'Result': {
  //       'Data': [
  //           'java.util.ArrayList',
  //           [
  //              {

  //let result = params.Result;
  // console.log('result ' + JSON.stringify(result));

  //let sscData = result.Data;
  // console.log('data ' + JSON.stringify(sscData));

  //let arrayList = sscData[1];
  // console.log('array ' + JSON.stringify(arrayList));

  // let firstSub = arrayList[0];
  // console.log('first sub ' + JSON.stringify(firstSub));

  // let id = firstSub.Id;
  // console.log('id ' + JSON.stringify(id));

  // let coords = firstSub.Coordinates;
  // console.log('coords ' + JSON.stringify(coords[1]));

  // let coordsXpre = coords[1];
  // console.log('coordsX ' + JSON.stringify(coordsX));

  // let coordsX = coordsXpre[0].Y[1];
  // console.log('coordsX ' + JSON.stringify(coordsX));

  // let spacecraft = params.Result.Data[1][0].Id;

  let ace = {};
  ace.time_tag = params.Result.Data[1][0].Time[1][1];
  let size = params.Result.Data[1][0].Time[1].length;
  // console.log('dscovr bounds ' + JSON.stringify(params.Result.Data[1][0].Time[1][1]) + ' to  ' + params.Result.Data[1][0].Time[1][size - 1]);
  // console.log('dscovr adjacents ' + JSON.stringify(params.Result.Data[1][0].Time[1][2]) + ' to  ' + params.Result.Data[1][0].Time[1][size - 2]);

  ace.x_gse = params.Result.Data[1][0].Coordinates[1][0].X[1];
  ace.y_gse = params.Result.Data[1][0].Coordinates[1][0].Y[1];
  ace.z_gse = params.Result.Data[1][0].Coordinates[1][0].Z[1];
  for (let i = 0; i < ace.x_gse.length; i++) { //push every point
    aceData.push({ source: 'ace', x_gse: ace.x_gse[i], z_gse: ace.z_gse[i], y_gse: ace.y_gse[i] });
  }

  let dscovr = {};
  dscovr.time_tag = params.Result.Data[1][1].Time[1][1];
  size = params.Result.Data[1][1].Time[1].length;
  // console.log('dscovr bounds ' + JSON.stringify(params.Result.Data[1][1].Time[1][1]) + ' to  ' + params.Result.Data[1][1].Time[1][size - 1]);
  // console.log('dscovr adjacents ' + JSON.stringify(params.Result.Data[1][1].Time[1][2]) + ' to  ' + params.Result.Data[1][1].Time[1][size - 2]);
  dscovr.x_gse = params.Result.Data[1][1].Coordinates[1][0].X[1];
  dscovr.y_gse = params.Result.Data[1][1].Coordinates[1][0].Y[1];
  dscovr.z_gse = params.Result.Data[1][1].Coordinates[1][0].Z[1];
  for (let i = 0; i < dscovr.x_gse.length; i++) { //push every point 
    dscovrData.push({ source: 'dscovr', x_gse: dscovr.x_gse[i], z_gse: dscovr.z_gse[i], y_gse: dscovr.y_gse[i] });
  }
  // console.log('initial aceData.length ' + aceData.length);
  // console.log('initial dscovrData.length ' + dscovrData.length);

  // clean up the data and reverse the time order      
  let tempAce = skipDuplicates(aceData);
  let tempDscovr = skipDuplicates(dscovrData);

  // console.log('skipped dups aceData.length ' + aceData.length);
  // console.log('skipped dups dscovrData.length ' + dscovrData.length);

  // let coordsY =  params.Result.Data[1][0].Coordinates[1][0].X[1];
  // console.log('coordsY ' + JSON.stringify(coordsY));

  // subsample the data to improve the rendering performance 
  aceData = subsample(tempAce);
  dscovrData = subsample(tempDscovr);

  // console.log('subsampled aceData.length ' + aceData.length);
  // console.log('subsampled dscovrData.length ' + dscovrData.length);

  // console.log('loadData finished and returned control');
   // initialize the bubble chart data
  //  initChartData();

  //  // initialize the chart config, which uses the data
  //  configBubble = initChartConfig();
 
  //  // console.log('first configBubble ' + JSON.stringify(configBubble, null, '\t'));
  //  createBubbleChart(configBubble);


   initChartDataLine();
   createLineChart();

   loadData();
 
   // default to darkMode at startup, toggle button should be to the left
   darkMode(document.getElementById('dark-mode-checkbox'), localStorage.getItem('darkmode-cookie'));
}

//concatinate string to access SSC api

function convertTime(time) {

  // console.log('hour ' + zeroPad(time.getUTCHours()));
  // console.log('min ' + zeroPad(time.getUTCMinutes()));
  // console.log('sec ' + zeroPad(time.getUTCSeconds()));

  let d = '' + time.getUTCFullYear() + zeroPad(time.getUTCMonth() + 1) + zeroPad(time.getUTCDate());
  let t = 'T' + zeroPad(time.getUTCHours()) + zeroPad(time.getUTCMinutes()) + zeroPad(time.getUTCSeconds()) + 'Z';
  // console.log('date ' + d + ' time ' + t);

  return '' + d + t;
}

/**
 * Zero Pad
 */
function zeroPad(num) {
  return (num >= 0 && num < 10) ? '0' + num : num; //between 0 and 10 add to num
}

// function zeroPadTwo(num) {
//     let result;
//     if (num > 0 && num < 10){
//         result = '0' + num;
//     }else {
//         result = num;
//     }
//     return result;
// }


//https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/NaNTNaNNaNNaNZ,2052T15626Z/

//https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/NaNTNaNNaNNaNZ,2052T15626Z/



function addData(chart, label, data) {
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
    dataset.data.push(data);
  });
  chart.update();
}

function removeData(chart) {
  chart.data.labels.pop();
  chart.data.datasets.forEach((dataset) => {
    dataset.data.pop();
  });
  chart.update();
}

