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
let pointsPerDay = 7 * 24;
let aceData3d;
let dscovrData3d;
let aceData3dLine;
let dscovrData3dLine;
let chart;
let alpha = Math.atan(radiusSun / distanceToSun);
let radiusSunAtL1 = distanceToL1 * Math.tan(alpha) * 1.6;

/**
* Called when the browser finished construction of the DOM. 
 */


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
  // console.log("aceData " + JSON.stringify(aceData));

  aceData3d = convertTo3d(aceData);
  dscovrData3d = convertTo3d(dscovrData);

  console.log("dscovrData3d " + JSON.stringify(dscovrData3d));

  chart.series[0].setData(aceData3d);
  chart.series[1].setData(dscovrData3d);
}

/**
 * Convert an array of coordinate objects to an array of coordinate arrays.
 */
function convertTo3d(data) {
  let result = [];
  for (const item of data) {
    result.push([item.x_gse, item.y_gse, item.z_gse]);
  }
  return result;
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


  for (i = 0; i < pointsPerWeek * weeksPerOrbit; i += pointsPerWeek) {
    outputData.push(inputData[i]);
  }
  return outputData;
}

function convertKmToPx(km) {
  // need DPR?
  let chartPx = (lineChart !== undefined) ? lineChart.canvas.width : 600;
  // console.log('chart width in pixels ' + chartPx);

  // compute the pixel per km ratio
  let ratio = chartPx / 600000;
  // console.log('km to pixel ratio ' + ratio);

  let px = Math.round(km * ratio);
  // console.log('converted km to px ' + px);

  return px;
}


// function darkMode(checkbox, value) {
//   // slider button left = darkmode = true    
//   const x = lineChart.config.options.scales.x;
//   const y = lineChart.config.options.scales.y;

//   if (checkbox.checked === true) {
//     x.grid.color = 'black';
//     y.grid.color = 'black';
//     $('a:link').css({ color: 'red' });
//     $('body').removeClass('darkmode');
//     localStorage.setItem('darkmode-cookie', 'darkmode');
//   } else {
//     x.grid.color = 'hsl(0, 0%, 50%)';
//     y.grid.color = 'hsl(0, 0%, 50%)';
//     $('a:link').css({ color: 'green' });
//     $('body').addClass('darkmode');
//     localStorage.setItem('darkmode-cookie', 'lightmode');
//   }

// }


// Add mouse and touch events for rotation
(function (H) {

  function create3DChart() {
   
// Theme loads before data 
    Highcharts.theme = {
      colors: {
        linearGradient: [0, 0, 500, 500],
        stops: [
          [0, 'rgb(255, 255, 255)'],
          [1, 'rgb(0, 240, 255)']
        ]
      },
      
      chart: {
        backgroundColor: {
          linearGradient: [0, 0, 500, 500],
          stops: [
            [0, 'rgb(255, 255, 255)'],
            [0.1, 'rgb(100, 100, 255)'],
            [1, 'rgb(0, 240, 255)']
          ]
        },
      },
      title: {
        style: {
          color: '#000',
          font: 'bold 30px "Trebuchet MS", Verdana, sans-serif'
        }
      },
      subtitle: {
        style: {
          color: '#666666',
          font: 'bold 12px "Trebuchet MS", Verdana, sans-serif'
        }
      },
      legend: {
        itemStyle: {
          font: '9pt Trebuchet MS, Verdana, sans-serif',
          color: 'black'
        },
        itemHoverStyle: {
          color: 'gray'
        }
      }
    };
    Highcharts.setOptions(Highcharts.theme);

     // Give the points a 3D feel by adding a radial gradient

    Highcharts.setOptions({
      colors: Highcharts.getOptions().colors.map(function (color) {
        return {
          radialGradient: {
            cx: 0.4,
            cy: 0.3,
            r: 0.5
          },
          stops: [
            [0, color],
            [1, Highcharts.color(color).brighten(-0.2).get('rgb')]
          ]
        };
      })
    });

    // Set up the chart
    chart = new Highcharts.Chart({
      chart: {
        renderTo: 'container',
        margin: 10,
        type: 'scatter3d',
        spacingBottom: 15,
        marginBottom: 30,
        animation: true,
        options3d: {
          enabled: true,
          alpha: 10,
          beta: 30,
          depth: 250,
          viewDistance: 6,
          frame: {
            bottom: { size: 1, color: 'rgba(0,0,0,0.02)' },
            back: { size: 1, color: 'rgba(0,0,0,0.04)' },
            side: { size: 1, color: 'rgba(0,0,0,0.06)' }
          }
        }
      },
      title: {
        text: 'DSCOVR/ACE VISUALIZER'
      },
      subtitle: {
        text: 'Click and drag the plot area to rotate in space'
      },
      plotOptions: {

        scatter: {
          width: 10,
          height: 10,
          depth: 10
        }
      },
      yAxis: {
        // min: -300000,
        // max: 300000,
        title: {
          text:'GSE Y-axis'
        }
      },
      xAxis: {
        // min: 1400000,
        // max: 1600000,
        gridLineWidth: 1,
        title: {
          text:'GSE X-axis'
        }
      },
      zAxis: {
        // min: -300000,
        // max: 300000,
        x:0,
        y:0,
        z:0,
        title: {
          text:'GSE Z-axis'
        }
      },
      legend: {
        enabled: true,
        floating: true,
        align: 'left'
      },
      series: [
        {
          lineWidth: 1,

        },

        {
          lineWidth: 1,
        },
        {
          data: [0]
        },
      ]
    });
  }


  //Draggable function 
  function dragStart(eStart) {
    eStart = chart.pointer.normalize(eStart);

    let posX = eStart.chartX,
      posY = eStart.chartY,
      alpha = chart.options.chart.options3d.alpha,
      beta = chart.options.chart.options3d.beta,
      sensitivity = 5,  // lower is more sensitive
      handlers = [];

    function drag(e) {
      // Get e.chartX and e.chartY
      e = chart.pointer.normalize(e);

      chart.update({
        chart: {
          options3d: {
            alpha: alpha + (e.chartY - posY) / sensitivity,
            beta: beta + (posX - e.chartX) / sensitivity
          }
        }
      }, undefined, undefined, false);
    }

    function unbindAll() {
      handlers.forEach(function (unbind) {
        if (unbind) {
          unbind();
        }
      });
      handlers.length = 0;
    }

    handlers.push(H.addEvent(document, 'mousemove', drag));
    handlers.push(H.addEvent(document, 'touchmove', drag));

    handlers.push(H.addEvent(document, 'mouseup', unbindAll));
    handlers.push(H.addEvent(document, 'touchend', unbindAll));
  }

  create3DChart();
  H.addEvent(chart.container, 'mousedown', dragStart);
  H.addEvent(chart.container, 'touchstart', dragStart);

  // compute the time range of data to request from NASA
  defineEndTime();
  const start = convertTime(startTime);
  const end = convertTime(endTime);
  let sscUrl = 'https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/' + start + ',' + end + '/';
  $.get(sscUrl, fetchData, 'json');

}(Highcharts));









// const items = json3.items
// const replacer = (key, value) => value === null ? '' : value // specify how you want to handle null values here
// const header = Object.keys(items[0])
// const csv = [
//   header.join(','), // header row first
//   ...items.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
// ].join('\r\n')

// console.log(csv)