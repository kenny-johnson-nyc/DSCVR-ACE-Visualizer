//variables

const time_tag = [];
const source = [];
const x_gse = [];
const y_gse = [];
const z_gse = [];






//bubbleChart Setup Block

const data = {
    lables: ['DSCVR','ACE'],
    datasets: [
      {
        label: ["DSCVR"],
        backgroundColor: "rgba(255,221,50,0.2)",
        borderColor: "rgba(255,221,50,1)",
        data: [{
          x: 1479696,
          y: -235986,
          //need to reduce r range, bubbles too small
          r: 40,
        }]
      }, {
        label: ["ACE"],
        backgroundColor: "rgba(60,186,159,0.2)",
        borderColor: "rgba(60,186,159,1)",
        data: [{
          x: 1539715,
          y: 126056,
           
          r: 40,
        }]
      }, {
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

    scales: {
      someoption: {
        
      },
      yAxes: [{ 
        min:25000,
        ticks: {
          beginAtZero: false,
          min: -2e6,
          max:  2e6
        },
        scaleLabel: {
          display: true,
          labelString: "Y-axis",
        
        }
      }],
      xAxes: [{ 
        ticks: {
          beginAtZero: false,
          min: -2e6,
          max: 2e6
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
  bubbleChart.data.datasets[0].data = x_gse
}







function responsiveFont(){
  console.log(window.outerWidth)
};






//Papaparse
const uploadconfirm = document.getElementById('uploadconfirm').addEventListener('click', () => {
  Papa.parse(document.getElementById('uploadfile').files[0], {
      download: true,
      header: true, 
      skipEmptyLines: true,
      complete: function(results){
          //console.log(results);
          for (i = 0; i < 10; i++) {
            time_tag.push(results.data[i].time_tag);
            source.push(results.data[i].source);
            x_gse.push(results.data[i].x_gse);
            y_gse.push(results.data[i].y_gse);
            z_gse.push(results.data[i].z_gse);
              

          }
          console.log(time_tag);
          console.log(source);
          console.log(x_gse);
          console.log(y_gse);
          console.log(z_gse);
          
      }
  });
});

