export const chartOptions = {
    chart: {
        type: 'scatter3d',
        renderTo: 'container',
        fitToPlot: 'true',
        reflow: 'false',
        spacingTop: 25,
        spacingBottom: 15,
        spacingRight: 10,
        spacingLeft: 10,
        marginTop: 0,
        marginBottom: 0,
        marginRight: 0,
        marginLeft: 0,
        allowMutatingData: false,
        animation: true,
        exporting: {
            enabled: false
        },
        options3d: {
            enabled: true,
            alpha: 0,
            beta: -90,
            depth: 500,
            viewDistance: 3,
            frame: {
                left: { visible: false },
                right: { visible: false },
                front: { visible: false },
                back: { visible: false },
                top: { visible: false },
                bottom: { visible: false }
            }
        }
    },
    title: {
        text: null
    },
    subtitle: {
        text: null,
        align: 'center'
    },
    plotOptions: {
        scatter3d: {
            animation: true,
            animationLimit: 1000,
            animationDuration: 1000,
            turboThreshold: 100000,
            allowPointSelect: true,
            point: {
                events: {
                    drag: function (event) {
                        event.target.update({ animation: false });
                    },
                    drop: function (event) {
                        event.target.update({ animation: true });
                    }
                }
            },
            marker: {
                states: {
                    hover: {
                        enabled: true,
                        lineColor: 'rgb(100,100,100)',
                        lineWidth: 1
                    },
                    select: {
                        enabled: true,
                        lineColor: 'rgb(100,100,100)',
                        lineWidth: 1
                    }
                }
            },
            tooltip: {
                shared: false,
                useHTML: true,
                valueDecimals: 0
            }
        }
    },
    yAxis: {
        min: -300000,
        floor: -300000,
        max: 300000,
        title: {
            text: 'GSE Z-axis'
        },
        opposite: true,
        labels: {
            skew3d: true,
            style: {
                color: 'rgba(255,255,255, 0.8)'
            }
        }
    },
    xAxis: {
        zoomEnabled: true,
        floor: 0,
        gridLineWidth: 1,
        title: {
            text: 'GSE X-axis'
        },
        opposite: false,
        labels: {
            skew3d: true,
            style: {
                color: 'rgba(255,255,255, 0.8)'
            }
        }
    },
    zAxis: {
        min: -300000,
        floor: -300000,
        max: 300000,
        title: {
            text: 'GSE Y-axis'
        },
        opposite: false,
        labels: {
            skew3d: true,
            style: {
                color: 'rgba(255,255,255, 0.8)'
            }
        }
    },
    legend: {
        enabled: true,
        width: '100%',
        title: {
            text: 'Click to hide/show',
            style: {
                color: 'rgba(255,255,255, 0.8)',
                fontSize: '10px',
                fontWeight: 'light',
                letterSpacing: '1px'
            }
        },
        align: 'center',
        verticalAlign: 'top',
        layout: 'horizontal',
        labelFormatter: function () {
            return this.name;
        },
        itemStyle: {
            color: 'rgba(255,255,255, 0.8)'
        },
        itemHoverStyle: {
            color: 'rgba(255,255,255, 1)'
        },
        itemHiddenStyle: {
            color: 'rgba(255,255,255, 0.3)'
        }
    },
    series: [
        {
            name: "DSCOVR",
            lineWidth: 0.2,
            lineColor: 'rgba(255, 255, 255, 1)',
            lineZIndex: 1,
            zIndex: 3,
            tooltip: {
                headerFormat: '<span>{series.name}</span>',
                pointFormat: '</span> <br>X GSE :{point.x} <br>Y GSE: {point.y} <br> Z GSE: {point.z} <br> UTC: {point.custom}',
                footerFormat: '</p>'
            },
            marker: {
                symbol: 'circle',
                radius: 5,
            },
            color: 'rgb(0, 0, 255)'
        },
        {
            name: "ACE",
            lineWidth: 0.2,
            lineColor: 'rgba(255, 255, 255, 1)',
            lineZIndex: 1,
            zIndex: 3,
            tooltip: {
                headerFormat: '<span>{series.name}</span>',
                pointFormat: '</span> <br>X GSE: {point.x} <br>Y GSE: {point.y} <br>Z GSE: {point.z} <br> UTC: {point.custom}',
                footerFormat: '</p>',
            },
            marker: {
                symbol: 'circle',
                radius: 5,
            },
            color: 'rgb(36, 201, 85)'
        },
        {
            name: "SEZ 2.0 deg",
            lineWidth: 1,
            visible: true,
            zIndex: 2,
            color: 'rgba(255, 0, 0, 1)',
            marker: {
                enabled: false
            }
        },
        {
            name: "SEZ 4.0 deg",
            lineWidth: 1,
            visible: true,
            zIndex: 2,
            color: 'rgba(255, 255, 51, 1)',
            marker: {
                enabled: false
            }
        },
        {
            name: "SUN",
            visible: false,
            lineWidth: 1,
            zIndex: 1,
            marker: {
                fillColor: 'yellow',
                symbol: 'url(imgs/sun.png)',
                height: 34,
                width: 34,
            }
        },
        {
            name: "EARTH",
            lineWidth: 1,
            zIndex: 2,
            visible: false,
            marker: {
                fillColor: 'blue',
                symbol: 'url(imgs/earth.png)',
                height: 15,
                width: 15,
                radius: 1,
            }
        },
        {
            name: "Sun-Earth line",
            lineWidth: 1,
            visible: false,
            marker: {
                fillColor: 'orange',
                symbol: 'circle',
                radius: 1,
            }
        }
    ]
};

