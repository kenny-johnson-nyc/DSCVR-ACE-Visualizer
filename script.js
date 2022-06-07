//global variables

const time_tag = [];
const source = [];
const x_gse = [];
const y_gse = [];
const z_gse = [];
const aceData =[];
const dscovrData = [];
const dscovrBackgroundColor =[];
const aceBackgroundColor = [];

//bubbleChart Setup Block

const data = {
    lables: ['DSCVR','ACE'],
    datasets: [
      {
        label: ["DSCVR"],
        backgroundColor: "rgba(255,221,50,1)",
        borderColor: "rgba(255,221,50,0)",
        data: [{
          
        }]
      }, {
        label: ["ACE"],
        backgroundColor: "rgba(60,186,159,1)",
        borderColor: "rgba(60,186,159,0)",
        data: [{
          
        }]
      }, {
        label: ["SUN"],
        backgroundColor: "rgba(255,214,0,1)",
        borderColor: "rgba(60,186,159,0)",
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
    
    title: {
      display: true,
      text: 'DSCVR/ACE current and past position visualizer'
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
          labelString: "Y-axis",
        
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
          labelString: "X-axis",
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
  bubbleChart.update();
  //bubbleChart.data.datasets[0].data = x_gse
}

function responsiveFont(){
  console.log(window.outerWidth)
};

//-----Papaparse
const uploadconfirm = document.getElementById('uploadconfirm').addEventListener('click', () => {
  Papa.parse(document.getElementById('uploadfile').files[0], {
      download: true,
      header: true, 
      skipEmptyLines: true,
      complete: function(results){
        let i;
        let dscovr=[];
        let ace=[];
        
         // console.log(results);
   // split data by spacecraft (source)
        
        let splitData=splitBySpacecraft(results);
        dscovr=splitData.dscovr;
        ace=splitData.ace;
        
    // skip duplicates create temp arrays
        
        let tempAce=skipDuplicates(ace);
        let tempDscovr=skipDuplicates(dscovr);
        
        

        //take data from last 720 (1 month=hourly data 24hrsx30days) of each spacecraft 
        
        for (i = 0; i < tempDscovr.length; i+=12) {
                dscovrData.push(tempDscovr[i]);
                time_tag.push(tempDscovr[i].time_tag);
                source.push(tempDscovr[i].source);
                x_gse.push(tempDscovr[i].x_gse);
                y_gse.push(tempDscovr[i].y_gse);
                z_gse.push(tempDscovr[i].z_gse);
        }
        for (i = 0; i < tempAce.length; i+=12) {
                aceData.push(tempAce[i]);
                time_tag.push(tempAce[i].time_tag);
                source.push(tempAce[i].source);
                x_gse.push(tempAce[i].x_gse);
                y_gse.push(tempAce[i].y_gse);
                z_gse.push(tempAce[i].z_gse);
    
               
        }
          console.log(time_tag);
          console.log(source);
          console.log(x_gse);
          console.log(y_gse);
          console.log(z_gse);
        
          loadData();
          updateChart();
      }
  });
});

// label: ["DSCVR"],
//         backgroundColor: "rgba(255,221,50,1)",
//         borderColor: "rgba(255,221,50,1)",
//         data: [{
          
//         }]
//       }, {
//         label: ["ACE"],
//         backgroundColor: "rgba(60,186,159,1)",
//         borderColor: "rgba(60,186,159,1)",
//         data: [{

function loadData() {
  for (i = 0; i < dscovrData.length; i++){
    //transform gse to window
  let d = {x:dscovrData[i].y_gse, y:dscovrData[i].z_gse, r:3};
  data.datasets[0].data.push(d);
   //bubbles reduce opacity every iteration 
    dscovrBackgroundColor.push("rgba(0,195,255,"+(dscovrData.length-i)/ dscovrData.length+")"); 
    
  }
  data.datasets[0].backgroundColor = dscovrBackgroundColor;
  for (i = 0; i < aceData.length; i++){
    
  let d = {x:aceData[i].y_gse, y:aceData[i].z_gse, r:3};
  data.datasets[1].data.push(d);
  
  aceBackgroundColor.push("rgba(203,51,58,"+(aceData.length-i)/aceData.length+")");
    
  }
  data.datasets[1].backgroundColor=aceBackgroundColor;
}

// const data = {
//     lables: ['DSCVR','ACE'],
//     datasets: [
//       {
//         label: ["DSCVR"],
//         backgroundColor: "rgba(255,221,50,0.2)",
//         borderColor: "rgba(255,221,50,1)",
//         data: [{
//           x: -29254,
//           y: -223039,
//           r: 20,
//         }]
//       }, {
//         label: ["ACE"],
//         backgroundColor: "rgba(60,186,159,0.2)",
//         borderColor: "rgba(60,186,159,1)",
//         data: [{
//           x: 76536,
//           y: 165828,
//           r: 20,
//         }]
//       }, {
//       }
//     ]
// };


function splitBySpacecraft(results) {
  let splitData = {};
  let i;
  let dscovr=[];
  let ace=[];
  
  // split data by spacecraft (source)
        for (i = 0; i < results.data.length; i++){
          if (results.data[i].source==="ACE"){
            ace.push(results.data[i]);
          } else {
            dscovr.push(results.data[i]);
          }
        }
  
  splitData.ace=ace;
  splitData.dscovr=dscovr;
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