// @ts-check

const endTime = new Date();
const minutesPerPoint = 12;// SSCweb data for ACE and DSCOVR is resolution 720 = 12 minutes
const millisPerMinute = 60 * 1000;
const distanceToSun = 93000000; // miles
const radiusSun = 432690; // miles
const distanceToL1 = 1000000;
const E = 8;
const sunGSE = [[155000000, 0, 0]];
const earthGSE = [[0, 0, 0]];
const sunEarthLine = [[0, 0, 0], [155000000, 0, 0]]
const l1 = 1600000;
const sez2rad = Math.tan(toRadians(2)) * l1;
const sez4rad = Math.tan(toRadians(4)) * l1;
const sez2Deg = buildCircle(sez2rad, l1);
const sez4Deg = buildCircle(sez4rad, l1);
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



function buildCircle(radius, x){
  let circleData = [];
  for (let i = 0; i <= 360; i = i + 10) {  // <== Set circle resolution here
    circleData.push( [x, radius * Math.cos(toRadians(i)), radius * Math.sin(toRadians(i))]);
  }
  return circleData;
}

console.log("buildCircle ", buildCircle(100000, l1));



function toRadians (angle) {
  return angle * (Math.PI / 180);
}


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

// compute the time range of data to request from NASA
defineEndTime();
const start = convertTime(startTime);
const end = convertTime(endTime);
let sscUrl = 'https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/' + start + ',' + end + '/';
$.get(sscUrl, fetchData, 'json');


/**
 * 
 * @param {Array} positionData Spacecraft position data
 * 
 */

function fetchData(positionData) {

  let ace = {};
  let ACEsize = positionData.Result.Data[1][0].Time[1].length;
  ace.time_tag = positionData.Result.Data[1][0].Time[1][1];
  // Assign properties to ace object. Each property is an array
  ace.x_gse = positionData.Result.Data[1][0].Coordinates[1][0].X[1];
  ace.y_gse = positionData.Result.Data[1][0].Coordinates[1][0].Y[1];
  ace.z_gse = positionData.Result.Data[1][0].Coordinates[1][0].Z[1];
  console.log("ace ", ace)
  // Put all properties together into aceData object which contains arrays

  // Swap Y GSE for Z to convert from GSE to local

  for (let i = 0; i < ACEsize; i++) {
    aceData.push({ source: 'ace', time: ace.time_tag,  x_gse: ace.x_gse[i], y_gse: ace.z_gse[i], z_gse: ace.y_gse[i] });
  }
  console.log(ace.x_gse)
  console.log("aceData ", aceData)

  // Object

  // Array(21840)

  let dscovr = {};
  let DSCOVRsize = positionData.Result.Data[1][0].Time[1].length;
  dscovr.time_tag = positionData.Result.Data[1][1].Time[1][1];
  dscovr.x_gse = positionData.Result.Data[1][1].Coordinates[1][0].X[1];
  dscovr.y_gse = positionData.Result.Data[1][1].Coordinates[1][0].Y[1];
  dscovr.z_gse = positionData.Result.Data[1][1].Coordinates[1][0].Z[1];

      // Swap Y GSE for Z to convert from GSE to local

  for (let i = 0; i < DSCOVRsize; i++) {
    dscovrData.push({ source: 'dscovr', time: dscovr.time_tag, x_gse: dscovr.x_gse[i], y_gse: dscovr.z_gse[i], z_gse: dscovr.y_gse[i] });
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

  // FEED DATA TO CHART
  let aceAnim = [];
  // chart.series[0].setData(aceData3d);
  // incrementally build the array that will drive the plot, with a small delay in between each increment to
  // "animate" the drawing of the orbit path


  for (let i = 0; i < aceData3d.length; i++) {
    aceAnim.push(aceData3d[i]);
    chart.series[0].setData(aceAnim);
  }

 

  chart.series[0].setData(aceData3d);
  chart.series[1].setData(dscovrData3d);
  chart.series[2].setData(earthGSE);
  chart.series[3].setData(sunGSE);
  chart.series[4].setData(sez2Deg);
  chart.series[5].setData(sez4Deg);
  chart.series[6].setData(sunEarthLine)
}






/**
 * Convert an array of coordinate objects to an array of coordinate arrays.
 */
function convertTo3d(data) {
  let result = [];
  for (const item of data) {
    // X = Y GSE
    // Y = Z GSE
    // Z = X GSE
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
          [1, 'rgb(0, 0, 0)']
        ]
      },

      chart: {
        
        animation: {
          duration: 2000,
          // defer: 1000,
        },
        backgroundColor: {
          radialGradient: [0, 0, 5, 5],
          stops: [
            [0, 'rgb(0, 0, 0)'],
            [.25, 'rgb(5, 5, 5)'],
            [.5, 'rgb(7, 7, 7)'],
            [.6, 'rgb(10, 10, 10)'],
            [.75, 'rgb(15, 15, 15)'],
            [.9, 'rgb(20, 20, 20)'],
            [1, 'rgb(23, 23, 23)']
          ]

        },
      },
      title: {
        style: {
          color: 'rgb(220, 220, 220)',
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
          font: '10pt Trebuchet MS, Verdana, sans-serif',
          color: 'rgb(220, 220, 220)'
        },
        itemHoverStyle: {
          color: 'gray'
        }
      }
    };
    Highcharts.setOptions(Highcharts.theme);

    // Give the points a 3D feel by adding a radial gradient

    // Highcharts.setOptions({
    //   colors: Highcharts.getOptions().colors.map(function (color) {
    //     return {
    //       radialGradient: {
    //         cx: 0.4,
    //         cy: 0.3,
    //         r: 0.5
    //       },
    //       stops: [
    //         [0, color],
    //         [1, Highcharts.color(color).brighten(-0.2).get('rgb')]
    //       ]
    //     };
    //   })
    // });

    // Set up the chart
    chart = new Highcharts.Chart({
      chart: {
        renderTo: 'container',
        fitToPlot: 'true',
        type: 'scatter3d',
        reflow: 'false',
        // Spacing effects titles and legend only.
        spacingTop: 10,
        spacingBottom: 10,
        spacingRight: 00,
        spacingLeft: 00,
        // Margin effects grid only. KEEP SQUARE!
        marginTop: 80,
        marginBottom: 80,
        marginRight: 20,
        marginLeft: 20,
        // Hardcode equal pixels
        height: 800,
        width: 800,

        // allowMutatingData: false,
        // animation: true,
        // events: {
        //   load: function () {
        //     // set up the updating of the chart each second
        //     // let series = this.series[0];
        //     setInterval(function () { }, 1000);
        //   }
        // },
        options3d: {
    
          enabled: true,
          // Setting alpha and beta to zero puts earth on left and satellites on right. alpha rotates on the vertical axis. beta rotates on the horizontal axis.
          alpha: 0,
          beta: -90,
          // Depth effects scale!
          depth: 620,
          viewDistance: 10,
          frame: {
            left: { // Camera front
              visible: false,
            },
            right: { // Camera back
              visible: false,
            },
            
            front: { // Camera right
              visible: false,
            },
            back: { // Camera left
              visible: false,
            },
            top: {
              visible: false,
            },
            bottom: { // Camera bottom
              visible: false,
             
            }
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

        scatter3d: {
          label: {
            connectorAllowed: true,
            connectorNeighbourDistance: 40,

          }
        }
      },

      // GSE 0 is at Earth.
      // X = Sun-Earth line
      // Y = Sun Earth ecliptic
      // Z = Up Down

      // X = Y GSE
      // Y = Z GSE
      // Z = X GSE


      yAxis: {
        min: -300000,
        max: 300000,
        title: {
          text: 'GSE Z-axis'
        },
        opposite: true,
      },
      xAxis: {
        // min: 0,
        // max: 160000000,
        gridLineWidth: 1,
        title: {
          text: 'GSE X-axis'
        },
        opposite: false,
      },
      zAxis: {
        min: -300000,
        max: 300000,
        title: {
          // SUN EARTH LINE
          text: 'GSE Y-axis'
        },
        opposite: false,
      },
      legend: {
        enabled: true,
        floating: true,
      },
      bubbleLegend: {
        color: 'blue',
      },
      exporting: {
        buttons: {
          resetButton: {
            classname: 'reset-button',

            symbol: 'circle',
            symbolStrokeWidth: 1,
            symbolFill: '#FFFFFF',
            symbolStroke: '#330033',

            // onclick: function () {
            //   let alpha = chart.options.chart.options3d.alpha;
            //   let beta = chart.options.chart.options3d.beta;
            //   alpha = 0;
            //   beta = 0;
            //   chart.update();
            // }
          }
        }
      },
      series: [

        {
          name: "ACE",
          lineWidth: 0.2,
          marker: {
            color: {
              linearGradient: { x1: 0, x2: 0, y1: 0, y2: 1 },
              stops: [
                [0, '#090979'], // start
                [0.5, '#790927'], // middle
                [1, '#793109'] // end
              ]
            },
            fillColor: 'purple',
            // symbol: 'circle',
            // symbol: 'url(imgs/1200px-ACE_spacecraft_model.png)', 
            // NEED TO CENTER
            radius: 5,

          }
        },

        {
          name: "DSCOVR",
          lineWidth: 0.2,
          zones: [{

            color: '#f7a35c'
          }, {
            value: 10,
            color: '#7cb5ec'
          }, {
            color: '#90ed7d'
          }],
          marker: {
            fillColor: 'red',
            symbol: 'circle',
            // symbol: 'url(imgs/DSCOVR_spacecraft_model.png)', NEED TO CENTER
            radius: 5,
          }

        },

        {
          name: "EARTH",
          lineWidth: 1,
          marker: {
            fillColor: 'blue',
            symbol: 'circle',
            // symbol: 'url(imgs/sun.jpeg)', NEED TO CENTER
            radius: 7,
          }

        },
        {
          name: "SUN",
          visible: false,
          lineWidth: 1,
          marker: {
            fillColor: 'yellow',
            symbol: 'circle',
            // symbol: 'url(imgs/sun.jpeg)', NEED TO CENTER
            radius: 7,
          }

        },
        {
          name: "SEZ 2.0 deg",
          lineWidth: 1,
          visible: true,
          marker: {
          enabled: false
          }

        },
        {
          name: "SEZ 4.0 deg",
          lineWidth: 1,
          visible: true,
          marker: {
          enabled: false
          }

        },
        {
          name: "Sun-Earth line",
          lineWidth: 1,
          visible: false,
          marker: {
            fillColor: 'orange',
            symbol: 'circle',
            // symbol: 'url(imgs/sun.jpeg)', NEED TO CENTER
            radius: 1,
          }

        },
      ]
    });
  }


  // RECENTER BUTTON

  // $('.reset-button').on('click', function() { 
  //   chart.update({
  //     chart: {
  //       options3d: {
  //         alpha: 0,
  //         beta: -90,
  //       }
  //     }
  //   })
  // }




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


}(Highcharts));
