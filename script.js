//global variables

const time_tag = [];
const source = [];
const x_gse = [];
const y_gse = [];
const z_gse = [];
const aceData =[];
const dscovrData = [];
const dscovrBackgroundColor = [];
const aceBackgroundColor = [];
const E = 8;



//bubbleChart Setup Block

const data = {
    lables: ['DSCOVR','ACE','SUN'],
    datasets: [
      {
        label: ["DSCOVR"],
        backgroundColor: dscovrBackgroundColor,
        borderColor: "rgba(255,221,50,0)",
        data: [{
          
        }]
      }, {
        label: ["ACE"],
        backgroundColor: aceBackgroundColor,
        borderColor: "rgba(60,186,159,0)",
        data: [{
          
        }]
      }, {
        label: ["SUN"],
        backgroundColor: "rgba(255,214,0,.5)",
        borderColor: "rgba(255,214,0,.7)",
        data: [{
          x:0,
          y:0,
          r:12,
        }]
      }
    ]
};

//bubbleChart config block

const config = {
  type: 'bubble',
  data,
  options: {
    animations: {
      tension: {
        duration: 5000,
        easing: 'easeInOutQuart',
        from: 0,
        to: 5,
        
      }

    },
    
    title: {
      display: true,
      text: 'DSCOVR/ACE visualizer',
      fontSize: 20,
    }, 

plugins: {
  legend: {
    labels: {
      font: {
        size:30
      }
    }
  }
},
    scales: {
      yAxes: [{
        ticks: { 
          beginAtZero: false,
          min: -300000,
          max:  300000
          
        },
        scaleLabel: {
          display: true,
          labelString: "GSE Z-axis (km)", 
          fontSize: 16,
        
        }
      }],
      xAxes: [{ 
        ticks: {
          beginAtZero: false,
          min: -300000,
          max: 300000
        },
        scaleLabel: {
          display: true,
          labelString: "GSE Y-axis (km)", 
          fontSize: 16,
        }
      }]
    }    
  }

}


//bubbleChart init block

const bubbleChart = new Chart(
  document.getElementById('bubbleChart'),
  config

);

function updateChart(){
  // console.log("updateChart: dscovr data[1] " + JSON.stringify(data.datasets[0].data[1]));
  // console.log("updateChart: dscovr backgroundColor[1] " + JSON.stringify(data.datasets[0].backgroundColors[1]));

  bubbleChart.update();
  //bubbleChart.data.datasets[0].data = x_gse
}

function responsiveFont(){
  //console.log(window.outerWidth)
};

//-----Papaparse
//-----begins executing
const uploadconfirm = document.getElementById('uploadconfirm').addEventListener('click', () => {
  console.log("uploadconfirm " + document.getElementById('uploadfile').files);
  uploadFile(document.getElementById('uploadfile').files[0]);
});

function uploadFile(params) {  
  console.log("uploadFile: params " + JSON.stringify(params));
  Papa.parse(params, {
      download: true,
      header: true, 
      skipEmptyLines: true,
      complete: function(results) {
        let i;
        let dscovr=[];
        let ace=[];
        
         //console.log("# of datapoints " + results.length);
   // split data by spacecraft (source)
        
        let splitData=splitBySpacecraft(results);
        dscovr=splitData.dscovr;
        ace=splitData.ace;
        
    // skip duplicates create temp arrays
        
    let tempAce=skipDuplicates(ace);
    let tempDscovr=skipDuplicates(dscovr);
    rate = 168; //rate=number of hours between samples (168=weekly)

    for (i = 0; i < rate*sampleCount; i+=rate) { // length of sample
            dscovrData.push(tempDscovr[i]);
            time_tag.push(tempDscovr[i].time_tag);
            source.push(tempDscovr[i].source);
            x_gse.push(tempDscovr[i].x_gse);
            y_gse.push(tempDscovr[i].y_gse);
            z_gse.push(tempDscovr[i].z_gse);
    }
    for (i = 0; i < rate*sampleCount; i+=rate) {
            aceData.push(tempAce[i]);
            time_tag.push(tempAce[i].time_tag);
            source.push(tempAce[i].source);
            x_gse.push(tempAce[i].x_gse);
            y_gse.push(tempAce[i].y_gse);
            z_gse.push(tempAce[i].z_gse);

           
    }
      // console.log(time_tag);
      // console.log(source);
      // console.log(x_gse);
      // console.log(y_gse);
      // console.log(z_gse);
    
      loadData();
      updateChart();
   }
  });
};

  function bubbleFader(dataPoints, backgroundColors, colors, spaceCraft) {
    // console.log("dataPoints.length " + dataPoints.length);
    let i;
    for (i = 0; i < dataPoints.length; i++){
     let bubbleRadius = 0.1 + Math.abs((i-dataPoints.length))**E/(dataPoints.length)**E;
     let d = {x:dataPoints[i].y_gse, y:dataPoints[i].z_gse, r:10};
     data.datasets[spaceCraft].data.push(d);
                                                 
       //console.log("alpha " + ((dataPoints.length-i)/ dataPoints.length));
       backgroundColors.push(colors+((dataPoints.length-i)/ dataPoints.length)+")"); 
        //console.log("color[" + i + "] " + backgroundColors[backgroundColors.length-1]);
     }
      data.datasets[spaceCraft].backgroundColors = backgroundColors;   
 }
   function loadData() {
    bubbleFader(dscovrData,dscovrBackgroundColor,"rgba(0,195,255,", 0);
    bubbleFader(aceData,aceBackgroundColor,"rgba(203,51,58,", 1); 
 }

   // split data by spacecraft (source)
function splitBySpacecraft(results) {
  let splitData = {};
  let i;
  let dscovr=[];
  let ace=[];
  

        for (i = 0; i < results.data.length; i++){
          if (results.data[i].source==="ACE"){
            ace.push(results.data[i]);
          } else {
            dscovr.push(results.data[i]);
          }
        }
  
  splitData.ace = ace;
  splitData.dscovr = dscovr;
  return splitData;
  
}

function skipDuplicates(data) {
  let temp=[];
  let i;
  let last;

  for (i = data.length -1; i >= 0; i--) {
  
    if (data[i]!==last){
      temp.push(data[i]);
             }
      last = data[i];
       }
  return temp;
}







