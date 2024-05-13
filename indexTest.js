// import { fetchDataFromAPI, buildFullUrl } from './src/data/fetchData.js';
// import { processXMLData, extractData } from './src/data/processData.js';
// import { create3DChart, addDragFunctionality } from './src/charts/chartManagement.js';

// async function initializeChart() {
//   const startTime = new Date(); // Adjust as needed
//   const endTime = new Date(); // Adjust as needed
//   const url = buildFullUrl(startTime, endTime);
//   const xmlData = await fetchDataFromAPI(url);
//   if (xmlData) {
//     const xmlDoc = processXMLData(xmlData, "http://sscweb.gsfc.nasa.gov/schema");
//     // Assuming you have specific IDs or tags to extract for ACE and DSCOVR data
//     const aceData = extractData(xmlDoc, 'ACE');
//     const dscovrData = extractData(xmlDoc, 'DSCOVR');

//     // Create the chart and add drag functionality
//     const chart = create3DChart('container'); // Ensure you have a container with id 'container' in your HTML
//     addDragFunctionality(chart);

//     // Update the chart with the extracted data
//     if (chart && chart.series.length > 1) {
//       chart.series[0].setData(aceData);
//       chart.series[1].setData(dscovrData);
//     } else {
//       console.error("Chart series not defined or chart not initialized.");
//     }
//   } else {
//     console.error("Failed to fetch or process XML data.");
//   }
// }

// initializeChart();