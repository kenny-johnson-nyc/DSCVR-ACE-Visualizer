// Constants for calculations
export const millisPerMinute = 60 * 1000;
export const distanceToSun = 93000000; // miles
export const radiusSun = 432690; // sun radius in miles
export const distanceToL1 = 1000000; // distance to L1 from Earth
export const l1 = 1600000; // L1 distance in miles
export const speedOfLight = 3e8; // m/s 
export const dscovrFrequencyMHz = 2215;
export const frequencyMHzACE = 2278.35;
export const minutesPerPoint = 12; // SSCweb data for ACE and DSCOVR is resolution 720 = 12 minutes per point
export const pointsPerWeek = 7 * 24 * (60 / minutesPerPoint); // 7 days * 24 hours * 60 minutes / 12 minutes per point
export const subsampleFactor = 840; // Default value

// GSE coordinates
export const sunGSE = [[91806000, 0, 0]]; // GSE coordinates of the sun
export const earthGSE = [[0, 0, 0]]; // GSE coordinates of Earth
export const sunEarthLine = [[0, 0, 0], [91806000, 0, 0]]; // line from sun to earth with earth at origin

// SEZ calculations
export const sezHalfrad = Math.tan(toRadians(0.5)) * l1; // SEZ 0.5 radius
export const sez2rad = Math.tan(toRadians(2)) * l1; // SEZ 2 radius
export const sez4rad = Math.tan(toRadians(4)) * l1; // SEZ 4 radius

// Wavelength and antenna calculations
export const wavelengthDSCOVR = speedOfLight / (dscovrFrequencyMHz * 1e6);
export const wavelengthACE = speedOfLight / (frequencyMHzACE * 1e6);
export let antennaDiameter = 6; // meters
export let angleRadiansACE = wavelengthACE / antennaDiameter;
export let angleRadians = wavelengthDSCOVR / antennaDiameter;
export let angleDegrees = angleRadians * 57.295779513; // angleDegrees is approximately 1.3 

// Time and data management
export let startTime, endTime = new Date();
export let weeksPerOrbit = 26;  // # of samples, e.g., 26 weeks = months = 1 orbit
export let aceData = [], dscovrData = [];
export let beamWidthData = [];

// SEZ circle data
export let sezHalfDegData = buildCircle(sezHalfrad, 0); // SEZ 0.5 degree radius
export let sez2DegData = buildCircle(sez2rad, 0);       // SEZ 2 degrees radius
export let sez4DegData = buildCircle(sez4rad, 0);       // SEZ 4 degrees radius

// Chart placeholder
export let chart;

// Define the namespace for XML parsing
export const namespace = "http://sscweb.gsfc.nasa.gov/schema";