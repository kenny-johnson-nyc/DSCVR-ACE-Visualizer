document.addEventListener('DOMContentLoaded', () => {
    Highcharts.chart('container', {
        chart: {
            type:'spline'
        },
        xAxis: {
            categories: ['Apple', 'Bananas', 'Oranges']
        },
        series: [
            {
                name: 'John',
                data: [1, 20, 3]
            },
            {
                name: 'Jane',
                data: [2, 40, 6]
            }
        ]
    }); 
});