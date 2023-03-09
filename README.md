# DSCOVR-ACE-Visualizer

## Description

## TODO

 Not clear that the chart resizes when you turn series on and off. Or that you even can.

#Slider needs to pull from local storage and update chart. Local storage should only be called once. Set expiration date to 1 day.

 Responsize buttons

 I like it. Can you zoom? - Monty

 Monty - ACE is so close to the earth when you are showing the Sun in the representation that it may be hard to visualize how far the satellite is from an earth to L1 perspective only, either or both perspectives are useful I think.  That’s all I was thinking about. 

 A couple of questions. Where is the Earth? I see the icon in the legend, but don't see it anywhere on the interactive portion.Is it possible to put the numeric representation of the position on the dot representing the latest position relative to the ecliptic plane (+/- XX°)? Again, this is awesome!  Thank you to you and your son!

 Monty - The most useful for ops is a ground track overlayed on the earth.  But for illustration purposes, probably a 1 AU distance plot with just the earth, possibly moon, and the satellites.

 Like this, easy for an earth orbiting satellite I guess we could do the same, vector out from center of the earth to the spacecraft positionIt would have to be a separate graphic, maybe as an inset. I thought adding the Moon was a great idea Maybe the Sun, that’s only handy for context, but usually they’re just interested in the Earth-L1 system L1 is about 4x farther than the Moon 


The purpose of this project is to visualize the data from the DSCOVR-ACE satellite. The data is provided by the [NASA API](https://api.nasa.gov/). The data is visualized using [Highcharts3D.js](https://www.highcharts.com/products/highcharts-3d) and [Highcharts.js](https://www.highcharts.com/).