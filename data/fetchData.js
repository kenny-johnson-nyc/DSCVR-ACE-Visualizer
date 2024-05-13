import { convertTime } from '../utils/dateTimeUtils.js';

export async function fetchDataFromAPI(url) {
  try {
    const response = await fetch(url);
    const data = await response.text();
    return data;
  } catch (error) {
    console.error("Error fetching data:", error);
    return null;
  }
}

export function buildFullUrl(startTime, endTime) {
  const baseUrl = 'https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/';
  const observatories = 'ace,dscovr';
  const timeRange = `${convertTime(startTime)},${convertTime(endTime)}`;
  const coordinateSystems = 'gse';
  return `${baseUrl}${observatories}/${timeRange}/${coordinateSystems}/`;
}