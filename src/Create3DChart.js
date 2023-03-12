import React from 'react';
import Highcharts3d from 'highcharts/highcharts-3d';

// Define sample data for satellites
const satelliteData = [{
    name: 'Satellite 1',
    x: 10,
    y: 20,
    z: 30,
    altitude: 1000
}, {
    name: 'Satellite 2',
    x: 20,
    y: 30,
    z: 40,
    altitude: 2000
}, {
    name: 'Satellite 3',
    x: 30,
    y: 40,
    z: 50,
    altitude: 3000
}];

// Define chart options
const options = {
    chart: {
        type: 'scatter3d',
        options3d: {
            enabled: true,
            alpha: 10,
            beta: 30,
            depth: 250,
            viewDistance: 5,
            fitToPlot: false,
            frame: {
                bottom: { size: 1, color: 'rgba(0,0,0,0.02)' },
                back: { size: 1, color: 'rgba(0,0,0,0.04)' },
                side: { size: 1, color: 'rgba(0,0,0,0.06)' }
            }
        }
    },
    title: {
        text: 'Satellite Positions'
    },
    xAxis: {
        title: {
            text: 'X Position'
        }
    },
    yAxis: {
        title: {
            text: 'Y Position'
        }
    },
    zAxis: {
        title: {
            text: 'Z Position'
        }
    },
    series: [{
        name: 'Satellites',
        colorByPoint: true,
        data: satelliteData.map(satellite => ({
            x: satellite.x,
            y: satellite.y,
            z: satellite.z,
            name: satellite.name,
            altitude: satellite.altitude
        }))
    }]
};

// Render Highcharts 3D chart
const Chart = () => (
    <div>
        <Highcharts3d options={options} />
    </div>
);

export default Chart;