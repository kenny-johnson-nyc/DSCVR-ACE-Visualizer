// @ts-nocheck
// const time_tag = [];
// const source = [];
// const x_gse = [];
// const y_gse = [];
// const z_gse = [];
let aceData = [];
let dscovrData = [];
let dscovrBackgroundColor = [];
let aceBackgroundColor = [];

// SSCweb data for ACE and DSCOVR is resolution 720 = 12 minutes

const minutesPerPoint = 12;
let pointsPerWeek = 7 * 24 * (60/minutesPerPoint); 
const millisPerMinute = 60 * 1000;

// let sampleRate = 168 * 2;  // # of points in a sample period, e.g., 168 = 1 week 

let weeksPerOrbit = 26;  // # of samples, e.g., 26 weeks = months = 1 orbit
const E = 8;

//const sampleLength
//bubbleChart Setup Block

const chartData = {
  lables: ['DSCOVR', 'ACE', 'SUN'],
  datasets: [
    {
      label: ["DSCOVR"],
      backgroundColor: dscovrBackgroundColor,
      borderColor: "rgba(255,221,50,0)",
      order: 0,
      data: [{

      }]
    }, {
      label: ["ACE"],
      backgroundColor: aceBackgroundColor,
      borderColor: "rgba(60,186,159,0)",
      order: 1,
      data: [{

      }]
    }, {
      label: ["SUN"],
      backgroundColor: "rgba(255,214,0,.5)",
      borderColor: "rgba(255,214,0,.7)",
      data: [{
        x: 0,
        y: 0,
        r: 12, //Sun radius not to scale (yet)
      }]
    }
  ]
};

//bubbleChart config block

const config = {
  type: 'bubble',
  data: chartData,
  options: {
    animation: {
      duration: 2000,
      easing: 'easeOutQuart',


    },
    layout: {
      padding: {
        left: 5,
        top: 5,
      }
    },
    responsive: true,

    title: {
      display: true,
      text: 'DSCOVR/ACE Locations Visualizer',
      fontSize: 20,
      fontWeight: 1000,
    },

    plugins: {
      legend: {
        labels: {
          fontSize: 20,
        }
      }
    },
    scales: {
      y: {
        color: "#666",
        backgroundColor: "#222",
        min: -300000,
        max: 300000,
        scaleLabel: {
          display: true,
          labelString: "GSE Z-axis (km)",
          fontSize: 16
        },
      },
      x: {
        color: "#666",
        backgroundColor: "#222",
        min: -300000, 
        max: 300000,
        scaleLabel: {
          display: true,
          labelString: "GSE Y-axis (km)",
          fontSize: 16
        }
      }
    }
  }
};

//bubbleChart init block

const bubbleChart = new Chart(
  document.getElementById('bubbleChart'),
  config
);

function updateChart() {
  // console.log("updateChart: dscovr data[1] " + JSON.stringify(data.datasets[0].data[1]));
  // console.log("updateChart: dscovr backgroundColor[1] " + JSON.stringify(data.datasets[0].backgroundColors[1]));

  bubbleChart.update();
  //bubbleChart.data.datasets[0].data = x_gse
}


// Dark/Light Mode Function

  function darkMode(checkbox){
    console.log("darkMode " + checkbox.checked);     

    const x = bubbleChart.config.options.scales.xAxes;
    const y = bubbleChart.config.options.scales.yAxes;
    console.log("xAxes options " + JSON.stringify(bubbleChart.config.options));
    console.log("xAxes options.scales " + JSON.stringify(bubbleChart.config.options.scales));
    console.log("xAxes options.scales.x " + JSON.stringify(bubbleChart.config.options.scales.x));
    console.log("xAxes options.scales.x.ticks " + JSON.stringify(bubbleChart.config.options.scales.x.ticks));


    if (checkbox.checked === true) {
      // x.grid.borderColor = 'white';
      // y.grid.borderColor = 'white';
      console.log("xAxes.grid " + JSON.stringify(x.grid));

      x[0].grid.color = 'rgba(255, 255, 255, 0.5)';
      y[0].grid.color = 'rgba(255, 255, 255, 0.5)';
    document.getElementById('checkboxText').classList.add('darkmode');
    }
  
    if (checkbox.checked === false) {
      document.getElementById('checkboxText').classList.remove('darkmode');
      }
  }
//-----Papaparse
//-----begins executing
// const uploadconfirm = document.getElementById('uploadconfirm').addEventListener('click', () => {
//    //console.log("uploadFile: params " + JSON.stringify(params));
//    Papa.parse(params, {
//     download: true,
//     header: true,
//     skipEmptyLines: true,
//     complete: uploadFile(document.getElementById('uploadfile').files[0])
//    }

// function uploadFile(filepath) {
//       // read the file
//       // let data = <stuff read from file>

//       // process the file contents
//       processData(data);
// }

function processData(results) {
      let i;
      let dscovr = [];
      let ace = [];

      //console.log("# of datapoints " + results.length);

      // csv position file looks like this, 6 columns of data
//       time_tag	active	source	x_gse	y_gse	z_gse
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
    

      console.log("dscovr data points " + tempDscovr.length);
    dscovrData = subsample(tempDscovr);
    aceData = subsample(tempAce);  

      loadData();
      updateChart();
    }

function subsample(inputData) { 
  let i;
  let outputData = [];

  console.log("only subsampling up to point # " + (pointsPerWeek * weeksPerOrbit) + ", total # of points " + inputData.length);
  for (i = 0; i < pointsPerWeek * weeksPerOrbit; i += pointsPerWeek) { 
    outputData.push(inputData[i]);
    // console.log("i " + i);
  }
  return outputData;
 }

function bubbleFader(dataPoints, backgroundColors, colors, spaceCraft) {
  console.log("bubbleFader dataPoints.length " + dataPoints.length);
  let i;
  for (i = 0; i < dataPoints.length; i++) {
    let bubbleRadius = 0.1 + Math.abs((i - dataPoints.length)) ** E / (dataPoints.length) ** E;
    let d = { x: dataPoints[i].y_gse, y: dataPoints[i].z_gse, r: 6 };
    chartData.datasets[spaceCraft].data.push(d);

    //console.log("alpha " + ((dataPoints.length-i)/ dataPoints.length));
    backgroundColors.push(colors + ((dataPoints.length - i) / dataPoints.length) + ")");
    //console.log("color[" + i + "] " + backgroundColors[backgroundColors.length-1]);
  }
  chartData.datasets[spaceCraft].backgroundColors = backgroundColors;
}
function loadData() {
  bubbleFader(dscovrData, dscovrBackgroundColor, "rgba(0,195,255,", 0);
  bubbleFader(aceData, aceBackgroundColor, "rgba(203,51,58,", 1);
}

// split data by spacecraft (source)
function splitBySpacecraft(results) {
  let splitData = {};
  let i;
  let dscovr = [];
  let ace = [];


  for (i = 0; i < results.data.length; i++) {
    if (results.data[i].source === "ACE") {
      ace.push(results.data[i]);
    } else {
      dscovr.push(results.data[i]);
    }
  }

  splitData.ace = ace;
  splitData.dscovr = dscovr;
  return splitData;

}

/**
 * Skip duplicates (spacecraft/time/x/y/z) and reverse time order.
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



// function requestData() {

//    // disable rapid, repeated requests
//    $("#requestButton").prop("disabled", true);

//    /* the following looses the case of the XML elements
//      let req = document.createDocumentFragment();
//      let graphReq = req.appendChild(document.createElement("GraphRequest"));
//      graphReq.setAttribute("xmlns", "http://sscweb.gsfc.nasa.gov/schema");
//      let timeInterval = document.createElement("TimeInterval");
//      ...
//      so the xml request is created with strings
//    */

//    let selectedSats = $('#satSel option:selected').map(
//        function() {
//            return this.value
//        }).get();

//    if (selectedSats.length == 0) {

//        alert('You must select at least one satellite');
//        $("#requestButton").prop("disabled", false);
//        return;
//    }


//    $.ajax({
//        type: 'POST',
//        url: sscUrl + '/locations',
//        data: request,
//        dataType: 'xml',
//        contentType: 'application/xml',
//        processData: false,
//        success: displayData,
//        error: dataError
//    });

// }

// $.getJSON('http://' + HOST + ':8080/rtsw/json/fc.json')
// .done(function (data) {


   const endTime = new Date();
   let startTime;
   function defineEndTime() {
    let end = endTime.getTime();
    let offset = weeksPerOrbit*pointsPerWeek*minutesPerPoint*millisPerMinute;  //convert hours to milliseconds. hours back in time.
   //  console.log("sampleCount apiscript " + sampleCount);
    let start = end-offset;
    startTime = new Date(start);
    console.log(end + " "+ offset + "ms " + start + " " + startTime);
   }
    
   /**
    * Called when the browser finished construction the DOM.  It makes an
    * SSC web service call to get the available observatories.  The
    * displayObservatories function is registered to handle the results
    * of web service call. 
    */
    $(document).ready(function() {


       defineEndTime();
        const start = convertTime(startTime);
        const end = convertTime(endTime);
        console.log("start " + start + " end " + end);
         $('#dataTableVisibility').click(function() {
             $('#data').toggle();
         });
         let sscUrl='https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/'+start+','+end+'/';
         console.log("sscurl " +sscUrl);
         $.get(sscUrl, displayObservatories, 'json');

         let sscUrl2='https://sscweb.gsfc.nasa.gov/WS/sscr/2/observatories/';
         console.log("sscurl2 " +sscUrl2);
        //  $.get(sscUrl2, displayInfo, 'json');
     });

     function displayInfo(params) {
        console.log(JSON.stringify(params));
     }
     
     function displayObservatories(params) {
           // console.log(params);
           // for (const element of params.Result) {
           //     console.log(JSON.stringify(element));
           // }

          //  {
          //   "Result": {
          //       "Data": [
          //           "java.util.ArrayList",
          //           [
          //              {

          let result = params.Result;
          // console.log("result " + JSON.stringify(result));

          let sscData = result.Data;
          // console.log("data " + JSON.stringify(sscData));

          let arrayList = sscData[1];
          // console.log("array " + JSON.stringify(arrayList));

          let firstSub =  arrayList[0];
          // console.log("first sub " + JSON.stringify(firstSub));

          let id =  firstSub.Id;
          // console.log("id " + JSON.stringify(id));

          let coords =  firstSub.Coordinates;
          // console.log("coords " + JSON.stringify(coords[1]));

          let coordsXpre =  coords[1];
          // console.log("coordsX " + JSON.stringify(coordsX));

          let coordsX =  coordsXpre[0].Y[1];
          // console.log("coordsX " + JSON.stringify(coordsX));

          // let spacecraft = params.Result.Data[1][0].Id;
          
            let ace = {};
            ace.time_tag =  params.Result.Data[1][0].Time[1][1];
            let size =  params.Result.Data[1][0].Time[1].length;
            console.log("dscovr bounds " + JSON.stringify(params.Result.Data[1][0].Time[1][1]) + " to  " + params.Result.Data[1][0].Time[1][size-1]);
            console.log("dscovr adjacents " + JSON.stringify(params.Result.Data[1][0].Time[1][2]) + " to  " + params.Result.Data[1][0].Time[1][size-2]);

            ace.x_gse =  params.Result.Data[1][0].Coordinates[1][0].X[1];
            ace.y_gse =  params.Result.Data[1][0].Coordinates[1][0].Y[1];
            ace.z_gse =  params.Result.Data[1][0].Coordinates[1][0].Z[1];
            for (let i = 0; i < ace.x_gse.length; i++) { //push every point
              aceData.push({source: 'ace', x_gse: ace.x_gse[i], z_gse: ace.z_gse[i], y_gse: ace.y_gse[i]});
            }

            let dscovr = {};
            dscovr.time_tag =  params.Result.Data[1][1].Time[1][1];
            size =  params.Result.Data[1][1].Time[1].length;
            console.log("dscovr bounds " + JSON.stringify(params.Result.Data[1][1].Time[1][1]) + " to  " + params.Result.Data[1][1].Time[1][size-1]);
            console.log("dscovr adjacents " + JSON.stringify(params.Result.Data[1][1].Time[1][2]) + " to  " + params.Result.Data[1][1].Time[1][size-2]);
            dscovr.x_gse =  params.Result.Data[1][1].Coordinates[1][0].X[1];
            dscovr.y_gse =  params.Result.Data[1][1].Coordinates[1][0].Y[1];
            dscovr.z_gse =  params.Result.Data[1][1].Coordinates[1][0].Z[1];
            for (let i = 0; i < dscovr.x_gse.length; i++) { //push every point 
              dscovrData.push({source: 'dscovr', x_gse: dscovr.x_gse[i], z_gse: dscovr.z_gse[i], y_gse: dscovr.y_gse[i]});
            }
            console.log("initial aceData.length " + aceData.length);
            console.log("initial dscovrData.length " + dscovrData.length);
      
          // clean up the data and reverse the time order      
            let tempAce = skipDuplicates(aceData);
            let tempDscovr = skipDuplicates(dscovrData);

            console.log("skipped dups aceData.length " + aceData.length);
            console.log("skipped dups dscovrData.length " + dscovrData.length);

          // let coordsY =  params.Result.Data[1][0].Coordinates[1][0].X[1];
          // console.log("coordsY " + JSON.stringify(coordsY));
        
          // subsample the data to improve the rendering performance 
          aceData = subsample(tempAce);  
          dscovrData = subsample(tempDscovr);

          console.log("subsampled aceData.length " + aceData.length);
          console.log("subsampled dscovrData.length " + dscovrData.length);

          loadData();
          updateChart();
     }
     
     function convertTime(time) {

      console.log("hour " + zeroPad(time.getUTCHours()));
      console.log("min " + zeroPad(time.getUTCMinutes()));
      console.log("sec " + zeroPad(time.getUTCSeconds()));

      let d = '' + time.getUTCFullYear() + zeroPad(time.getUTCMonth()+1) + zeroPad(time.getUTCDate());
      let t =  "T" + zeroPad(time.getUTCHours()) + zeroPad(time.getUTCMinutes()) + zeroPad(time.getUTCSeconds()) + "Z";
      console.log("date " + d + " time " + t);

      return '' + d + t; 
     }   

/**
 * Zero Pad
 */
function zeroPad(num){
   return (num >= 0 && num < 10) ? "0" + num : num; //between 0 and 10 add to num
   }

// function zeroPadTwo(num) {
//     let result;
//     if (num > 0 && num < 10){
//         result = "0" + num;
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
