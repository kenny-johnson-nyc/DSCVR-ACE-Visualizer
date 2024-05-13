import { chartOptions } from './chartOptions.js';

export function create3DChart(containerId) {
  Highcharts.setOptions(Highcharts.theme);
  const chart = new Highcharts.Chart(containerId, chartOptions);
  return chart;
}

// Function to add dragging functionality
function addDragFunctionality(chart) {
    function dragStart(eStart) {
        eStart = chart.pointer.normalize(eStart); // Normalize the event coordinates
  
        const posX = eStart.chartX;
        const posY = eStart.chartY;
        let alpha = chart.options.chart.options3d.alpha;
        let beta = chart.options.chart.options3d.beta;
        const sensitivity = 5; // Adjust sensitivity for more or less responsiveness
  
        function drag(e) {
            e = chart.pointer.normalize(e); // Normalize the event coordinates
            // Update the alpha and beta angles based on the movement
            const newAlpha = alpha + (e.chartY - posY) / sensitivity;
            const newBeta = beta + (posX - e.chartX) / sensitivity;
  
            chart.update({
                chart: {
                    options3d: {
                        alpha: newAlpha,
                        beta: newBeta
                    }
                }
            }, undefined, undefined, false);
        }
  
        function unbindAll() {
            Highcharts.removeEvent(document, 'mousemove', drag);
            Highcharts.removeEvent(document, 'touchmove', drag);
            Highcharts.removeEvent(document, 'mouseup', unbindAll);
            Highcharts.removeEvent(document, 'touchend', unbindAll);
        }
  
        Highcharts.addEvent(document, 'mousemove', drag);
        Highcharts.addEvent(document, 'touchmove', drag);
        Highcharts.addEvent(document, 'mouseup', unbindAll);
        Highcharts.addEvent(document, 'touchend', unbindAll);
    }
  
    Highcharts.addEvent(chart.container, 'mousedown', dragStart);
    Highcharts.addEvent(chart.container, 'touchstart', dragStart);
  }