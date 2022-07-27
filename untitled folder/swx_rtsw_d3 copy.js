(function ($) {

  /**
   * Kp9m vs G4 Fix
   A deep-dive meeting with forecasters, researchers, developers, and managers was held on November 19. This meeting helped more fully describe the problem at hand and what potential solutions existed. Key outcomes included:
   ■ Go with +,o,- notation for new products, but don’t replace p,z,m notation on existing products until a later iteration with appropriate customer notification (NWSI 10-102).
   ■ Use numeric values to two decimal places ‘rounded’ to thirds, e.g., 8.00, 8.33, 8.67
   ■ Review what products should be discontinued and then do so using the appropriate process (NWSI 10-102)
   ■ Discontinue ‘rounding’ Kp=9m to Kp=8p ASAP
   A Jira story was created to eliminate rounding from the database view and this will be done when resources currently working on ICAO become available around mid-December. In addition, a spreadsheet documenting all affected applications and models was reviewed and updated.
   */

  /**
   * RTSW Web plot generation.
   * @author jjohnson
   */

  // the full arrays of all loaded data
  var magData;
  var plasmaData;
  var kpApData;
  var enlilData;
  var geospaceData;

  // the data arrays filtered by current user selection of source vs active
  var filteredMagData;
  var filteredPlasmaData;

  // the last loaded Phase II file numbers for PlasMag recurrence
  var recurrenceStartNumber;
  var recurrenceEndNumber;

  // recurrence data from -54 to -27 days shifted forward
  var magDataRecurrence;
  var plasmaDataRecurrence;
  var filteredMagDataRecurrence;
  var filteredPlasmaDataRecurrence;

  // current data shifted forward 27 days
  var mdatar;
  var pdatar;
  var kdatar;
  var filteredMdatar;
  var filteredPdatar;

  // the last loaded Phase II file numbers for KpAp recurrence
  var kpApRecurrenceStartNumber;
  var kpApRecurrenceEndNumber;
  var kpApDataRecurrence;

  // the length of a recurrence rotation in days
  var CARRINGTON_ROTATION = 27.2753;
  var CARRINGTON_ROTATION_MINUTE = CARRINGTON_ROTATION * 1440;

  // margin contains the date range labels on the top row, then the timestamp hover readout on the second row
  var margin_top = 34;
  var margin_bottom = 0;
  var margin_left = 68;
  var margin_right;
  var plt_width;
  var plt_height;
  var plt_gap;

  var FLAG_LINES = 3;
  var FLAG_FONT_SIZE = 9;
  var FLAG_GAP = 1;
  var FLAG_LINE_WIDTH = 2;
  var FLAG_HEIGHT = FLAG_GAP + (FLAG_LINES * (FLAG_LINE_WIDTH + FLAG_GAP)) + FLAG_GAP + FLAG_FONT_SIZE;
  var flagBox;
  var ZOOM_HEIGHT = 7;
//  var ZOOM_GAP = 4; //8;
  var zoomBox;

  var legendBox;

  // allowance for the flag strips, date axis, and zoom box below the plots (11 is the font size, 2 is the gaps above/below text)
  var guide_plt_height;

  var boxes;
  var box_guide;

  var full_width;
  var full_height;

  var focus;
  var vert_line_marker_opacity = 0.4;
  var band_opacity = 0.4;

  // helper function to return a javascript datetime object from a parsed date string
  var parseDate2 = d3.time.format.utc("%Y-%m-%d %H:%M:%S").parse;
  var bisectDate = d3.bisector(function (d) {
    return d.time_tag;
  }).left;
  var formatValue_0f = d3.format(" .0f");
  var formatValue_1f = d3.format(" .1f");
  var formatValue_2f = d3.format(" .2f");
  var formatValue_2e = d3.format(" .2e");

  // the time x-axis of the plots (may be zoomed in from the overall timespan)
  var x_scale;
  // the time x-axis of the zoombox
  var x_scale_timespan;

  // whether to show y-axis labels or not
  var SHOW_LABELS = true;
  var NO_LABELS = false;

  // the main SVG element
  var main_graphic;

  // plot grid lines
  var gridlines;

  // the zoom drag rectangle top-level svg element
  var dragbox;
  var zoomdragbox;

  var DRAG_BOX_OPACITY = '0.4';
//  var ZOOM_DRAG_BOX_OPACITY = '0.6';

  var transition_time = 500;
//  var yaxis_A_grp, yaxis_B_grp, yaxis_D_grp,
  var xaxis_E_grp;

  // the text labels at the top of the screen
  var infoLabel = "SWPC";
  var zoomIntervalSizeLabel = "filler";
  var timespanStartDateLabel = "filler";
  var timespanStartTimeLabel = "filler";
  var startDateLabel = "filler";
  var endDateLabel = "filler";
  var resolutionLabel = "filler";
  var reportBLabel = "filler";

  var zoomBoxYScale;

// ***********************************************************************************************************
//  global variables and constants
// ***********************************************************************************************************

  // CONFIGURABLE CONSTANTS - BEGIN
  //
  var CURRENT_DATA_THRESHOLD_SECONDS = 300;
  var COOKIE_EXPIRATION_DAYS = 365;
  //
  // CONFIGURABLE CONSTANTS - END

  // ************ REMOVE for WOC - begin ************
  // load JSON files via servlet
  // PRODUCTION
  var DTS_DATA_SERVICE_URL = "http://ncs-rtsw-proc-lx:8080/rtsw/json/";
  // MY DEV box (my use only)
  DTS_DATA_SERVICE_URL = "http://140.172.223.242:8080/rtsw/json/";
  // DTS_DATA_SERVICE_URL = "https://services.swpc.noaa.gov/text/rtsw/data/";

  // ************ REMOVE for WOC - end ************

// time constants
  var ONE_HOUR_MS = 3600000;
//  var FIFTEEN_MINUTE_MS = 900000;
  var ONE_MINUTE_MS = 60000;
  var ONE_SECOND_MS = 1000;
  var ONE_DAY_MS = 24 * ONE_HOUR_MS;
  var ONE_YEAR_MS = 365 * ONE_DAY_MS;

  // number of seconds between data fetch attempts
  var UPDATE_RATE_SEC = 60;

  // arbitrary threshold for what differentiates "small" (i.e., mobile) and desktop devices in terms of layout only
  var LARGE_SCREEN_WIDTH = 800;

  // readout sized for high-res timestamp
  var READOUT_WIDTH = 110;

  // the minimum number of pixels the user must move to be considered a zoom
  var MIN_ZOOM_MOVEMENT = 5;

//
// global variables
//

  // the time span of all of the graphs (backwards from the present)
  var currentSpanHours = null;

  // accessor for the zoom window
  var zoomController = null;

  // dates are of type Moment
  var startMoment;
  var endMoment;

  // the number of time the updateSeries method was called
  var updateCount = 0;

  // last data record dates are of type Moment
  var lastMagDataMoment;
  var lastPlasmaDataMoment;
  var lastDataMoment;
  var lastKpApDataMoment;

  var newMagData = false;
  var newPlasmaData = false;
  var newKpApData = false;

// Jeff's color choices for light background
// var DARK_GRAY = "#808080";
// var RED = "#ff4040";
// var BLUE = "#0066cc";
// var ORANGE = "#ff9900";
// var YELLOW = "#eeee00";
// var GREEN = "#00bb00";

// Doug's STEREO color choices for light background
//    var RED = "#ff0000";
//    var BLACK = "#000000";
//    var BLUE = "#00b2ff";
//    var ORANGE = "#ff6e00";
//    var GREEN = "#06ff00";

  // final (possibly adjusted) values for light background
  var RED = "#ff0000";
  var BLACK = "#000000";
  var WHITE = "#ffffff";
  var BLUE = "#00b2ff";
  var ORANGE = "#ff6e00";
  var ORANGE_GRAY = "#f4c242";
  var DARK_ORANGE = "#e67e00";
  var GREEN = "#06bb00";
  var GREEN_GRAY = "#79d17a";
  var YELLOW = "#ffd700";
  var DARK_YELLOW = "#ebc600";
  var PURPLE = "#8a2be2";
  var PURPLE_GRAY = "#926bd6";
  var DARK_BLUE = "#0000ff";
  var MAGENTA = "#ff00b2";
  var GRAY = "#888888";
  var WHITE_BACKGROUND_COLOR = "#fefefe";
  var BLACK_BACKGROUND_COLOR = "#111111";
  var WHITE_BACKGROUND_LINE_COLOR = "#666666";
  var BLACK_BACKGROUND_LINE_COLOR = "#bbbbbb";
  var WHITE_BACKGROUND_LABEL_COLOR = "#666666";
  var BLACK_BACKGROUND_LABEL_COLOR = "#dddddd";
  var WHITE_BACKGROUND_BORDER_COLOR = "#eeeeee";
  var BLACK_BACKGROUND_BORDER_COLOR = "#454545";
  var ZOOM_BOX_LINE_COLOR = "#a0522d";
//  var INDICATOR_COLOR = "#006bff";

  // the timespan selection
  var TIMESPAN_COOKIE = 'timespanV3';

  // the plot & page background color scheme (Black or White)
  var COLOR_SCHEME_COOKIE = 'colorscheme';
  var WHITE_SCHEME = 'White';
  var BLACK_SCHEME = 'Black';
  var colorScheme = WHITE_SCHEME;

  // the plot series rendering scheme (Marker or Line)
  var RENDER_SCHEME_COOKIE = 'renderscheme';
  var MARKER_SCHEME = 'Marker';
  var LINE_SCHEME = 'Line';
  var HYBRID_SCHEME = 'Hybrid';
  var renderScheme = MARKER_SCHEME;

  // the Y-axis label position scheme (Left or Alternating)
  var Y_LABEL_SCHEME_COOKIE = 'ylabelscheme';
  var Y_LEFT_SCHEME = 'Left';
  var Y_ALTERNATING_SCHEME = 'Alternating';
  var yLabelScheme = Y_LEFT_SCHEME;

  // the Recurrence underlay display scheme (true or undefined)
  var RECURRENCE_SCHEME_COOKIE = 'recurrencescheme';
  var SHOW_RECURRENCE_SCHEME = 'true';
  var HIDE_RECURRENCE_SCHEME = 'false';
  var recurrenceScheme = 'true';
  var recurrenceOpacity = 0.4;

  // the KpAp overlay display scheme (true or undefined)
  var KPAP_SCHEME_COOKIE = 'kpapscheme';
  var SHOW_KPAP_SCHEME = 'true';
  var HIDE_KPAP_SCHEME = 'false';
  var kpApScheme;
  var KP_RECURRENCE_BAR_HEIGHT = 3;

  // the Enlil overlay display scheme (true or undefined)
  var ENLIL_SCHEME_COOKIE = 'enlilscheme';
  var SHOW_ENLIL_SCHEME = 'true';
  var HIDE_ENLIL_SCHEME = 'false';
  var enlilScheme;
  var enlilWidth = 5;
  var enlilOpacity = 0.6;

  // the Geospace overlay display scheme (true or undefined)
  var GEOSPACE_SCHEME_COOKIE = 'geospacescheme';
  var SHOW_GEOSPACE_SCHEME = 'true';
  var HIDE_GEOSPACE_SCHEME = 'false';
  var geospaceScheme;
  var geospaceWidth = 5;
  var geospaceOpacity = 0.6;

  // the flag strip display scheme (true or undefined)
  var FLAG_SCHEME_COOKIE = 'flagscheme';
  var SHOW_FLAG_SCHEME = 'true';
  var HIDE_FLAG_SCHEME = 'false';
  var flagScheme;

  // the configuration of which source spacecraft is being shown
  var SOURCE_SCHEME_COOKIE = 'sourcescheme';
  var ACE_SCHEME = '0';
  var DSCOVR_SCHEME = '1';
  var ACTIVE_SCHEME = '2';
  var sourceScheme = ACTIVE_SCHEME;

  // the configuration of which series are being shown
  var SERIES_SCHEME_COOKIE = 'seriesscheme';
  var MAG_SCHEME = '0';
  var SOLAR_WIND_SCHEME = '1';
  var BOTH_SCHEME = '2';
  var seriesScheme = BOTH_SCHEME;

  // graph array indices
  var BT_BX_BY_GRAPH = 0;
  var BZ_GRAPH = 1;
  var THETA_GRAPH = 2;
  var BT_BZ_GRAPH = 3;
  var PHI_GRAPH = 4;
  var DENS_GRAPH = 5;
  var SPEED_GRAPH = 6;
  var TEMP_GRAPH = 7;
//    var SPEED_VX_GRAPH = 7;
//    var VY_VZ_GRAPH = 8;
//    var TEMP_GRAPH = 9;
//    var NUM_PLOTS = 10;
  var KPAP_GRAPH = 8;

  // an array of of arrays. Each array in the list is a list of plot id numbers for the given series scheme
  var PLOT_LISTS = [
    [BT_BX_BY_GRAPH, BZ_GRAPH, THETA_GRAPH, PHI_GRAPH],
    [DENS_GRAPH, SPEED_GRAPH, TEMP_GRAPH],
    [BT_BZ_GRAPH, PHI_GRAPH, DENS_GRAPH, SPEED_GRAPH, TEMP_GRAPH]
  ];
//    [5, 6, 7],
//        [3, 4, 5, 6, 7]
//};

  // user-supplied Y-axis scale values for each plot
  var yAxisMin = [];
  var yAxisMax = [];
  // maps to the first select menu option in the Series dialog
  var previousYAxisIndex = BT_BZ_GRAPH;
  // track if the user entered values
  var yAxisChanged;

  // the data set (mag or plasma) that drives each plot
  var USE_MAG = 0;
  var USE_PLASMA = 1;
  var USE_KPAP = 2;
  var DATA_SET = [USE_MAG, USE_MAG, USE_MAG, USE_MAG, USE_MAG, USE_PLASMA, USE_PLASMA, USE_PLASMA, USE_KPAP];

  // the hover readout number formatting style (# of digits of precision) for each plot (BZ_GRAPH, TEMP_GRAPH, etc.)
  var READOUT_FORMAT = [formatValue_1f, formatValue_1f, formatValue_1f, formatValue_0f, formatValue_0f, formatValue_2f, formatValue_0f, formatValue_2e, formatValue_0f];

  // the individual data series
  var BT_SERIES = 0;
  var BX_SERIES = 1;
  var BY_SERIES = 2;
  var BZ_SERIES = 3;
  var THETA_SERIES = 4;
  var PHI_SERIES = 5;
  var DENS_SERIES = 6;
  var SPEED_SERIES = 7;
  var TEMP_SERIES = 8;
  var KP_SERIES = 9;
  var AP_SERIES = 10;
//  var VX_SERIES = 9;
//  var VY_SERIES = 10;
//  var VZ_SERIES = 11;

  // the series names in the JSON file, used as the series child object names
  var SERIES_NAMES = ['bt', 'bx_gsm', 'by_gsm', 'bz_gsm', 'lat_gsm', 'lon_gsm', 'density', 'speed', 'temperature', 'kp', 'ap', 'vx_gsm', 'vy_gsm', 'vz_gsm'];

  // the data set (mag or plasma) that drives each series (used only for saving data to text file)
  var DATA_SET_SERIES = [USE_MAG, USE_MAG, USE_MAG, USE_MAG, USE_MAG, USE_MAG, USE_PLASMA, USE_PLASMA, USE_PLASMA,
    USE_KPAP, USE_KPAP,
    USE_PLASMA, USE_PLASMA, USE_PLASMA];

  // the save as text formatting style (# of digits of precision, field width) for each series
  var TEXT_FORMAT_SERIES = [2, 2, 2, 2, 2, 2, 2, 2, 0, 0, 0, 2, 2, 2];
  var TEXT_WIDTH = 9;

  // map the series to the plots
  var SERIES_LISTS = [
    [BT_SERIES, BX_SERIES, BY_SERIES],
    [BZ_SERIES],
    [THETA_SERIES],
    [BT_SERIES, BZ_SERIES, BX_SERIES, BY_SERIES],
    [PHI_SERIES],
    [DENS_SERIES],
    [SPEED_SERIES],
    [TEMP_SERIES],
    [KP_SERIES, AP_SERIES]
//    [SPEED_SERIES, VX_SERIES],
//    [VY_SERIES, VZ_SERIES]
  ];

  // keep track of whether each series is toggled on or off, since rebuilding happens often
  // for now, Bx and By are toggled off at startup
  var SERIES_VISIBLE = [
    [true, true, true],
    [true],
    [true],
    [true, true, false, false],
    [true],
    [true],
    [true],
    [true],
    [true, true]
  ];

  // map the series legends to the plots. Note that the same series may have a different legend on a different plot.
  // use \u00A0 to force a leading or trailing space character to make strikethrough visible, normal spaces are automatically trimmed
  var SERIES_LEGENDS = [
    ['\u00A0Bt\u00A0', '\u00A0Bx\u00A0', 'By GSM (nT)'],
    ['Bz GSM (nT)'],
    ['Theta GSM (deg)'],
    ['\u00A0Bt\u00A0', 'Bz GSM (nT)', '\u00A0Bx\u00A0', '\u00A0By\u00A0'],
    ['Phi GSM (deg)'],
    ['Density (1/cm\u00B3)'],
    ['Speed (km/s)'],
    ['Temperature (\u00B0K)'],
    ['Kp', 'Ap']
//    ['Speed ', 'Vx (km/s)'],
//    ['Vy ', 'Vz (km/s)']
  ];

  // SWFO wants slightly different legends
  // use \u00A0 to force a leading or trailing space character to make strikethrough visible, normal spaces are automatically trimmed
  var SERIES_LEGENDS_SWFO = [
    ['\u00A0Bt\u00A0', '\u00A0Bx\u00A0', 'By (gsm)'],
    ['Bz (gsm)'],
    ['Theta (gsm)'],
    ['\u00A0Bt\u00A0', 'Bz (gsm)', '\u00A0Bx\u00A0', '\u00A0By\u00A0'],
    ['Phi (gsm)'],
    ['Density (1/cm\u00B3)'],
    ['Speed (km/s)'],
    ['Temperature (\u00B0K)'],
    ['Kp', 'Ap']
    //    ['Speed ', 'Vx (km/s)'],
//    ['Vy ', 'Vz (km/s)']
  ];

  // the color of each series in each plot. Note that the same series may have a different color on a different plots
  // colors are for the default white background, getColors() will take care of changing them if the background changes
  var SERIES_COLORS = [
    [RED, BLUE, BLACK],
    [PURPLE],
    [ORANGE],
    [BLACK, RED, PURPLE, BLUE],
    [BLUE],
    [ORANGE],
    [PURPLE],
    [GREEN],
    [GREEN, BLACK]
    // the last two are TBD
//    [PURPLE, BLUE],
//    [GREEN, RED]
  ];

  // planetary K-index color scale (0-9)
  var KP_COLORS = [
    '#65fa00',
    '#65fa00',
    '#65fa00',
    '#06be59',
    '#f0e124',
    '#fe6d50',
    '#fe4722',
    '#d92501',
    '#9d1b01',
    '#731401'
  ];

  // the dimensions of each plot based on the current series scheme
  var boxDimensions = [];

  // the yScale of each plot based on the current series scheme
  var yScales = [];

  // they y-axis values where plot grid lines should be drawn
  var yGridlines = [];

  // the left and right y axes for the visible plots
  var yAxisLeft = [];
  var yAxisRight = [];

  // the d3 series selector
  var seriesD3 = [];

  // Y-axis constants
  // the number of distinct intervals on the Y-axis,keep from crowding too close together
  var MIN_Y_INTERVALS = 4;
  var MAX_Y_INTERVALS = 6;
  var MIN_B_INTERVAL = 5;
  var MIN_SPEED_INTERVAL = 50;
  var MIN_DENS_INTERVAL = 10;
  var DENS_THRESHOLD = 50;

  // the minimum separation interval for each plot
  var MIN_INTERVALS = [MIN_B_INTERVAL, MIN_B_INTERVAL, 90 , MIN_B_INTERVAL, 10, MIN_DENS_INTERVAL, MIN_SPEED_INTERVAL, 0, 1];

  // the zoom start/end x coordinates in pixels relative to the left of the normal plot
  var zoomStartPixel;
  var zoomEndPixel;

  // the zoomed plot start/end times in Moment (UTC). Note that the zoomed data may be a larger span than what is visible
  var zoomStartMoment;
  var zoomEndMoment;
  var panZoomStartMoment;

  // the start/end time of the loaded Phase II data file, whether it has non-null data or not
  var dataStartMoment;
  var dataEndMoment;

  // the last tapped time coordinate in Moment (UTC)
  var tappedDataposXMoment;

  // are touch events supported?
  var isTouchSupported = false;

  // is the screen relatively small?
  var isSmallScreen = false;

  // true if the zoom plots are currently visible
  var isZoomed = false;

  // true if the mouse button is currently down
  var isButtonDown = false;

  var dataServiceUrl;

  // the start time of the app
  var appStartMoment = moment.utc();

  // the time of the last successful query response
  var lastSuccess = moment.utc();

  // the font size of the zoom box date labels. Should be controlled by CSS, but isn't!
  var dateTickLabelFontSize;

  // TODO adjust based on screen size
  var apLabelFontSize = 10;

  // JSON file prefixes and suffixes
  var MAG_PREFIX = "mag-";
  var PLASMA_PREFIX = "plasma-";
  var KP_PREFIX = 'kp-';
  var PHASE_I_FINAL_EXTENSION = ".i.json";
  var PHASE_II_FINAL_EXTENSION = ".json";
  var FIVE_MINUTE_SUFFIX = "-5-minute";

  var MINUTES_PER_DAY = 1440;
  var MINUTES_PER_YEAR = MINUTES_PER_DAY * 365;
  var SECONDS_PER_YEAR = MINUTES_PER_YEAR * 60;
//  var HOURS_PER_YEAR = MINUTES_PER_YEAR / 60;
//  var MILLIS_PER_MINUTE = 60 * 1000;

  // boxcar averaging resolutions in seconds
  var ONE_SECOND = 1;
  // this is the only place where the FC high resolution is defined
  var THREE_SECOND = 20;
  var ONE_MINUTE = 60;
//  var TWO_MINUTES = 2 * ONE_MINUTE;
  var THREE_MINUTES = 3 * ONE_MINUTE;
  var FIVE_MINUTES = 5 * ONE_MINUTE;
//  var FIFTEEN_MINUTES = 15 * ONE_MINUTE;
  var THIRTY_MINUTES = 30 * ONE_MINUTE;
  var ONE_HOUR = 60 * ONE_MINUTE;
  var NINETY_MINUTES = 90 * ONE_MINUTE;
  var THREE_HOURS = 3 * ONE_HOUR;
  var SIX_HOURS = 6 * ONE_HOUR;
//  var TWELVE_HOURS = 12 * ONE_HOUR;
  var ONE_DAY = 24 * ONE_HOUR;
  var TWO_DAYS = 2 * ONE_DAY;
  var FIVE_DAYS = 5 * ONE_DAY;
  var SEVEN_DAYS = 7 * ONE_DAY;
  var THIRTY_DAYS = 30 * ONE_DAY;
  var NINETY_DAYS = 90 * ONE_DAY;
  var ONE_HUNDRED_EIGHTY_DAYS = 180 * ONE_DAY;

  // ACE data started in Feb 1998, so we'll start from the beginning of that year
  // only months are zero-based :(
  var MISSION_START = moment.utc({year: 1998, month: 0, day: 1});
//  log("MISSION_START " + MISSION_START.format());

  // DSCOVR Mag data started Jun 29 2015, so we'll start the high-res files from the beginning of that day
  // IMPORTANT: only months are zero-based!!!
  // start of DSCOVR operations 7/27/16
  var DSCOVR_START = moment.utc({year: 2016, month: 6, day: 27});
//  log("DSCOVR_START " + DSCOVR_START.format());

  // Planetary Kp-Ap data starts from Sep 1 2013
  var KPAP_START = moment.utc({year: 1998, month: 0, day: 1});

  // the number of years in the overall combined RTSW mission (used for Phase I only)
  var MISSION_YEARS = 30;

// human-readable file type of each file
  var files = ["2-hour", "6-hour", "1-day", "3-day", "7-day", "30-day", "54-day", "1-year", "5-year", "30-year"];

  // time span of each file in minutes
  var timespans = [120, 360, 1440, 3 * 1440, 7 * 1440, 30 * 1440, 54 * 1440, 365 * 1440, 5 * 365 * 1440, MISSION_YEARS * 365 * 1440];

  // sample resolution of each file in seconds
  var resolutions = [ONE_SECOND, ONE_MINUTE, ONE_MINUTE, THREE_MINUTES, FIVE_MINUTES, THIRTY_MINUTES, ONE_HOUR, SIX_HOURS, ONE_DAY, FIVE_DAYS];
  var highResText = ["1 sec", "20 sec"];
  var resolutionText = ["highres", "1 min", "1 min", "3 min", "5 min", "30 min", "1 hr", "6 hr", "1 day", "5 day"];

  // Kp-Ap resolutions are different from PlasMag
  var kpApResolutions = [THREE_HOURS, THREE_HOURS, THREE_HOURS, THREE_HOURS, THREE_HOURS, THREE_HOURS, THREE_HOURS, SIX_HOURS, ONE_DAY, FIVE_DAYS];

  // the index into the file descriptor arrays for the current timespan selection
  var currentIndex;

  // the index into the file descriptor arrays matching the zoomed timespan
  var zoomIndex;

  var saveFirstDataMoment;
  var saveLastDataMoment;

  // save the start/end time of the zoom plot for use in drilling down
  var saveZoomStartMoment;
  var saveZoomEndMoment;

  // save the start pixel of the zoom plot for use in cancelling a pending zoom
  var saveZoomStartPixel;

  // true if the user is zooming an already zoomed plot, false otherwise
  var drilldown = false;

  // the minimum number of possible samples to display when zooming
//  var MINIMUM_SAMPLES = 50;

  var SPACE = " ";

  // the minimum number of visible points needed for just-fetched data to be worth drawing; must be at least 2 to draw a line!
//  var MIN_VISIBLE_POINTS = 5;

  // timestamp string formats
  var DATE_FORMAT_FILE = "YYYY-MM-DD HH:mm:ss";
  var DATE_FORMAT_DISPLAY = "YYYY-MM-DD HH:mm:ss";
  var DATE_FORMAT_FILENAME = "YYYY-MM-DDTHH:mm:ss";
  var DATE_FORMAT_STATS = "MM-DD HH:mm";

  // the height of the data presence bar in the zoom box
  var DATA_PRESENCE_LINE_WIDTH = 2;

  // the different types of date ticks
  var PLOT_DATE_TICKS = 1;
  var ZOOM_DATE_TICKS = 2;
  var TIMESPAN_DATE_TICKS = 3;
  var TICK_SIZE = 4;

  // constants
  var FORCE_ZERO = true;
  var DO_NOT_FORCE_ZERO = false;

  // the force-zero selection for each plot
  var FORCE_ZEROES = [FORCE_ZERO, FORCE_ZERO, 0, FORCE_ZERO, 0, 0, DO_NOT_FORCE_ZERO, 0, 0];

  // maintain the running state of which spacecraft are represented by the visible (zoomed!) data
  var visibleSource;

  // the source codes need to be in sync with those defined in AbstractJsonFileGenerator
  var SOURCE_ACE = 0;
  var SOURCE_DSCOVR = 1;
  var SOURCE_MULTIPLE = 2;
  var sourceSpacecraft = ['ACE', 'DSCOVR', 'ACE+DSCOVR'];

  // SWFO stat strings
  var minBt = new Array(2);
  var maxBt = new Array(2);
  var minBz = new Array(2);
  var maxBz = new Array(2);
  var minSpeed = new Array(2);
  var meanSpeed = new Array(2);
  var maxSpeed = new Array(2);
  var periodStart = new Array(2);

  // adjust the phi angle from 0-360 to 45-405 only for plotting
  var PHI_ADJUST = 45;

  // flag to identify if this is the first data load, used to build the plots after the load completes
  var isFirstDataLoad = true;


// ***********************************************************************************************************
//  initialization
// ***********************************************************************************************************

  /**
   * Startup.
   */
  $(document).ready(function () {

//    var model = DataModel();
//    model.doRead(5);
//    model.doWrite(134);
//    log("count " + model.count);
//
//    var car = new Car();
//    car.doGo();
//    car.doStop();
//    log("wheels " + car.numWheels);
//
//    var container = new Container(123);
//    container.stamp('jeff');
//    log("service " + container.service());

    // the state of affairs is pretty sad when it comes to detecting whether touch events are supported by the browser. There is no standard
    // mechanism. Many browser, such as Chrome on my development desktop, support the touch API even though my hardware does not. So, simply detecting the
    // availability of the API is not sufficient. Unlike many pages, touch events are designed to behave differently from mouse events, so simply
    // mapping tap = click, mousemove = swipe, etc. is not sufficient. The following sets a global flag once the first touch occurs.
    // More info at http://www.stucox.com/blog/you-cant-detect-a-touchscreen
    window.addEventListener('touchstart', function setHasTouch() {
      isTouchSupported = true;
      window.removeEventListener('touchstart', setHasTouch);
      log('device has touch support');
    }, false);

    // ************ ADD for WOC - begin ************
    // // USE THIS ON DRUPAL STAGING - START
    // // TODO Drupal creates the wrong meta viewport tag, found some code online to override
    //     $('button').on('click', function() {
    //         // Just replacing the value of the 'content' attribute will not work.
    //         $('meta[name=description]').remove();
    //         $('head').append( '<meta name="description" content="this is new">' );
    //     });
    //     if (screen.width <= 480) {
    //       var viewports = document.getElementsByName("viewport");
    //       if (viewports !== null) {
    //         viewports[0].setAttribute("content", "width=480, initial-scale=0.5");
    //       }
    //     }
    //
    // // info only <div id="dataservice_url3" style="display: none;">http://services.swpc.noaa.gov/experimental/text/rtsw/data</div>
    // // info only <div id="dataservice_url3" style="display: none;">http://web-st-01/services_push/text/rtsw/data</div>
    // dataServiceUrl = $('#dataservice_url3').text() + $('#dataservice_rtsw').text();
    // ************ ADD for WOC - end ************

    // ************ REMOVE for WOC - begin ************
    // overwrite since there is no such DOM element outside of drupal
    dataServiceUrl = DTS_DATA_SERVICE_URL;
    // ************ REMOVE for WOC - end ************

    // read cookies to set UI defaults and load the data
    // need to set the endMoment before creating the plots
    readCookies();

    // turn on series based on URL parameters
    turnOnSeriesBasedOnUrl();

    // bind the mouse event handlers - this should happen after we readCookies to avoid double calls
    bindEvents();

    // send asynchronous query for new data every 1-minute and update plots if necessary
    window.setInterval(updateSeries, UPDATE_RATE_SEC * ONE_SECOND_MS + ONE_SECOND_MS);

//    var myLoader = loader({width: 960, height: 500, container: "#loading_div", id: "loader"});
//    myLoader();
  });

  /**
   * Determine if this page should show features being tested.
   * @returns {boolean}
   */
  function isTest() {
    return (getQueryVariable('user') === 'test');
  }

  /**
   * Determine if this page should be laid out as SWFO prefers.
   * @returns {boolean}
   */
  function isSwfo() {
    return (getQueryVariable('user') === 'swfo');
  }

  /**
   * Get the timespan as passed in the URL, default to 1 day if not present.
   * @returns {string} - the timespan in hours
   */
  function getTimespanParameter() {
    // set default
    var span = '24';

    // get the user parameter from the URL
    var tempSpan = getQueryVariable('span');

    // was the parameter specified?
    if (tempSpan) {

      // accept an arbitrary number of hours, then convert to the next higher span if necessary
      var spanNumber = parseInt(tempSpan);
      if (!isNaN(spanNumber)) {
        for (var i = 0; i < timespans.length; i++) {
          var hours = timespans[i] / 60;
          if (spanNumber <= hours) {
            span = hours.toString();

            // found it, fall out
            break;
          }
        }
      }
    }

    return span;
  }

  /**
   * Return the value of a variable in the URL string.
   * For example, the variable 'param' would return 'something' for the URL http://host:8080/rtsw/graph?param=something.
   * @param variable
   * @returns {*}
   */
  function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split("=");
      if (pair[0] == variable) {
        return pair[1];
      }
    }
    return false;
  }

  /**
   * Read in cookies used to define UI defaults.
   */
  function readCookies() {
    // reset the cookies?
    if (getQueryVariable('reset') === 'true') {
      log("resetting cookies");
      var cookies = document.cookie.split(';');
      log("cookies to reset <" + cookies + ">");
      for (var cookie of cookies) {
        log("removing cookie <" + cookie.split("=")[0].trim() + ">");
        $.removeCookie(cookie.split("=")[0].trim());
      }
    }

    // read the user-selectable option cookies
    readColorSchemeCookie();
    readRenderSchemeCookie();
    readYLabelSchemeCookie();
    readFlagSchemeCookie();
    readSourceSchemeCookie();
    readSeriesSchemeCookie();
    readRecurrenceSchemeCookie();
    readKpApSchemeCookie();
    readEnlilSchemeCookie();
    readGeospaceSchemeCookie();

    // read the time span last, as it causes the plots to be drawn
    readTimeSpanCookie();
  }

  /**
   * Read in the color scheme cookie and update if necessary.
   */
  function readColorSchemeCookie() {
    // use the user-selected color scheme
    var scheme = jQuery.cookie(COLOR_SCHEME_COOKIE);
    if (scheme != undefined && (scheme === WHITE_SCHEME || scheme === BLACK_SCHEME)) {
      colorScheme = scheme;
    } else {
      // default to white background
      colorScheme = WHITE_SCHEME;
    }

    // SWFO display is always black
    if (isSwfo()) {
      colorScheme = BLACK_SCHEME;
    }

    // make sure the correct color scheme CSS file is in use
    setColorSchemeCSS();

    // set the radio button state
    var id = '#radio_' + colorScheme.toLowerCase();
    $(id).prop('checked', true);
  }

  /**
   * Read in the render scheme cookie and update if necessary.
   */
  function readRenderSchemeCookie() {
    // use the user-selected render scheme
    var scheme = jQuery.cookie(RENDER_SCHEME_COOKIE);
    if (scheme != undefined && (scheme === MARKER_SCHEME || scheme === LINE_SCHEME || scheme === HYBRID_SCHEME)) {
      renderScheme = scheme;
    } else {
      // default to marker render
      renderScheme = MARKER_SCHEME;
    }

    // check for any URL parameter explicit overrides
    var override = getQueryVariable('render');
    if (override === 'marker') {
      renderScheme = MARKER_SCHEME;
    } else if (override === 'line') {
      renderScheme = LINE_SCHEME;
    } else if (override === 'hybrid') {
      renderScheme = HYBRID_SCHEME;
    }

    // set the dialog radio button state
    var id = '#radio_' + renderScheme.toLowerCase();
    $(id).prop('checked', true);
  }

  /**
   * Read in the Y-axis label position scheme cookie and update if necessary.
   */
  function readYLabelSchemeCookie() {
    // use the user-selected label position scheme
    var scheme = jQuery.cookie(Y_LABEL_SCHEME_COOKIE);
    if (scheme != undefined && (scheme === Y_LEFT_SCHEME || scheme === Y_ALTERNATING_SCHEME)) {
      yLabelScheme = scheme;
    } else {
      // default to left scheme
      yLabelScheme = Y_LEFT_SCHEME;
    }

    // SWFO display is always left
    if (isSwfo()) {
      yLabelScheme = Y_LEFT_SCHEME;
    }

    // set the dialog radio button state
    var id = '#radio_' + yLabelScheme.toLowerCase();
    $(id).prop('checked', true);
  }

  /**
   * Read in the flag strip display scheme cookie and update if necessary.
   */
  function readFlagSchemeCookie() {
    // use the user-selected tile scheme
    var scheme = jQuery.cookie(FLAG_SCHEME_COOKIE);
    if (scheme !== undefined && scheme !== null) {
      flagScheme = scheme;
    } else {
      // default to showing flag strips
      flagScheme = 'true';
    }

    // SWFO display flag strips are always shown
    if (isSwfo()) {
      flagScheme = 'true';
    }

    // set the checkbox state
    $('#checkbox_flag').prop('checked', (flagScheme === 'true'));
  }

  /**
   * Read in the Recurrence display scheme cookie and update if necessary.
   */
    //TODO refactor these into a single method with the COOKIE and scheme as parameters
  function readRecurrenceSchemeCookie() {
    // use the user-selected scheme
    var scheme = jQuery.cookie(RECURRENCE_SCHEME_COOKIE);
    if (scheme !== undefined && scheme !== null) {
      recurrenceScheme = scheme;
    } else {
      // default to not showing the recurrence data
      recurrenceScheme = 'false';
    }

    // check for an explicit URL override
    var override = getQueryVariable('recurrence');
    if (override === 'true' || override === 'false') {
      recurrenceScheme = override;
    }

    // set the checkbox state
    $('#checkbox_recurrence').prop('checked', (recurrenceScheme === 'true'));
  }

  /**
   * Read in the KpAp overlay display scheme cookie and update if necessary.
   */
  function readKpApSchemeCookie() {
    // use the user-selected scheme
    var scheme = jQuery.cookie(KPAP_SCHEME_COOKIE);
    if (scheme !== undefined && scheme !== null) {
      kpApScheme = scheme;
    } else {
      // default to not showing the KpAp plot
      kpApScheme = 'false';
    }

    // check for an explicit URL override
    var override = getQueryVariable('kpap');
    if (override === 'true' || override === 'false') {
      kpApScheme = override;
    }

    // on startup, enable additional non-PlasMag plots as necessary
    if (kpApScheme === 'true') {
      enableKpAp();
    }

    // set the checkbox state
    $('#checkbox_kpap').prop('checked', (kpApScheme === 'true'));

    changeKpApScheme(kpApScheme);
  }

  /**
   * Read in the Enlil overlay display scheme cookie and update if necessary.
   */
  function readEnlilSchemeCookie() {
    // use the user-selected scheme
    var scheme = jQuery.cookie(ENLIL_SCHEME_COOKIE);
    if (scheme !== undefined && scheme !== null) {
      enlilScheme = scheme;
    } else {
      // default to not showing the overlay
      enlilScheme = 'false';
    }

    // set the checkbox state
    $('#checkbox_enlil').prop('checked', (enlilScheme === 'true'));
  }

  /**
   * Read in the Geospace overlay display scheme cookie and update if necessary.
   */
  function readGeospaceSchemeCookie() {
    // use the user-selected scheme
    var scheme = jQuery.cookie(GEOSPACE_SCHEME_COOKIE);
    if (scheme !== undefined && scheme !== null) {
      geospaceScheme = scheme;
    } else {
      // default to not showing the overlay
      geospaceScheme = 'false';
    }

    // set the checkbox state
    $('#checkbox_geospace').prop('checked', (geospaceScheme === 'true'));
  }

  /**
   * Read in the source scheme cookie and update if necessary.
   */
  function readSourceSchemeCookie() {
    // use the user-selected source scheme
    var scheme = jQuery.cookie(SOURCE_SCHEME_COOKIE);

    // if scheme cookie is undefined or not a valid value, default to ACTIVE
    if (scheme === undefined || (scheme !== ACTIVE_SCHEME && scheme !== ACE_SCHEME && scheme !== DSCOVR_SCHEME)) {
      // default to active source
      scheme = ACTIVE_SCHEME;
    }

    // SWFO display is always Active spacecraft (either DSCOVR or ACE)
    if (isSwfo()) {
      scheme = ACTIVE_SCHEME;
    }
    // check for any URL parameter explicit overrides
    var override = getQueryVariable('source');
    if (override === 'ace' || override === 'ACE') {
      scheme = ACE_SCHEME;
    } else if (override === 'dscovr' || override === 'DSCOVR') {
      scheme = DSCOVR_SCHEME;
    } else if (override === 'active' || override === 'ACTIVE' || override === 'Active') {
      scheme = ACTIVE_SCHEME;
    }

    // set the dialog radio button state
    var id = '#radio_source_' + scheme;
    $(id).prop('checked', true);

    changeSourceHandler(scheme);
  }

  /**
   * Read in the series scheme cookie and update if necessary.
   */
  function readSeriesSchemeCookie() {
    // use the user-selected series scheme
    var scheme = jQuery.cookie(SERIES_SCHEME_COOKIE);

    // if scheme cookie is undefined or not a valid value, default to BOTH
    if (scheme === undefined || (scheme !== MAG_SCHEME && scheme !== SOLAR_WIND_SCHEME && scheme !== BOTH_SCHEME)) {
      // default to both series
      scheme = BOTH_SCHEME;
    }

    // SWFO display is always both mag and wind
    if (isSwfo()) {
      scheme = BOTH_SCHEME;
    }

    // set the dialog radio button state
    var id = '#radio_series_' + scheme;
    $(id).prop('checked', true);

    changeSeriesHandler(scheme);
  }

  /**
   * Read in the time span cookie and update if necessary.
   */
  function readTimeSpanCookie() {
    // read the timespan cookie string
    var sp = jQuery.cookie(TIMESPAN_COOKIE);

    // if no cookie, use default time span
    if (sp == undefined) {
      sp = '24';
    }

    // override if the timespan parameter is present, e.g., span=24
    if (getQueryVariable('span')) {
      sp = getTimespanParameter();
    }

    // set the desired span in the select menu and refresh the button
    var timespan = $('#timespan');
    timespan.selectmenu();
    timespan.val(sp);
    timespan.selectmenu('refresh');

    changeSpanHandler(sp);
  }

  /**
   * Modify the plots based on any URL parameters which don't have related cookies.
   */
  function turnOnSeriesBasedOnUrl() {
    // turn the Bz series off (defaults to on)
    if (getQueryVariable('bz') === 'false') {
      SERIES_VISIBLE[BT_BZ_GRAPH][1] = false;
    }

    // turn the Bx series on (defaults to off)
    if (getQueryVariable('bx') === 'true') {
      SERIES_VISIBLE[BT_BZ_GRAPH][2] = true;
    }

    // turn the By series on (defaults to off)
    if (getQueryVariable('by') === 'true') {
      SERIES_VISIBLE[BT_BZ_GRAPH][3] = true;
    }
  }

  /**
   * (d3-specific) perform any required plot library initialization.
   */
  function plotInit() {
    margin_right = (yLabelScheme === Y_LEFT_SCHEME) ? 20 : 32;
    plt_gap = (yLabelScheme === Y_LEFT_SCHEME) ? 11 : 0;

    // create the d3 plot container and initialize the size and scaling parameters
    d3.select("#main_div").selectAll("svg").remove();

    // get the overall page size based on the current window size
    full_width = getCssWidth('#main_div');
    full_height = getCssHeight('#main_div');
    var ADJUST = 5;
    full_height -= ADJUST;
//    log("plotInit: innerHeight " + window.innerHeight + " main_div height " + getCssHeight('#main_div') + " svg full height " + full_height);

    // compute the size of each plot given the overall page size
    plt_width = full_width - margin_left - margin_right;

    // subtract
    guide_plt_height = getFlagHeight() + 2 + 11 + 2 + ZOOM_HEIGHT + 2 + 11;

    // how many plots are currently visible?
    var plotCount = getCurrentPlotList().length;

    // not sure why I need to subtract the extra 5 to make this look right...
    plt_height = (full_height - margin_top - ((plotCount - 1) * plt_gap) - guide_plt_height - margin_bottom - 5) / plotCount;

    // start fresh
    // offset by half a pixel to handle rendering of gridline strokewidth < 1
    main_graphic = d3.select("#main_div").append("svg")
        .attr("width", full_width)
        .attr("height", full_height)
        .append("g")
        .attr("transform", "translate(" + (margin_left + 0.5) + "," + 0.5 + ")");
//        .attr("transform", "translate(" + (margin_left) + "," + 0 + ")");

    // create a container for the clip path definitions
    var defs = main_graphic.append("defs");

    // load up new box dimensions for each visible plot
    // y0 is lower on the page, but a larger number since the origin is at the top-left
    boxDimensions = [];
    var y0 = plt_height + margin_top;
    var y1 = margin_top;
    var y;
    var i;
    for (i = 0; i < plotCount; i++) {
      // define the plot pixel outlines (y0 is lower on the screen, but the origin is at the top so it's a larger value)
      boxDimensions.push({x0: margin_left, x1: plt_width + margin_left, y0: y0, y1: y1 });

      // define a clip rectangle for this plot box, since when zoomed, the data would otherwise draw out past on the left and right
      defs.append("clipPath")
          .attr("id", "plot_clip_" + i)
          .append("rect")
          .attr("x", 0)
          .attr("y", boxDimensions[i].y1)
          .attr("width", plt_width)
          .attr("height", plt_height);

      y = y0;
      y0 = y + plt_gap + plt_height;
      y1 = y + plt_gap;
    }

    // identify the bounding rectangle for the items below the lowest plot
    y1 -= plt_gap;
    y0 = y1 + guide_plt_height;

    box_guide = {x0: margin_left, x1: plt_width + margin_left, y0: y0, y1: y1};

    // create two empty date axes scaled to the given pixel width
    x_scale = d3.time.scale.utc().range([0, plt_width]);
    x_scale_timespan = d3.time.scale.utc().range([0, plt_width]);

    // set the x_scale domains to the current timespan
    updateXScaleDomains();

    // define an overall clip rectangle at the plot box left/right edges, since when zoomed, the data would otherwise draw out past on the left and right
    // offset by 1 to exclude the borders
    defs.append("clipPath")
        .attr("id", "plot_clip")
        .append("rect")
        .attr("x", 1)
        .attr("width", plt_width - 1)
        .attr("height", full_height);

    // create a page background rectangle so that it can be changed to red to show a data outage
    main_graphic.append("rect")
        .attr("class", "page_background")
        .attr("x", -margin_left)
        .attr("width", full_width)
        .attr("height", full_height)
        .attr("fill", getBackgroundColor());
  }

  /**
   * (d3-specific) Update the x (date) scale domains. Changing the x_scale domain causes zooming to occur since the data is bound to the scale.
   * Call after the x_scales are created, and after either the start/endMoment changes or a zoom occurs.
   */
  function updateXScaleDomains() {
    if (isZoomed) {
      // only set the zoomable scale, since the overall timespan should be retained across resizes, series changes, etc.
      x_scale.domain([zoomStartMoment.toDate(), zoomEndMoment.toDate()]);
    } else {
      // define both time domains to initially be the full timespan
      x_scale.domain([startMoment.toDate(), endMoment.toDate()]);
    }

    // the overall timespan scale is the same whether zoomed or not
    x_scale_timespan.domain([startMoment.toDate(), endMoment.toDate()]);
  }

  /**
   *  Bind JQuery and jqplot event handlers to functions.
   */
  function bindEvents() {
//    var plotNum;
//    var plot;

    // on small screens, track events on the container rather than each plot
    if (isSmallScreen) {
      bindTouchEvents($('#main_div'));
    }

//    // for each data plot, whether initially visible or not
//    for (plotNum = 0; plotNum < NUM_PLOTS; plotNum++) {
//
//      // get the selectors once
//      plot = $('#chart' + plotNum);
//
//      // on large screens, track events on the each plot
//      if (!isSmallScreen) {
//        bindTouchEvents(plot);
//      }
//
//      // bind user pointer events on the plots
////      bindMouseEvents(plot);
//    }

    // handle the time span pop-up menu
    $('#timespan').selectmenu({
      // the width can't be set via CSS
      width: '20%',
      // the menu should appear directly above the button
      position: {
        my: 'left bottom',
        at: 'left top',
        of: '#button_container1'
      },
      change: function (event, ui) {
        changeSpanHandler(ui.item.value);
      }
    });

    // handle the Series button
    $('#series_dialog_button').click(function () {
      displaySeriesDialog();
    });

    // handle the Save as Text button
    $('#save_button').click(function () {
      saveDataToFile();
    });

    // handle the Save Image button
    $('#save_image_button').click(function () {
      saveDataToImage();
    });

    // handle the Options button
    $('#option_dialog_button').click(function () {
      displayOptionsDialog();
    });

    // To allow resizing we must replot on window resize
    $(window).resize(function () {
      resizeHandler();
    });
  }

  /**
   * Bind user touch events (doubletap, pan, pinch) to a single plot.
   * @param {Object} plot - an individual jqplot
   */
  function bindTouchEvents(plot) {
    try {
      // listen only for Touch events, mouse events are handled separately. If this isn't declared, then mousemove will fire the panmove event, etc

      var hammerTime = new Hammer(plot[0], { touchAction: 'pan-y', inputClass: Hammer.TouchInput });
      hammerTime.get('pinch').set({ enable: true });
      hammerTime.get('pan').set({ direction: Hammer.DIRECTION_HORIZONTAL});

      hammerTime.on("doubletap", function (e) {

        // keep the tap from bubbling up to other elements
        e.preventDefault();

        feedback('resetting');

        // reset the zoom on double-tap, just like it is on double-click
        zoomReset(null, false);

        feedback('');
      });
      hammerTime.on("panstart", function (e) {

        // keep the pan from bubbling up to other elements
        e.preventDefault();

        if (isZoomed) {
          // save the original zoomStartMoment time
          panZoomStartMoment = moment.utc(zoomStartMoment);
        }
        feedback('panning');
      });
      hammerTime.on("panmove", function (e) {

        // keep the pan from bubbling up to other elements
        e.preventDefault();

        if (isZoomed) {
          // change the zoom start and end times only
          panMove(e.deltaX);
        }
      });
      hammerTime.on("panend pancancel", function (e) {
        // pinchend and pinchcancel seem to be interchangeable, it delivers either one or the other

        // keep the pinch from bubbling up to other elements
        e.preventDefault();

        // is a redraw required?
        if (isZoomed && !zoomStartMoment.isSame(panZoomStartMoment, 'minute')) {
          timerStart();
          updateZoom();
        }

        panZoomStartMoment = undefined;
        feedback('');
      });
      hammerTime.on("pinchstart pinchmove", function (e) {

        // keep the pinch from bubbling up to other elements (stopPropagation breaks it)
        e.preventDefault();

        feedback('zooming');

        // just update the zoom box while the user's fingers are moving
        pinchMove(e.scale);
      });
      hammerTime.on("pinchend pinchcancel", function (e) {

        // keep the pinch from bubbling up to other elements (stopPropagation breaks it)
        e.preventDefault();

        // when finished moving, draw the zoomed plots
        if (isZoomed) {
          timerStart();
          updateZoom();
          var latency = timerRead();
          debug("pinchend zoom replot in " + latency + "ms");
        }
        feedback('');
      });
    } catch (e) {
      log("ERROR: exception binding touch events " + e.message);
    }
  }

// ***********************************************************************************************************
//  user action handling
// ***********************************************************************************************************

  /**
   * Handle a user resize of the page and redraw using all of the current settings.
   */
  function resizeHandler() {
    timerStart();

    // adjust the plot sizes based on the current viewport
    updateScreenSize();

    // redraw the page using all of the current settings
    redraw();
  }

  /**
   * Redraw the plots using all of the current settings.
   */
  function redraw() {

    // change the page background color
    setColorSchemeCSS();

    // plot init
    plotInit();

    // update the resolution label depending on the series scheme
    updateDateLabels();

    // create the plot boxes
    buildPlots();
  }

  /**
   * Update the outer container and plot sizes based on the current device screen or browser viewport.
   */
  function updateScreenSize() {

    // resize the containing divs based on the new viewport size
    updateContainerSize();

    // tweak the font sizes
    updateFontSize();
  }

  /**
   * Tweak the font sizes and padding based on the screen size.
   */
  function updateFontSize() {

    // set the 'base' font size based on the screen size, override the default browser size
    // Note: in the latest update to Chrome, changing this from 11pt to 11px reduced the size of everything above the top plot
    var fontSize = '11pt';

    // jqplot x-axis labels are drawn on a canvas and are not controlled by CSS. They must be set via options, and only accept points as units.
    dateTickLabelFontSize = '11pt';

    // option button
    var optionButton = $('.option_button');
    optionButton.css('font-size', '0.7em');

    // timespan select menu
    var timespanButton = $('#timespan');
    timespanButton.css('font-size', '0.7em');

    DATA_PRESENCE_LINE_WIDTH = 2;

    if (isSmallScreen) {
//      log("is small screen");
      // reduce the font size a little for small screens. While the viewport meta tag takes care of it at a gross level, some tweaking is still
      // desirable so that the plots will take up more of the limited screen real estate
      fontSize = '9.3pt';
      dateTickLabelFontSize = '6.8pt';

      // button fonts need to be increased a bit to be readable!
      optionButton.css('font-size', '0.8em');
      timespanButton.css('font-size', '0.8em');

      DATA_PRESENCE_LINE_WIDTH = 2;

      // use skinny lines for small screens
      FLAG_LINE_WIDTH = 1;

    } else {
      FLAG_LINE_WIDTH = 2;
//      log("is large screen");
    }

    // adjust the overall flag box height based on the screen size
    FLAG_HEIGHT = FLAG_GAP + (FLAG_LINES * (FLAG_LINE_WIDTH + FLAG_GAP)) + FLAG_GAP + FLAG_FONT_SIZE;
//    log("isSmallScreen " + isSmallScreen + " flag line width " + FLAG_LINE_WIDTH + " flag_height " + FLAG_HEIGHT);

    // smaller dates for SWFO
    if (isSwfo()) {
      if (boxes !== undefined) {
        boxes.selectAll('.date_ranges').attr('font-size', '0.7em');
      }
    }

    // adjust the default font size on the outermost element, the CSS defines the relative sizes as needed
    var outerDiv = $('#outer_div1');
    outerDiv.css('font-size', fontSize);

    // this is needed for Mobile Safari on iOS
    outerDiv.css('-webkit-text-size-adjust', fontSize);
  }

  /**
   * Update the outer and main div container sizes based on the new viewport size.
   */
  function updateContainerSize() {
    var dpr = window.devicePixelRatio;
    if (dpr == null || dpr == undefined) {
      dpr = 1;
    }

    // this works for both Chrome on Windows and Safari on iPhone 5
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight;

//    feedback("pixelRatio " + dpr + " screen " + window.screen.width + "x" + window.screen.height
//        + " outer " + window.outerWidth + "x" + window.outerHeight
//        + " inner " + window.innerWidth + "x" + window.innerHeight + " scroll " + window.pageXOffset + "x" + window.pageYOffset
//        + " avail " + window.screen.availWidth + "x" + window.screen.availHeight
//        + " client " + document.documentElement.clientWidth + "x" + document.documentElement.clientHeight
//        + ' setting to ' + windowWidth + 'x' + windowHeight);

    //       $('#address_bar_spacer').css('display', 'none');

    // set the size of the outermost div based on the window size
    var outerDivHeight = windowHeight;

    // this check needs to take innerWidth into account in order to handle page viewport on desktops. screen.width is fine on small devices.
    // use minimum of screen width and innerWidth
    if (window.screen.width < LARGE_SCREEN_WIDTH || window.innerWidth < LARGE_SCREEN_WIDTH) {
//            if (window.screen.width < LARGE_SCREEN_WIDTH || (window.innerWidth < LARGE_SCREEN_WIDTH && dpr > 1)) {
      isSmallScreen = true;

      // on Mobile Safari at least, need to make the page larger than the viewport in order to make it scrollable, then use set the scroll to the top to
      // eliminate the address and tab bar.
//            outerDivHeight = windowHeight + 80;

//            $('#address_bar_spacer').css('display', 'block');
    } else {
      isSmallScreen = false;
    }

    // resize the outer div to the new viewport size
    var outerDiv = $('#outer_div1');

    // only modify the height
    outerDiv.css('height', outerDivHeight + 'px');
//    log("updateCOntSize setting outer_div1 height to " + outerDivHeight + " css "  + getCssHeight('#outer_div1'));

    // get the fixed height of the button container
    var buttonHeight = getCssHeight('#button_container1');

    // hack: if running in a Drupal page, scrollbars will always be shown and extra vertical space is needed
    var url3 = $('#dataservice_url3').text();
    if (url3 !== undefined && url3 !== null && url3.length > 0) {
      buttonHeight += 20;
    } else if (isMSIE()) {
      // MSIE can't seem to decide when it's appropriate to show the scrollbars, so just assume they're visible
      buttonHeight += 20;
    }

    // adjust the height of the main div to be the outer div minus the buttons
    var mainHeight = outerDivHeight - buttonHeight;
    var mainDiv = $('#main_div');
    mainDiv.css('height', mainHeight + 'px');

    // hack: adjust the width for IE to keep scrollbars from appearing unnecessarily
    // -1 for All timespan
    // 40 too small for 3-day, 50 ok
    if (isMSIE()) {
      mainDiv.css('width', (windowWidth - 20) + 'px');
    }
//    log("updateContainerSize setting main height to " + mainHeight + " css " + getCssHeight('#main_div') +
//        " width css " + getCssWidth('#main_div'));
  }

  /**
   * Callback for user selecting a timespan via drop-down menu or at startup.
   * @param {string} value - the desired timespan in hours
   */
  function changeSpanHandler(value) {

    // the number of ticks equals the number of intervals plus one extra for the first tick at the left side of the plot
    // the intervals do NOT necessarily match up with the number of files at the next higher resolution, but rather are just a reasonable subdivision
    // for the date labels
    switch (value) {
      case "2":
        // 2-hour (15 minute interval)
        currentIndex = 0;
        break;
      case "6":
        // 6-hour (30 minute interval)
        currentIndex = 1;
        break;
      case "24":
        // 1-day (4 hour interval)
        currentIndex = 2;
        break;
      case "72":
        // 1-day (4 hour interval)
        currentIndex = 3;
        break;
      case "168":
        // 7-day (1 day interval)
        currentIndex = 4;
        break;
      case "720":
        // 30-day (5 day interval)
        currentIndex = 5;
        break;
      case "1296":
        // 54-day (10 day interval)
        currentIndex = 6;
        break;
      case "1440":
        // 60-day (10 day interval)
        currentIndex = 6;
        break;
      case "8760":
        // 1-year (1 quarter interval)
        currentIndex = 7;
        break;
      case "43800":
        // 5-year (1 year interval)
        currentIndex = 8;
        break;
      case "all":
        // 30-year (3 year interval)
        currentIndex = 9;
        break;
      default:
        // 30-year (3 year interval)
        currentIndex = 9;
        break;
    }

    if (currentIndex == timespans.length - 1) {
      // special case since the "all" timespan grows over time. Compute the delta hours from the mission start.
      // which is then updated in timeshift()
      changeSpan(moment.utc().diff(MISSION_START, 'hours'));
    } else {
      // convert from minutes to hours
      changeSpan(timespans[currentIndex] / 60);
    }
  }

  /**
   * Change the time span being viewed in all plots.
   * @param {*} newSpan - the new timespan in hours
   */
  function changeSpan(newSpan) {

    // was there a change?
    if (newSpan != currentSpanHours) {
      // save the selected span in a global variable
      currentSpanHours = newSpan;

      // handle the special case of the mission span, which is a variable number of hours
      if (newSpan > 43800) {
        newSpan = 'mission';
      }

      // save this setting as a cookie
      jQuery.cookie(TIMESPAN_COOKIE, newSpan, { expires: COOKIE_EXPIRATION_DAYS, secure: true, sameSite: 'strict'});

      setUpGraphDates();

      // unzoom and redraw the shaded zoom box
      zoomReset(null, true);

      // fetch the data for the new span
      loadData();
    } else {
//      log("changeSpan: span didn't change");
    }
  }

  /**
   * Get the length of a minor-tick interval in milliseconds.
   * @param {number} span - the timespan in hours
   * @returns {number} - the minor tick interval in milliseconds
   */
  function getMinorIntervalSize(span) {
    var minorIntervalMs = ((span * ONE_HOUR_MS) / getIntervalSize(span)) - 1;

    if (span <= 2) {
      // 2-hour span: major tick mark on 15 minute boundaries, minor tick mark on 1 minute boundaries
      minorIntervalMs = ONE_MINUTE_MS;
    } else if (span <= 6) {
      // 6-hour span: tick mark on one hour boundaries, minor tick mark on 5 minute boundaries
      minorIntervalMs = 5 * ONE_MINUTE_MS;
    } else if (span <= 24) {
      // 1-day span: tick mark on 4 hour boundaries, minor tick mark on 1 hour boundaries
      minorIntervalMs = ONE_HOUR_MS;
    } else if (span <= 72) {
      // 3-day span: tick mark on 4 hour boundaries, minor tick mark on 2 hour boundaries
      minorIntervalMs = 2 * ONE_HOUR_MS;
    } else if (span <= 168) {
      // 5 or 7-day span: tick mark on 1 day boundaries, minor tick mark on 4 hour boundaries
      minorIntervalMs = 4 * ONE_HOUR_MS;
    } else if (span <= 720) {
      // 30-day span: tick mark on 5 day boundaries, minor tick mark on 1 day boundaries
      minorIntervalMs = ONE_DAY_MS;
    } else if (span <= 1440) {
      // 54 or 60-day span: tick mark on 10 day boundaries, minor tick mark on 2 day boundaries
      minorIntervalMs = 2 * ONE_DAY_MS;
    } else if (span <= 2160) {
      // 90-day span: tick mark on 15 day boundaries, minor tick mark on 3 day boundaries
      minorIntervalMs = 3 * ONE_DAY_MS;
    } else if (span <= 8760) {
      // 1-year span: tick mark on 90 day boundaries, minor tick mark on 15 day boundaries
      minorIntervalMs = getIntervalSize(span) / 6;
    } else if (span <= 43800) {
      // 5-year span: tick mark on 1 year boundaries, minor tick mark on 2 month boundaries
      minorIntervalMs = ONE_YEAR_MS / 6;
    } else {
      // 30-year span: tick mark on 3 year boundaries, minor tick mark on 6 month boundaries
      minorIntervalMs = ONE_YEAR_MS / 2;
    }

    // tick and minor tick MUST be even multiples

    return minorIntervalMs;
  }

  /**
   * Get the size of the current x-axis interval in milliseconds.
   * @param {number} span - the timespan in hours
   * @returns {number} - the current interval in milliseconds
   */
  function getIntervalSize(span) {
    var intervalMillis;

    if (span <= 2) {
      // 90-minute span: tick mark on 15 minute boundaries
      intervalMillis = 15 * ONE_MINUTE_MS;
    } else if (span <= 6) {
      // 6-hour span: tick mark on 1 hour boundaries
      intervalMillis = ONE_HOUR_MS;
    } else if (span <= 24) {
      // 1-day span: tick mark on 4 hour boundaries
      intervalMillis = 4 * ONE_HOUR_MS;
    } else if (span <= 72) {
      // 3-day span: tick mark on 8 boundaries
      intervalMillis = 8 * ONE_HOUR_MS;
    } else if (span <= 168) {
      // 5 or 7-day span: tick mark on 1 day boundaries
      intervalMillis = getIntervalMillis(1, 'day');
    } else if (span <= 720) {
      // 30-day span: tick mark on 5 day boundaries
      intervalMillis = getIntervalMillis(5, 'days');
    } else if (span <= 1440) {
      // 54 or 60-day span: tick mark on 10 day boundaries
      intervalMillis = getIntervalMillis(10, 'days');
    } else if (span <= 2160) {
      // 90-day span: tick mark on 15 day boundaries
      intervalMillis = getIntervalMillis(15, 'days');
    } else if (span <= 8760) {
      // 1-year span: tick mark on 90 day boundaries
      intervalMillis = getIntervalMillis(1, 'quarter');
    } else if (span <= 43800) {
      // 5-year span: tick mark on 1 year boundaries
      intervalMillis = getIntervalMillis(1, 'year');
    } else {
      // 30-year span: tick mark on 3 year boundaries
      intervalMillis = getIntervalMillis(3, 'years');
    }

    return intervalMillis;
  }

  /**
   * Get the milliseconds corresponding to a given number of text Moment units (e.g., 'quarter').
   * @param {number} count
   * @param {string} type
   * @returns {number} - the number of milliseconds in the interval
   */
  function getIntervalMillis(count, type) {
    var now = moment.utc();
    var later = moment.utc(now).add(count, type);
    return later.diff(now);
  }

//  /**
//   * Compute the start time of the next interval after the given time. An interval is a user-friendly subdivision of the current timespan into 3-6 chunks.
//   * E.g., split a 1-day timespan into 4-hour intervals. This is used to determine the end date of the plot, with some empty space to the right of the data.
//   * @param {number} span - the time span in fractional hours
//   * @param {Object} time - the time Moment
//   * @returns {Object} - the start time of the next interval after the given time as a Moment
//   */
//  function computeNextIntervalStart(span, time) {
//    var startOfDay = moment.utc(time).startOf('day');
//
//    // determine the current time as milliseconds since midnight
//    var millisOfDay = time.diff(startOfDay);
//
//    var intervalMillis;
//    var intervals;
//    var nextIntervalStart;
//
//    if (span <= 2) {
//      // 90-minute span: tick mark on 15 minute boundaries
//      intervalMillis = 15 * ONE_MINUTE_MS;
//
//      // compute the whole number of intervals that have elapsed since the start of the day using explicit truncation
//      intervals = Math.floor(millisOfDay / intervalMillis);
//
//      nextIntervalStart = moment.utc(startOfDay).add((intervals + 1) * intervalMillis, 'ms');
//    } else if (span <= 6) {
//      // 6-hour span: tick mark on 1 hour boundaries
//      intervalMillis = ONE_HOUR_MS;
//
//      // compute the whole number of intervals that have elapsed since the start of the day using explicit truncation
//      intervals = Math.floor(millisOfDay / intervalMillis);
//
//      nextIntervalStart = moment.utc(startOfDay).add((intervals + 1) * intervalMillis, 'ms');
//    } else if (span <= 24) {
//      // 1-day span: tick mark on 4 hour boundaries
//      intervalMillis = 4 * ONE_HOUR_MS;
//
//      // compute the whole number of intervals that have elapsed since the start of the day using explicit truncation
//      intervals = Math.floor(millisOfDay / intervalMillis);
//
//      nextIntervalStart = moment.utc(startOfDay).add((intervals + 1) * intervalMillis, 'ms');
//    } else if (span <= 72) {
//      // 3-day span: tick mark on 8 hour boundaries
//      intervalMillis = 8 * ONE_HOUR_MS;
//
//      // compute the whole number of intervals that have elapsed since the start of the day using explicit truncation
//      intervals = Math.floor(millisOfDay / intervalMillis);
//
//      nextIntervalStart = moment.utc(startOfDay).add((intervals + 1) * intervalMillis, 'ms');
//    } else if (span <= 168) {
//      // 5 or 7-day span: tick mark on 1 day boundaries
//      nextIntervalStart = moment.utc(startOfDay).add(1, 'day');
//    } else if (span <= 720) {
//      // 30-day span: tick mark on 5 day boundaries
//      // intervals are offset from the beginning of the current month, so that intervals are days 1-5, 6-10, etc
//      var nextIntervalTime = moment.utc(startOfDay).add(5, 'days');
//      var intervalStartDayOffset = (nextIntervalTime.date() - 1) % 5;
//      nextIntervalStart = moment.utc(nextIntervalTime).subtract(intervalStartDayOffset, 'days');
//    } else if (span <= 1440) {
//      // 54 or 60-day span: tick mark on 10 day boundaries
//      // intervals are offset from the beginning of the current month, so that intervals are days 1-10, 11-20
//      nextIntervalTime = moment.utc(startOfDay).add(10, 'days');
//      intervalStartDayOffset = (nextIntervalTime.date() - 1) % 10;
//      nextIntervalStart = moment.utc(nextIntervalTime).subtract(intervalStartDayOffset, 'days');
//    } else if (span <= 2160) {
//      // 90-day span: tick mark on 15 day boundaries
//      // intervals are offset from the beginning of the current month, so that intervals are days 1-15, 16-30
//      nextIntervalTime = moment.utc(startOfDay).add(15, 'days');
//      intervalStartDayOffset = (nextIntervalTime.date() - 1) % 15;
//      nextIntervalStart = moment.utc(nextIntervalTime).subtract(intervalStartDayOffset, 'days');
//    } else if (span <= 8760) {
//      // 1-year span: tick mark on quarter boundaries
//      // adjust the time to the quarter boundary (Jan-01, Apr-01, Jun-01, Oct-01)
//      nextIntervalStart = moment.utc(startOfDay).startOf('quarter').add(1, 'quarter');
////            log("year: nextInterval " + nextIntervalStart.format());
//    } else if (span <= 43800) {
//      // 5-year span: tick mark on 1 year boundaries
//      nextIntervalStart = moment.utc(startOfDay).startOf('year').add(1, 'year');
//    } else {
//      // 30-year span: tick mark on 3 year boundaries
//      var yearOffset = (startOfDay.year() - 1998) % 3;
//      nextIntervalStart = moment.utc(startOfDay).startOf('year').subtract(yearOffset * ONE_YEAR_MS).add(3, 'years');
//    }
//
//    return nextIntervalStart;
//  }

  /**
   * Compute the end time of the whitespace offset containing the given time, The result will be used as the end time of the plot. The offset is the
   * maximum amount of whitespace to show. When the whitespace is completely filled, the plot shifts to the left by the size of the offset.
   * @param {Object} time - the given time as a Moment
   * @returns {Object} - the start time of the offset before or equal to the given time
   */
  function computeNextOffsetStart(time) {
    var startOfDay = moment.utc(time).startOf('day');

    // determine the current time as milliseconds since midnight
    var millisOfDay = time.diff(moment.utc(startOfDay).startOf('day'));

    var intervals;
    var nextOffsetStart;
    var offsetMs;

    // set the offset to ~1/12th of the timespan on a practical boundary
    if (currentSpanHours <= 2) {
      // 90-minute span: whitespace = 5 minutes max
      offsetMs = 5 * ONE_MINUTE_MS;

      // compute the whole number of intervals that have elapsed since the start of the day using explicit truncation
      intervals = Math.floor(millisOfDay / offsetMs);

      nextOffsetStart = moment.utc(startOfDay).add(intervals * offsetMs, 'ms');
    } else if (currentSpanHours <= 6) {
      // 6-hour span: whitespace = 30 minutes max
      offsetMs = 30 * ONE_MINUTE_MS;

      // compute the whole number of intervals that have elapsed since the start of the day using explicit truncation
      intervals = Math.floor(millisOfDay / offsetMs);

      nextOffsetStart = moment.utc(startOfDay).add(intervals * offsetMs, 'ms');
    } else if (currentSpanHours <= 24) {
      // 1-day span: whitespace = 2 hours max
      offsetMs = 2 * ONE_HOUR_MS;

      // compute the whole number of intervals that have elapsed since the start of the day using explicit truncation
      intervals = Math.floor(millisOfDay / offsetMs);

      nextOffsetStart = moment.utc(startOfDay).add(intervals * offsetMs, 'ms');
    } else if (currentSpanHours <= 72) {
      // 3-day span: whitespace = 6 hours max
      offsetMs = 6 * ONE_HOUR_MS;

      // compute the whole number of intervals that have elapsed since the start of the day using explicit truncation
      intervals = Math.floor(millisOfDay / offsetMs);

      nextOffsetStart = moment.utc(startOfDay).add(intervals * offsetMs, 'ms');
    } else if (currentSpanHours <= 168) {
      // 5 or 7-day span: whitespace = 12 hours max
      offsetMs = 12 * ONE_HOUR_MS;

      // compute the whole number of intervals that have elapsed since the start of the day using explicit truncation
      intervals = Math.floor(millisOfDay / offsetMs);

      nextOffsetStart = moment.utc(startOfDay).add(intervals * offsetMs, 'ms');
    } else if (currentSpanHours <= 720) {
      // 30-day span: whitespace = 2 days max
      offsetMs = 2 * ONE_DAY_MS;
      var day2Offset = Math.floor(startOfDay.date() / 2);
      nextOffsetStart = moment.utc(startOfDay).startOf('month').add(day2Offset * offsetMs);
    } else if (currentSpanHours <= 1440) {
      // 54 or 60-day span: whitespace = 3 days max
      offsetMs = 3 * ONE_DAY_MS;
      var day3Offset = Math.floor(startOfDay.date() / 3);
      nextOffsetStart = moment.utc(startOfDay).startOf('month').add(day3Offset * offsetMs);
    } else if (currentSpanHours <= 2160) {
      // 90-day span: whitespace = 5 days max
      offsetMs = 5 * ONE_DAY_MS;
      var day5Offset = Math.floor(startOfDay.date() / 5);
      nextOffsetStart = moment.utc(startOfDay).startOf('month').add(day5Offset * offsetMs);
    } else if (currentSpanHours <= 8760) {
      // 1-year span: whitespace = 1 month max
      offsetMs = ONE_YEAR_MS / 12;
      nextOffsetStart = moment.utc(startOfDay).startOf('month');
    } else if (currentSpanHours <= 43800) {
      // 5-year span: whitespace = 6 months max
      offsetMs = ONE_YEAR_MS / 2;
      var yearHalf = (startOfDay.month() + 1) / 6;
      nextOffsetStart = moment.utc(startOfDay).startOf('year').add(yearHalf * offsetMs);
    } else {
      // 30-year span: whitespace = 1 year max
      offsetMs = ONE_YEAR_MS;
      nextOffsetStart = moment.utc(startOfDay).startOf('year');
    }

    // bump to the next offset boundary
    nextOffsetStart.add(offsetMs);

    return nextOffsetStart;
  }

  /**
   * Set the plot start and end times based on the current rounded-down browser system UTC time. The end time is extended as appropriate to show recurrence or
   * predictions.
   */
  function setUpGraphDates() {
    // determine the start time of the next offset (typically 10-12 per span), this will be the end time of the plot
    endMoment = computeNextOffsetStart(calculateNowDate());

    // now go back one full timespan to determine the start time of the plot
    // calling moment on a moment will clone the object rather than changing the existing object
    startMoment = moment.utc(endMoment).subtract(currentSpanHours, 'hours');
    if (isMission()) {
      startMoment = moment.utc(MISSION_START);
    }

    // if showing Enlil, need to extend out the end since the prediction is for 5 days in the future
    var addMillis = 0;
    if (enlilScheme === 'true') {
      // Enlil predicts 5 days out
      // for short spans, assume the user is mostly focused on the current data, so only show a little of the prediction
      if (timespans[currentIndex] < 30 * 1440) {
        addMillis = Math.max(getIntervalSize(currentSpanHours), addMillis);
      } else {
        // show the whole prediction
        addMillis = 5 * ONE_DAY_MS;
      }
    }

    if (geospaceScheme === 'true') {
      // geospace prediction is shorter than Enlil
      addMillis = Math.max(80 * ONE_MINUTE_MS, addMillis);
    }

    if (recurrenceScheme === 'true') {
      // recurrence is 27 days out
      if (timespans[currentIndex] < 30 * 1440) {
        // for short spans, assume the user is mostly focused on the current data, so only show a little bit of the prediction
        addMillis = Math.max(timespans[currentIndex] * ONE_MINUTE_MS / 2, addMillis);
      } else if (timespans[currentIndex] === 30 * 1440) {
        if (getQueryVariable('weekly') === 'true') {
          // SWFO weekly wants full 27 day recurrence shown
          addMillis = Math.max(CARRINGTON_ROTATION_MINUTE * ONE_MINUTE_MS, addMillis);
        } else {
          // 30-day span, add 4 days to get one week look-ahead (27 + 7 = 34)
          addMillis = Math.max(4 * ONE_DAY_MS, addMillis);
        }
      } else if (timespans[currentIndex] < 5 * 365 * 1440) {
        // remaining spans less than 5 years, add one Carrington rotation. Longer spans don't add anything, little use
        addMillis = Math.max(CARRINGTON_ROTATION_MINUTE * ONE_MINUTE_MS, addMillis);
      }
    }

    // don't bother adjusting long timespans
    if (timespans[currentIndex] < 365 * 1440) {
      endMoment.add(addMillis);
    }

    // update the displayed times
    updateDateLabels();
  }

  /**
   * Switch the source spacecraft display.
   * @param {string} value - the source scheme to change to
   * @result {boolean} - true if the source spacecraft was changed
   */
  function changeSourceHandler(value) {
    var changed = false;

    if (value != sourceScheme) {
      changed = true;

      // switch to the new source to display
      sourceScheme = value;

      // save this setting as a cookie
      jQuery.cookie(SOURCE_SCHEME_COOKIE, sourceScheme, { expires: COOKIE_EXPIRATION_DAYS });

      // switch the filtered data arrays
      applyFilters();

      // determine which spacecraft's data are visible using the new source scheme
      determineVisibleSource();
    }
    return changed;
  }

  /**
   * Switch the set of plots to display.
   * @param {string} value - the series scheme to change to
   * @result {boolean} - true if the series scheme was changed
   */
  function changeSeriesHandler(value) {
    var changed = false;

    if (value != seriesScheme) {
      changed = true;

      // switch the scheme to the new set of PlasMag plots to display
      seriesScheme = value;

      // save this setting as a cookie
      jQuery.cookie(SERIES_SCHEME_COOKIE, seriesScheme, { expires: COOKIE_EXPIRATION_DAYS });
    }

    return changed;
  }

  /**
   * Create a modal dialog for gathering user series selections.
   */
  function displaySeriesDialog() {

    // create the Series modal dialog widget
    var seriesDialog = $('#series_dialog');
    seriesDialog.dialog({
      modal: true,
      autoOpen: false,
      closeOnEscape: true,
      width: 300,
      draggable: true,
      title: 'Series',
      open: function () {
        // track if the user ends up changing any values
        yAxisChanged = false;

        $("#seriesgroup").change(function () {

          // save the field values (if any)
          saveYScale(previousYAxisIndex);

          // which plot did the user select?
          var index = parseInt($('#seriesgroup').val());

          // populate the min/max fields with the current values
          $('#y_min_input').val(yAxisMin[index]);
          $('#y_max_input').val(yAxisMax[index]);

          // remember the last one we edited so we can restore it's values later
          previousYAxisIndex = index;
        });
        $('#y_scale_clear_button').click(function () {
          // which plot did the user select?
          var index = parseInt($('#seriesgroup').val());
          clearYScale(index);
        });
        $('#y_scale_clear_all_button').click(function () {
          // clearing all y scale settings
          clearYScale(-1);
        });
      },
      buttons: {
        'OK': function () {
//          timerStart();

          // grab the current series settings from the dialog
          var source = $('input[name=sourcescheme]:checked').val();

          // grab the current series settings from the dialog
          var series = $('input[name=seriesscheme]:checked').val();

          // grab the Recurrence overlay state from the dialog
          var recur = $('input[name=recurrencescheme]:checked').val();

          // grab the KpAp overlay state from the dialog
          var kpap = $('input[name=kpapscheme]:checked').val();

          // grab the Enlil overlay state from the dialog
          var enlil = $('input[name=enlilscheme]:checked').val();

          // grab the Geospace overlay state from the dialog
          var geo = $('input[name=geospacescheme]:checked').val();

          // get the plot index (must parse from string!)
          var index = parseInt($('#seriesgroup').val());

          // done with the dialog, close it
          $(this).dialog('close');

          // apply the changes
          var sourceChanged = changeSourceHandler(source);
          var seriesChanged = changeSeriesHandler(series);
          var recurrenceChanged = changeRecurrenceScheme(recur);
          var kpApChanged = changeKpApScheme(kpap);
          var enlilChanged = changeEnlilScheme(enlil);
          var geospaceChanged = changeGeospaceScheme(geo);

          // save the last entries
          saveYScale(index);

//          log("displaySeriesDialog: sourceChanged " + sourceChanged + " seriesChanged " + seriesChanged + " yAxisChanged " + yAxisChanged);
          if (sourceChanged || seriesChanged || recurrenceChanged || kpApChanged || enlilChanged || geospaceChanged || yAxisChanged) {
            // redraw the plots using the new settings
            redraw();
          }

          // process the user zoom span selection, if given
          changeZoomSpan();
//          log("seriesDialog OK done in " + timerRead() + " ms");
        },
        'Cancel': function () {
          $(this).dialog('close');
        }
      }
    });

    // open the dialog
    seriesDialog.dialog('open');
  }

  function clearYScale(index) {
    if (index >= 0) {
      // clear one
      yAxisMin[index] = undefined;
      yAxisMax[index] = undefined;
    } else {
      // clear all
      for (var i = 0; i < yAxisMin.length; i++) {
        yAxisMin[i] = undefined;
        yAxisMax[i] = undefined;
      }
    }

    // clear the text input fields
    $('#y_min_input').val(undefined);
    $('#y_max_input').val(undefined);
  }

  /**
   * Update the y scale min/max settings.
   * @param index
   */
  function saveYScale(index) {

    // fall out if the index is undefined
    if (index === undefined) {
      return;
    }

    var temp;

    // read the Y axis min/max values
    var yMin = parseInt($('#y_min_input').val());
    var yMax = parseInt($('#y_max_input').val());

    // were a min and max both entered?
    if (yMax && yMin) {

      // are the entered times both parseable?
      if (!isNaN(yMin) && !isNaN(yMax)) {

        // swap them if in wrong order
        if (yMin > yMax) {
          temp = yMin;
          yMin = yMax;
          yMax = temp;
        }

        // were either of the values changed?
        if (yMin !== yAxisMin[index] || yMax !== yAxisMax[index]) {
          // save the entered values
          yAxisMin[index] = yMin;
          yAxisMax[index] = yMax;

          yAxisChanged = true;
        }
      } else {
        log("ERROR: enter valid y axis numbers");
      }
    }
  }

  /**
   * Change the zoomed span based on user input from the dialog.
   */
  function changeZoomSpan() {
    // read the zoom start/end values
    var zStart = $('#zoom_start_input').val();
    var zEnd = $('#zoom_end_input').val();

    // were a start and end time both entered?
    if (zStart && zEnd) {

      // delete brackets in case the user entered them
      zStart = zStart.replace(/\[/g, '');
      zStart = zStart.replace(/\]/g, '');
      zEnd = zEnd.replace(/\[/g, '');
      zEnd = zEnd.replace(/\]/g, '');

      // are the entered times both parseable?
      if (moment.utc(zStart).isValid() && moment.utc(zEnd).isValid()) {
        var zs = moment.utc(zStart);
        var ze = moment.utc(zEnd);

        // swap the order if necessary
        if (zs.isAfter(ze)) {
//          log("swapping");
          var temp = moment.utc(zs);
          zs = ze;
          ze = temp;
        }
//        log("start " + zs.format(DATE_FORMAT_DISPLAY) + " end " + ze.format(DATE_FORMAT_DISPLAY));

        // verify that the times are within the timespan, show alert dialog if not
        if (zs.isBefore(startMoment) || zs.isAfter(endMoment) || ze.isBefore(startMoment) || ze.isAfter(endMoment)) {
//          log("not zooming");
          var msg = "";
          if (zs.isBefore(startMoment) || zs.isAfter(endMoment)) {
            msg += "Zoom start must be in the range " + startMoment.format(DATE_FORMAT_DISPLAY) + " to " + endMoment.format(DATE_FORMAT_DISPLAY) + "\n";
          }
          if (ze.isBefore(startMoment) || ze.isAfter(endMoment)) {
            msg += "Zoom end must be in the range " + startMoment.format(DATE_FORMAT_DISPLAY) + " to " + endMoment.format(DATE_FORMAT_DISPLAY);
          }

          // show an alert dialog
          alert(msg);
        } else {
//          log("zooming");

          // emulate dragging out a zoom selection
          zoomStartMoment = zs;
          zoomStartPixel = computePixel(computeIndexFromMoment(zs));

          // assume moving left to right, so the mouse up is the end
          zoomEndMoment = ze;
          zoomEndPixel = computePixel(computeIndexFromMoment(ze));

          // perform the zoom operation
          zoomD3();
        }
      } else {
        log("ERROR: enter times in ISO-8601 format");
      }
    }
  }

  /**
   * Create a modal dialog for gathering user option selections.
   */
  function displayOptionsDialog() {

    // create the Options modal dialog widget
    var optionsDialog = $('#options_dialog');
    optionsDialog.dialog({
      modal: true,
      autoOpen: false,
      closeOnEscape: true,
      draggable: true,
//      width: 300,
      title: 'Options',
      buttons: {
        'OK': function () {

          // grab the current option settings from the dialog
          var sch = $('input[name=colorscheme]:checked').val();
          var ml = $('input[name=renderscheme]:checked').val();
          var yl = $('input[name=ylabelscheme]:checked').val();
          var showFlag = $('input[name=flagscheme]:checked').val();

          // done with the dialog, close it
          $(this).dialog('close');

          // apply the changes and refresh the page
          var colorChanged = changeColorScheme(sch);
          var renderChanged = changeRenderScheme(ml);
          var ylChanged = changeYLabelScheme(yl);
          var flagChanged = changeFlagScheme(showFlag);

          // rebuild the plots if necessary
          if (colorChanged || renderChanged || ylChanged || flagChanged) {
            redraw();
          }
        },
        'Cancel': function () {
          $(this).dialog('close');
        }
      }
    });

    // open the dialog
    optionsDialog.dialog('open');
  }

  /**
   * Change the page background color scheme.
   * @param {string} scheme - the scheme name to change to
   */
  function changeColorScheme(scheme) {
    var changed = false;
    if (scheme !== colorScheme) {
      changed = true;

      // make the new scheme globally available
      colorScheme = scheme;

      // save this setting as a cookie
      jQuery.cookie(COLOR_SCHEME_COOKIE, colorScheme, { expires: COOKIE_EXPIRATION_DAYS });
    }

    return changed;
  }

  /**
   * Swap the color scheme CSS file to change CSS-driven colors.
   */
  function setColorSchemeCSS() {
    // IMPORTANT: CSS modifications only take affect if called AFTER the relevant objects have been created and added to the DOM!
    // so, call this after creating either the plots or the zoom box

    if (colorScheme === BLACK_SCHEME) {
      // color scheme settings for black page and plot background

      // the main work area background
      $('#main_div').css('background-color', BLACK_BACKGROUND_COLOR);

      $('.button_container').css('background-color', BLACK_BACKGROUND_COLOR);

      $('.option_button').css('color', '#444444');

      $('#debug').css('color', 'red');

      $('#feedback').css('color', 'white');
    } else {
      // color scheme settings for white page and plot background

      // the main work area background
      $('#main_div').css('background-color', WHITE_BACKGROUND_COLOR);

      $('.button_container').css('background-color', WHITE_BACKGROUND_COLOR);

      $('.option_button').css('color', '#444444');

      $('#debug').css('color', 'red');

      $('#feedback').css('color', 'slategray');
    }

    // change the wording on small screens
    if (isSmallScreen) {
      $('#save_button').text('Text');
      $('#save_image_button').text('Image');
    } else {
      $('#save_button').text('Save as text');
      $('#save_image_button').text('Save as Image');
    }
  }

  /**
   * Change the series plot rendering (marker vs line) scheme.
   * @param {string} scheme - the scheme name to change to
   */
  function changeRenderScheme(scheme) {
    var changed = false;
    if (scheme !== renderScheme) {
      changed = true;

      // make the new scheme globally available
      renderScheme = scheme;

      // save this setting as a cookie
      jQuery.cookie(RENDER_SCHEME_COOKIE, renderScheme, { expires: COOKIE_EXPIRATION_DAYS });
    }

    return changed;
  }

  /**
   * Change the Y axis label position scheme.
   * @param {string} scheme - the scheme name to change to
   */
  function changeYLabelScheme(scheme) {
    var changed = false;
    if (scheme !== yLabelScheme) {
      changed = true;

      // make the new scheme globally available
      yLabelScheme = scheme;

      // save this setting as a cookie
      jQuery.cookie(Y_LABEL_SCHEME_COOKIE, yLabelScheme, { expires: COOKIE_EXPIRATION_DAYS });

      // nothing else to do, the new scheme will get picked up when the plots are redrawn
    }

    return changed;
  }

  /**
   * Change whether to show the flag strips or not.
   *
   * @param {string} scheme - either true or undefined
   */
  function changeFlagScheme(scheme) {
    var changed = false;
    if (scheme !== flagScheme) {
      changed = true;

      // make the new scheme globally available
      flagScheme = (scheme === 'true') ? SHOW_FLAG_SCHEME : HIDE_FLAG_SCHEME;

      // save this setting as a cookie
      jQuery.cookie(FLAG_SCHEME_COOKIE, flagScheme, { expires: COOKIE_EXPIRATION_DAYS });

      // nothing else to do, the new scheme will get picked up when the plots are redrawn
    }

    return changed;
  }

  /**
   * Change whether to show the recurrence overlay or not.
   *
   * @param {string} scheme - either true or undefined
   */
  function changeRecurrenceScheme(scheme) {
    var changed = false;
    if (scheme !== recurrenceScheme) {
      changed = true;

      // make the new scheme globally available
      recurrenceScheme = (scheme === 'true') ? SHOW_RECURRENCE_SCHEME : HIDE_RECURRENCE_SCHEME;

      // save this setting as a cookie
      jQuery.cookie(RECURRENCE_SCHEME_COOKIE, recurrenceScheme, { expires: COOKIE_EXPIRATION_DAYS });

      // need to load recurrence data?
      if (recurrenceScheme === 'true') {
        loadAllRecurrenceData();
      } else {
        // clear all the stored recurrence data
        recurrenceStartNumber = undefined;
        recurrenceEndNumber = undefined;
        magDataRecurrence = undefined;
        plasmaDataRecurrence = undefined;
        filteredMagDataRecurrence = undefined;
        filteredPlasmaDataRecurrence = undefined;

        mdatar = undefined;
        pdatar = undefined;
        filteredMdatar = undefined;
        filteredPdatar = undefined;

        kpApRecurrenceStartNumber = undefined;
        kpApRecurrenceEndNumber = undefined;
        kpApDataRecurrence = undefined;
        kdatar = undefined;
      }

      // adjust the end moment to show some recurrence data
      setUpGraphDates();
    }
    return changed;
  }

  /**
   * Change whether to show the KpAp plot or not.
   *
   * @param {string} scheme - either true or undefined
   */
  function changeKpApScheme(scheme) {
    var changed = false;

    if (scheme !== kpApScheme) {
      changed = true;

      // make the new scheme globally available
      kpApScheme = (scheme === 'true') ? SHOW_KPAP_SCHEME : HIDE_KPAP_SCHEME;

      // save this setting as a cookie
      jQuery.cookie(KPAP_SCHEME_COOKIE, kpApScheme, { expires: COOKIE_EXPIRATION_DAYS });

      toggleKpAp();
    }

    return changed;
  }

  /**
   * Turn on the KpAp plot.
   */
  function enableKpAp() {

    // load fresh Kp data
    loadKpApData();

    // load KpAp recurrence data if necessary
    if (loadRecurrence() && kpApScheme === 'true') {
      loadRecurrenceData(false);
    }
  }

  /**
   * Turn off the KpAp plot.
   */
  function disableKpAp() {
    // free the data and reset the related variables.
    kpApData = undefined;
    kpApDataRecurrence = undefined;
    kpApRecurrenceStartNumber = undefined;
    kpApRecurrenceEndNumber = undefined;
  }

  /**
   * Toggle the KpAp plot state.
   */
  function toggleKpAp() {

    // need to load KpAp?
    if (kpApScheme === 'true') {
      enableKpAp();
    } else {
      disableKpAp();
    }
  }

  /**
   * Change whether to show the Enlil overlay or not.
   *
   * @param {string} scheme - either true or undefined
   */
  function changeEnlilScheme(scheme) {
    var changed = false;
    if (scheme !== enlilScheme) {
      changed = true;

      // make the new scheme globally available
      enlilScheme = (scheme === 'true') ? SHOW_ENLIL_SCHEME : HIDE_ENLIL_SCHEME;

      // save this setting as a cookie
      jQuery.cookie(ENLIL_SCHEME_COOKIE, enlilScheme, { expires: COOKIE_EXPIRATION_DAYS });

      // need to load enlil?
      if (enlilScheme === 'true') { // && enlilData === undefined) {
        loadEnlilData();
      } else {
        enlilData = undefined;
      }

      // extend the end moment
      setUpGraphDates();
    }

    return changed;
  }

  /**
   * Change whether to show the Geospace overlay or not.
   *
   * @param {string} scheme - either true or undefined
   */
  function changeGeospaceScheme(scheme) {
    var changed = false;
    if (scheme !== geospaceScheme) {
      changed = true;

      // make the new scheme globally available
      geospaceScheme = (scheme === 'true') ? SHOW_GEOSPACE_SCHEME : HIDE_GEOSPACE_SCHEME;

      // save this setting as a cookie
      jQuery.cookie(GEOSPACE_SCHEME_COOKIE, geospaceScheme, { expires: COOKIE_EXPIRATION_DAYS, secure: true, sameSite: 'lax' });

      // extend the end moment
      setUpGraphDates();

      // need to load geospace?
      if (geospaceScheme === 'true') {
        loadGeospaceData();
      } else {
        geospaceData = undefined;
      }
    }

    return changed;
  }

// ***********************************************************************************************************
//  data handling
// ***********************************************************************************************************

  /**
   * (d3-specific) Execute d3 queue requests to load the initial Phase I data sets.
   * start and end are Moment objects
   */
  function loadData() {
    timerStart();

    // delete the existing data before loading new
    magData = undefined;
    plasmaData = undefined;
    filteredMagData = undefined;
    filteredPlasmaData = undefined;

    // for Phase I initial loads, the dataStartMoment is the same as the computed startMoment
    dataStartMoment = moment.utc(startMoment);
    dataEndMoment = moment.utc(endMoment);

    // prepare to load and get the file timespan
    var tag = prepLoad();

    log("trying initial load from " + dataServiceUrl);

    // build the REST queries
    var magQuery = dataServiceUrl + "mag-" + tag + PHASE_I_FINAL_EXTENSION;
    var plasmaQuery = dataServiceUrl + "plasma-" + tag + PHASE_I_FINAL_EXTENSION;
//    log("Phase I magQuery " + magQuery);
//    log("Phase I plasmaQuery " + plasmaQuery);

    // fetch the Phase I JSON files
    d3_queue.queue()
        .defer(d3_request.json, magQuery)
        .defer(d3_request.json, plasmaQuery)
        .await(initialLoad);

    // load fresh Kp data
    if (kpApScheme === 'true') {
      loadKpApData();
    }

//    log("loadData: loadRecurrence " + loadRecurrence());

    // load fresh Recurrence data
    if (loadRecurrence()) {
//      log('loadData: loading recurrence data after loading PhaseI data');
      loadAllRecurrenceData();
    }

    // need to load enlil?
    if (enlilScheme === 'true' && enlilData === undefined) {
      loadEnlilData();
    }

    // need to load geospace?
    if (geospaceScheme === 'true' && geospaceData === undefined) {
      loadGeospaceData();
    }
  }

  /**
   * (d3-specific) Execute d3 queue requests to load the Kp-Ap data set.
   */
  function loadKpApData() {

    // delete the existing data before loading new
    kpApData = undefined;

    var tag = prepLoad();

    if (tag !== undefined) {
      var obsKpQuery = dataServiceUrl + "kp-" + tag + PHASE_I_FINAL_EXTENSION;
//      log("obsKpQuery " + obsKpQuery);

      // fetch the Phase I JSON data
      d3_queue.queue()
          .defer(d3_request.json, obsKpQuery)
          .await(initialLoadKpAp);
    }
  }

  /**
   * Load both plasmag and KpAp recurrence data files.
   */
  function loadAllRecurrenceData() {
    // load plasmag recurrence data
    loadRecurrenceData(true);

    // load KpAp recurrence data
    if (kpApScheme === 'true') {
      loadRecurrenceData(false);
    }
  }

  /**
   * Load the plasmag or KpAp recurrence data files.
   */
  function loadRecurrenceData(fetchPlasMag) {
    // log("loadRecurrenceData: plasmag? " + fetchPlasMag);
    var startNumber;
    var endNumber;
    var recurrenceStart;
    var recurrenceEnd;

    // get the data immediately preceding the plot start from 27 days ago
    recurrenceStart = moment.utc(visibleStart()).subtract(CARRINGTON_ROTATION_MINUTE, 'minutes');
    startNumber = (fetchPlasMag) ? computeFileNumber(files[visibleIndex()], recurrenceStart) : computeKpApFileNumber(files[visibleIndex()], recurrenceStart);

    // is the timespan less than 30 days?
    if (timespans[visibleIndex()] < 30 * 1440) {
      // go back 27 days from the right edge of the plot, which may require 3 files to be fetched
      recurrenceEnd = moment.utc(visibleEnd()).subtract(CARRINGTON_ROTATION_MINUTE, 'minutes');
      endNumber = (fetchPlasMag) ? computeFileNumber(files[visibleIndex()], recurrenceEnd) : computeKpApFileNumber(files[visibleIndex()], recurrenceEnd);

      // fetch a maximum of 3 files
      if (endNumber - startNumber > 2) {
        endNumber = startNumber + 2;
      }
    } else if (timespans[visibleIndex()] <= 365 * 1440) {
      recurrenceEnd = moment.utc(visibleStart());
      endNumber = (fetchPlasMag) ? computeFileNumber(files[visibleIndex()], recurrenceEnd) : computeKpApFileNumber(files[visibleIndex()], recurrenceEnd);
    }

    if (fetchPlasMag) {
      // do we need to fetch different files?
      if (startNumber !== recurrenceStartNumber && endNumber !== recurrenceEndNumber) {
//        log('loadRecurrenceData: fetching plasmag recurrence data');
        loadPlasMagDataUsingNumberD3(startNumber, endNumber, true);
      } else {
//        log('loadRecurrenceData: plasmag file numbers have not changed, not fetching');
      }
    } else {
      if (startNumber !== kpApRecurrenceStartNumber && endNumber !== kpApRecurrenceEndNumber) {
//        log('loadRecurrenceData: fetching kp ap recurrence data');
        loadKpApDataUsingNumberD3(startNumber, endNumber, true);
      } else {
//        log('loadRecurrenceData: kp ap file numbers have not changed, not fetching');
      }
    }
  }

  /**
   * (d3-specific) Execute AJAX queries to load the Enlil data set.
   */
  function loadEnlilData() {
    var enlilQuery = dataServiceUrl + "enlil.json";

    // delete the existing data before loading new
    enlilData = undefined;

    d3_queue.queue()
        .defer(d3_request.json, enlilQuery)
        .await(loadEnlil);
  }

  /**
   * (d3-specific) Execute AJAX queries to load the initial Phase I data sets.
   * start and end are Moment objects
   */
  function loadGeospaceData() {

    // works for both WOC and NCS
    // WOC dataservice_url is https://services.swpc.noaa.gov
    // log("dataservice_url [" +$('#dataservice-url').text() + "]");
    var host = $('#dataservice_url').text();
    host = (host === '') ? 'http://web-ops-02/services_push' : host;
    // log("host [" + host + "]");

    // 7 day history + 45-90 minutes prediction
    var geospaceQuery = host + '/products/geospace/propagated-solar-wind.json';

    // delete the existing data before loading new
    geospaceData = undefined;

    d3_queue.queue()
        .defer(d3_request.json, geospaceQuery)
        .await(loadGeospace);
  }

  /**
   * Execute AJAX queries to load the PlasMag Phase II data files.
   * @param {number} startFileNumber - the computed number of the first file to load
   * @param {number} endFileNumber - the computed number of the last file to load
   * @param {boolean} recurrence - true if loading recurrence data
   */
  function loadPlasMagDataUsingNumberD3(startFileNumber, endFileNumber, recurrence) {
//    log("loadPlasMagDataUsingNumberD3: startFileNumber " + startFileNumber + " endFileNumber " + endFileNumber + " recurrence " + recurrence);

    if (recurrence) {
      // delete the existing data before loading new
      magDataRecurrence = undefined;
      plasmaDataRecurrence = undefined;
      filteredMagDataRecurrence = undefined;
      filteredPlasmaDataRecurrence = undefined;

      mdatar = undefined;
      pdatar = undefined;
      filteredMdatar = undefined;
      filteredPdatar = undefined;

      // store the file numbers to be fetched
      recurrenceStartNumber = startFileNumber;
      recurrenceEndNumber = endFileNumber;
    } else {
      // delete the existing data before loading new
      magData = undefined;
      plasmaData = undefined;
      filteredMagData = undefined;
      filteredPlasmaData = undefined;

      var count = endFileNumber - startFileNumber + 1;
//      log('loadPlasMagDataUsingNumberD3: count ' + count);

      // the data file start time is computed
      dataStartMoment = computeFileStartFromNumber(visibleIndex(), startFileNumber);
      dataEndMoment = moment.utc(dataStartMoment).add(count * timespans[visibleIndex()], 'minutes');
    }

    // fetch one or more JSON files of each type
    fetchPhaseIIJson(MAG_PREFIX, startFileNumber, endFileNumber, recurrence);
    fetchPhaseIIJson(PLASMA_PREFIX, startFileNumber, endFileNumber, recurrence);
  }

  /**
   * Fetch one or more JSON files of the given type.
   * @param {string} prefix - the JSON file prefix, e.g., 'mag-'
   * @param {number} startNumber - the first Phase II file number
   * @param {number} endNumber - the last Phase II file number
   * @param {boolean} recurrence - true if the data will be used as recurrence
   */
  function fetchPhaseIIJson(prefix, startNumber, endNumber, recurrence) {
//    log("fetchPhaseIIJson: " + prefix + " " + startNumber + " " + endNumber + " recurrence " + recurrence);
    var query;
    var query2;
    var query3;
    var midNumber;

    // prepare to fetch data from the server
    var tag = prepLoad();

    // determine the appropriate callback function
    var callback;
    if (recurrence) {
      switch (prefix) {
        case MAG_PREFIX:
          callback = initialLoadMagMultipleRecurrence;
          break;
        case PLASMA_PREFIX:
          callback = initialLoadPlasmaMultipleRecurrence;
          break;
        case KP_PREFIX:
          callback = initialLoadKpApMultipleRecurrence;
          break;
      }
    } else {
      switch (prefix) {
        case MAG_PREFIX:
          callback = initialLoadMagMultiple;
          break;
        case PLASMA_PREFIX:
          callback = initialLoadPlasmaMultiple;
          break;
        case KP_PREFIX:
          callback = initialLoadKpApMultiple;
          break;
      }
    }

    // how many files will be fetched (max 3)?
    var count = endNumber - startNumber + 1;

    // the common portion of the filename
    var filename = dataServiceUrl + prefix + tag + ".";

    log('fetchPhaseIIJson: filename ' + filename + startNumber + '-' + endNumber + ' count ' + count);

    // one pair?
    if (count === 1) {
      query = filename + startNumber + PHASE_II_FINAL_EXTENSION;
//      log('fetchPhaseIIJson: query ' + query);

      // fetch the pair
      d3_queue.queue()
          .defer(d3_request.json, query)
          .awaitAll(callback);

    } else if (count === 2) {
      // two pairs
      query = filename + startNumber + PHASE_II_FINAL_EXTENSION;
      query2 = filename + endNumber + PHASE_II_FINAL_EXTENSION;
//      log('fetchPhaseIIJson: query ' + query);
//      log('fetchPhaseIIJson: query2 ' + query2);

      // fetch the pair
      d3_queue.queue()
          .defer(d3_request.json, query)
          .defer(d3_request.json, query2)
          .awaitAll(callback);
    } else if (count === 3) {
      // three pairs
      midNumber = startNumber + 1;
      query = filename + startNumber + PHASE_II_FINAL_EXTENSION;
      query2 = filename + midNumber + PHASE_II_FINAL_EXTENSION;
      query3 = filename + endNumber + PHASE_II_FINAL_EXTENSION;
//     log('fetchPhaseIIJson: query ' + query);
//      log('fetchPhaseIIJson: query2 ' + query2);
//      log('fetchPhaseIIJson: query3 ' + query3);

      // fetch the pair
      d3_queue.queue()
          .defer(d3_request.json, query)
          .defer(d3_request.json, query2)
          .defer(d3_request.json, query3)
          .awaitAll(callback);
    }
  }

  /**
   * Execute d3 queue requests to load the Kp-Ap Phase II data sets.
   * @param {number} startFileNumber - the computed number of the first file to load
   * @param {number} endFileNumber - the computed number of the last file to load
   * @param {boolean} recurrence - true if loading recurrence data
   */
  function loadKpApDataUsingNumberD3(startFileNumber, endFileNumber, recurrence) {
//    log("loadKpApDataUsingNumberD3: startFileNumber " + startFileNumber + " endFileNumber " + endFileNumber + " recurrence " + recurrence);

    if (recurrence) {
      // delete the existing recurrence data before loading new
      kpApDataRecurrence = undefined;
      kdatar = undefined;

      // store the file numbers to be fetched
      kpApRecurrenceStartNumber = startFileNumber;
      kpApRecurrenceEndNumber = endFileNumber;
    } else {
      // delete the existing data before loading new
      kpApData = undefined;
      kpApRecurrenceStartNumber = undefined;
      kpApRecurrenceEndNumber = undefined;
    }

    // fetch one or more JSON files of each type
    fetchPhaseIIJson(KP_PREFIX, startFileNumber, endFileNumber, recurrence);
  }

  /**
   * Prepare to load data from the server.
   * @returns {string} - the data tag used to build the filename, e.g., '30-day'
   */
  function prepLoad() {

    // show the loading wheel
    $('#loading_div').show();

    // abort all pending Ajax queries
//    abortQueries();

    // return the data file timespan tag
    return getDataServiceTag();
  }

  /**
   * Create a dummy Mag object to use when there is no data available. This allows the empty plot rectangles to draw correctly.
   *
   * {"success":"true",
     * "bt":{"min":0,"max":0,"data":[["2016-01-12 02:01:00",0]]},
     * "bx_gsm":{"min":0,"max":0,"data":[["2016-01-12 02:01:00",0]]},
     * "by_gsm":{"min":0,"max":0,"data":[["2016-01-12 02:01:00",0]]},
     * "bz_gsm":{"min":0,"max":0,"data":[["2016-01-12 02:01:00",0]]},
     * "lat_gsm":{"min":0,"max":0,"data":[["2016-01-12 02:01:00",0]]},
     * "lon_gsm":{"min":0,"max":0,"data":[["2016-01-12 02:01:00",0]]}}
   *
   * @returns {Object} - the empty data object
   */
  function noMagData() {
//    log("no mag data fetched");

    // create the required column name array
    var names;
    if (isNativeResolutionVisible()) {
      names = [
        "time_tag", "bt", "bx_gsm", "by_gsm", "bz_gsm", "lat_gsm", "lon_gsm", "maneuver", "quality", "source", "active"
      ];
    } else {
      names = [
        "time_tag", "bt_min", "bt_max", "bt", "bx_gsm_min", "bx_gsm_max", "bx_gsm", "by_gsm_min", "by_gsm_max", "by_gsm",
        "bz_gsm_min", "bz_gsm_max", "bz_gsm", "lat_gsm_min", "lat_gsm_max", "lat_gsm", "lon_gsm_min", "lon_gsm_max", "lon_gsm",
        "maneuver", "quality", "source", "active"
      ];
    }

    return noData(names);
  }

  /**
   * Generate a valid but empty plasma data object when there is no data available.
   *
   * {"success":"true",
     * "speed":{"min":0,"max":0,"data":[["2016-01-12 02:01:00",0]]},
     * "density":{"min":0,"max":0,"data":[["2016-01-12 02:01:00",0]]},
     * "temperature":{"min":0,"max":0,"data":[["2016-01-12 02:01:00",0]]}}
   *
   * @returns {Object} - the empty data object
   */
  function noPlasmaData() {
//    log("no plasma data fetched");

    // create the required column name array
    var names;
    if (isNativeResolutionVisible()) {
      names = ["time_tag", "speed", "density", "temperature", "quality", "source", "active"]
    } else {
      names = ["time_tag", "speed_min", "speed_max", "speed", "density_min", "density_max", "density",
        "temperature_min", "temperature_max", "temperature", "quality", "source", "active"]
    }

    return noData(names);
  }

  /**
   * Generate a valid but empty data object when there is no data available.
   * @param {string[]} names - an array of column names
   * @returns {Object} - the empty data object
   */
  function noData(names) {
    var root = {};

    // add the current time to the object
    root.time_tag = moment.utc().format(DATE_FORMAT_FILE);

    // loop through each data column excluding time_tag
    for (var i = 1; i < names.length; i++) {
      // column being built
      var name = names[i];

      // add the name-value pair to the object
      root[name] = 1;
    }
//    log("noData: dummy object " + JSON.stringifyOnce(root));

    return root;
  }

  function isPlasMagDataLoaded() {
    return (magData !== undefined && plasmaData !== undefined);
  }

  /**
   * (d3-specific) Finalize the initial receipt of both the mag and plasma JSON data Phase I data.
   */
  function finalizePlasMagLoad() {
    log("finalizePlasMagLoad: mag len " + magData.length + " plasma len " + plasmaData.length);

    // if drilling down and no data fetched, assume we're at the bottom of drilling down and bounce back up
    if (magData.length == 0 && plasmaData.length == 0 && zoomIndex !== undefined) {
      // no fetched data at this zoom level, try going back up to the next lower resolution file
//      log("initialLoad: no data fetched, trying next higher index " + (zoomIndex + 1));
      zoomReplotOrReload(zoomIndex + 1);
    } else {

      // discard all data before the start to reduce memory usage since it isn't visible
      magData = cutDataBeforeStart(magData, startMoment.toDate());
      plasmaData = cutDataBeforeStart(plasmaData, startMoment.toDate());

      if (magData.length === 0) {
        magData.push(noMagData());
      }

      if (plasmaData.length === 0) {
        plasmaData.push(noPlasmaData());
      } else {
        // clip densities below 0.1
        plasmaData = adjustPlasmaData(plasmaData);
      }

      // create the filtered versions for use throughout
      applyFilters();

      log("finalizePlasMagLoad: mag length " + magData.length + " plasma length " + plasmaData.length);

      // capture the last loaded moment of each type
      lastMagDataMoment = moment.utc(magData[magData.length - 1].time_tag);
      updateLastDataMoment(lastMagDataMoment);

      lastPlasmaDataMoment = moment.utc(plasmaData[plasmaData.length - 1].time_tag);
      updateLastDataMoment(lastPlasmaDataMoment);

      // if all queries are complete, we're done loading the full set of data
      finishLoadData();
    }
  }

  /**
   * (d3-specific) Finalize the initial receipt of both the mag and plasma JSON data Phase I data.
   * @param {Object} error - the query error condition, if any
   * @param {Array} magJsonData - the mag data lines
   * @param {Array} plasmaJsonData - the plasma data lines
   */
  function initialLoad(error, magJsonData, plasmaJsonData) {
    if (error) {
      log("initialLoad: " + JSON.stringify(error));

    } else {
//      log("initialLoad: mag len " + magJsonData.length + " plasma len " + plasmaJsonData.length);

      // get objects with all of the data from the JSON string, make accessible globally
      magData = convertJSONToPlotData(magJsonData, true, visibleResolutionByInstrument(BT_BX_BY_GRAPH), lastMagDataMoment);
      plasmaData = convertJSONToPlotData(plasmaJsonData, true, visibleResolutionByInstrument(DENS_GRAPH), lastPlasmaDataMoment);

      finalizePlasMagLoad();
    }
  }

  /**
   * (d3-specific) Finalize the initial receipt of the mag JSON data Phase II data.
   */
  function finalizeMagLoad() {
//    log("finalizeMagLoad: mag len " + magData.length);

    // if drilling down and no data fetched, assume we're at the bottom of drilling down and bounce back up
    if (magData.length == 0 && zoomIndex !== undefined) {
      // no fetched data at this zoom level, try going back up to the next lower resolution file
//      log("finalizeMagLoad: no data fetched, trying next higher index " + (zoomIndex + 1));
      zoomReplotOrReload(zoomIndex + 1);
    } else {

      // discard all data before the start to reduce memory usage since it isn't visible
      magData = cutDataBeforeStart(magData, startMoment.toDate());

      if (magData.length === 0) {
        magData.push(noMagData());
      }
//      log("finalizeMagLoad: mag length " + magData.length);

      // capture the last loaded moment of each type
      lastMagDataMoment = moment.utc(magData[magData.length - 1].time_tag);
      updateLastDataMoment(lastMagDataMoment);

      // if all queries are complete, we're done loading the full set of data
      finishLoadData();
    }
  }

  /**
   * (d3-specific) Finalize the initial receipt of the plasma JSON data Phase II data.
   */
  function finalizePlasmaLoad() {
//    log("finalizePlasmaLoad: plasma len " + plasmaData.length);

    // if drilling down and no data fetched, assume we're at the bottom of drilling down and bounce back up
    if (plasmaData.length == 0 && zoomIndex !== undefined) {
      // no fetched data at this zoom level, try going back up to the next lower resolution file
//      log("finalizePlasmaLoad: no data fetched, trying next higher index " + (zoomIndex + 1));
      zoomReplotOrReload(zoomIndex + 1);
    } else {

      // discard all data before the start to reduce memory usage since it isn't visible
      plasmaData = cutDataBeforeStart(plasmaData, startMoment.toDate());

      if (plasmaData.length === 0) {
        plasmaData.push(noPlasmaData());
      } else {
        // clip densities below 0.1
        plasmaData = adjustPlasmaData(plasmaData);
      }

//      log("finalizePlasmaLoad: plasma length " + plasmaData.length);

      // capture the last loaded moment of each type
      lastPlasmaDataMoment = moment.utc(plasmaData[plasmaData.length - 1].time_tag);
      updateLastDataMoment(lastPlasmaDataMoment);

//      log("finalizePlasmaLoad:  lastPlasmaDataMoment " + lastPlasmaDataMoment);

      // if all queries are complete, we're done loading the full set of data
      finishLoadData();
    }
  }

  /**
   * (d3-specific) Finalize the initial receipt of the Kp-AP JSON data Phase II data.
   * @param recurrence
   */
  function finalizeKpApLoad(recurrence) {
//    if (recurrence) {
//      log("finalizeKpApLoad: finalizing recurrence, initial kpApDataRecurrence length " + kpApDataRecurrence.length);
//    } else {
//      log("finalizeKpApLoad: finalizing current, initial kpApData length " + kpApData.length);
//    }

    var data = (recurrence) ? kpApDataRecurrence : kpApData;
    var start = (recurrence) ? moment.utc(startMoment).subtract(CARRINGTON_ROTATION_MINUTE, 'minutes') : moment.utc(startMoment);

    // discard all data before the start (less one period) to reduce memory usage since it isn't visible
    data = cutDataBeforeStart(data, moment.utc(start).subtract(3, 'hours').toDate());

//    log("finalizeKpApLoad: recurrence " + recurrence);
//    if (data.length > 0) {
//      log("finalizeKpApLoad: first " + data[0].time_tag);
//      log("finalizeKpApLoad: last  " + data[data.length - 1].time_tag);
//    }

    if (recurrence) {
      // discard all data before the recurrence start to reduce memory usage since it isn't visible
//      kpApDataRecurrence = cutDataBeforeStart(kpApDataRecurrence, start.toDate());

      // mark each record as being recurrence data
      markRecur(data);
    } else {
      // discard all data before the p start to reduce memory usage since it isn't visible
//      kpApData = cutDataBeforeStart(kpApData, start.toDate());

      if (data.length > 0) {
        // capture the last loaded moment
        lastKpApDataMoment = moment.utc(data[data.length - 1].time_tag);
//        log("finalizeKpApLoad: lastKpApDataMoment " + lastKpApDataMoment);
      }
    }

//    if (recurrence) {
//      log("finalizeKpApLoad: finalizing recurrence, final kpApDataRecurrence length " + kpApDataRecurrence.length);
//    } else {
//      log("finalizeKpApLoad: finalizing current, final kpApData length " + kpApData.length);
//    }

    // done, build plots if possible
    finishLoadData();
  }

  /**
   * (d3-specific) Finalize the initial receipt of both the mag and plasma recurrence JSON data Phase II data.
   */
  function finalizeMagLoadRecurrence() {

    // discard all data before the recurrence start to reduce memory usage since it isn't visible
    magDataRecurrence = cutDataBeforeStart(magDataRecurrence, moment.utc(startMoment).subtract(CARRINGTON_ROTATION_MINUTE, 'minutes').toDate());

    if (magDataRecurrence.length === 0) {
      magDataRecurrence.push(noMagData());
    }

    applyFiltersRecurrence();

    // mark each record as being recurrence data
    markRecur(magDataRecurrence);

//    log("finalizeMagLoadRecurrence: mag length " + magDataRecurrence.length);

    // if all queries are complete, we're done loading the full set of data
    finishLoadData();
  }

  /**
   * (d3-specific) Finalize the initial receipt of both the mag and plasma recurrence JSON data Phase II data.
   */
  function finalizePlasmaLoadRecurrence() {
//    log("finalizePlasmaLoadRecurrence: plasma len " + plasmaDataRecurrence.length);

    // discard all data before the recurrence start to reduce memory usage since it isn't visible
    plasmaDataRecurrence = cutDataBeforeStart(plasmaDataRecurrence, moment.utc(startMoment).subtract(CARRINGTON_ROTATION_MINUTE, 'minutes').toDate());

    if (plasmaDataRecurrence.length === 0) {
      plasmaDataRecurrence.push(noPlasmaData());
    } else {
      // clip densities below 0.1
      plasmaDataRecurrence = adjustPlasmaData(plasmaDataRecurrence);
    }

    applyFiltersRecurrence();

    // mark each record as being recurrence data
    markRecur(plasmaDataRecurrence);

//    log("finalizePlasmaLoadRecurrence: plasma length " + plasmaDataRecurrence.length);

    // if all queries are complete, we're done loading the full set of data
    finishLoadData();
  }

  /**
   * When all of the data is initially loaded, build the plots.
   */
  function finishLoadData() {
    if (allDataLoaded()) {
      log('finishLoadData: all data is loaded, redrawing');

      try {
        // append adjusted current to recurrence now, and then on dataUpdate
        if (loadRecurrence()) {
//          if (magDataRecurrence.length > 0) {
//            log("finishLoadData: magDataRecurrence last " + magDataRecurrence[magDataRecurrence.length - 1].time_tag);
//            log("finishLoadData: magData current adjusted last " + moment.utc(magData[magData.length - 1].time_tag).add(CARRINGTON_ROTATION, 'days').toDate());
//          }

          // make a deep copy of the current (non-recurrence) data
          mdatar = JSON.parse(JSON.stringify(magData));
          pdatar = JSON.parse(JSON.stringify(plasmaData));

          // shift it forward and mark as recurrence. This data will be combined with the recurrence data when drawn
          markRecur(mdatar);
          markRecur(pdatar);

          if (kpApData != undefined) {
            kdatar = JSON.parse(JSON.stringify(kpApData));
            markRecur(kdatar);
          }
        }

        // create the filtered version of the PlasMag data for use throughout
        applyFilters();

        if (loadRecurrence()) {

          // create the filtered versions of the PlasMag recurrence data for use throughout
          applyFiltersRecurrence();

          // create the filtered versions of the PlasMag recurrence data for use throughout
          applyFiltersR();
        }

        // update the reporting statistics before building the plots
        getStats();

        // compute the plot start/end dates based on the current system time
        setUpGraphDates();

        // adjust the container size and build the plots after the first data load completes
        if (isFirstDataLoad) {

          // size the outer_div to the viewport and build the plots
          resizeHandler();

          isFirstDataLoad = false;
        } else {
          // set the x_scale domains
          updateXScaleDomains();

          // create the plots
          buildPlots();
        }

        // update current data indicator to show if data is stale or not
        updateCurrentDataIndicator();

//        log("initial fetch + load + build + draw " + timerRead() + "ms for span " + currentSpanHours + " hours");
      } catch (e) {
        log("finishLoadData: exception " + e);
      }

      // take down the loading indicator
      $('#loading_div').hide();
    } else {
      log("finishLoadData: all data not loaded");
    }
  }

  function loadRecurrence() {
    return recurrenceScheme === 'true' && timespans[visibleIndex()] < 365 * 1440;
  }

  function drawRecurrence() {
    return recurrenceScheme === 'true'; // && timespans[visibleIndex()] < 30 * 365 * 1440;
  }

  /**
   * Has all the required data been loaded?
   * @returns {boolean} - true if all data is loaded
   */
  function allDataLoaded() {

    // both mag and plasma are required as the baseline
    var magReady = magData !== undefined;
    var plasmaReady = plasmaData !== undefined;

    var plasmagRecurrenceReady = isDataLoaded(recurrenceScheme, magDataRecurrence) && isDataLoaded(recurrenceScheme, plasmaDataRecurrence);
    var kpApRecurrenceReady = kpApScheme === 'false' || isDataLoaded(recurrenceScheme, kpApDataRecurrence);

    // either recurrence is disabled or all plotted series have recurrence loaded
    var recurrenceReady = !loadRecurrence() || (plasmagRecurrenceReady && kpApRecurrenceReady);
    var kpApReady = isDataLoaded(kpApScheme, kpApData);
    var enlilReady = isDataLoaded(enlilScheme, enlilData);
    var geospaceReady = isDataLoaded(geospaceScheme, geospaceData);
//    log("allDataLoaded: magReady " + magReady + " plasmaReady " + plasmaReady + " recurrenceReady " + recurrenceReady + " kpApReady " + kpApReady +
//        " enlilReady " + enlilReady + " geospaceReady " + geospaceReady);

    var ready = magReady && plasmaReady && recurrenceReady && kpApReady && enlilReady && geospaceReady;
    if (!ready) {
      log("allDataLoaded: magReady " + magReady + " plasmaReady " + plasmaReady + " recurrenceReady " + recurrenceReady + " kpApReady " + kpApReady +
          " enlilReady " + enlilReady + " geospaceReady " + geospaceReady);
    }
    return ready;
  }

  /**
   * Determine if all of the required data has been loaded. Note that some data may not be required, based on user option selections.
   * @param {string} scheme - the optional data scheme (enlilScheme, geospaceScheme, etc)
   * @param {*} data - the optional data to check
   * @returns {boolean} - true if either the data is not needed or the data needs to be loaded and it was
   */
  function isDataLoaded(scheme, data) {
    return scheme !== 'true' || (scheme === 'true' && data !== undefined);
  }

  /**
   * Determine if the optional data is needed, and if so has been loaded and is non-empty.
   * @param {string} scheme - the optional data scheme (enlilScheme, geospaceScheme, etc)
   * @param {*} data - the optional data to check
   * @returns {boolean} - true if the data needs to be loaded and it was and is non-empty
   */
  function isDataPresent(scheme, data) {
    return scheme === 'true' && data !== undefined && data.length > 0;
  }

  /**
   * Load the observed Kp-Ap data.
   * @param {Object} error
   * @param {Array} kpApJsonData - the Kp-Ap data
   */
  function initialLoadKpAp(error, kpApJsonData) {
    if (error) {
      log("initialLoadKpAp: " + JSON.stringify(error));
    } else {
      if (kpApJsonData.length === 0) {
//        log("initialLoadKpAp: no Kp Ap data fetched");
      } else {
//        log("initialLoadKpAp: kp ap data fetched, length " + kpApJsonData.length);
        kpApData = convertJSONToPlotData(kpApJsonData, true, visibleResolutionByInstrument(KPAP_GRAPH), lastKpApDataMoment);
//        log("initialLoadKpAp: converted kp ap " + JSON.stringify(kpApData[0]));
//        log("kp data initial load " + JSON.stringify(kpApData));

        // discard all data before the start (less one period) to reduce memory usage since it isn't visible
        kpApData = cutDataBeforeStart(kpApData, moment.utc(startMoment).subtract(3, 'hours').toDate());
//        log("kp data after cut before start " + JSON.stringify(kpApData));

        // capture the last loaded moment
        if (kpApData.length > 0) {
          lastKpApDataMoment = moment.utc(kpApData[kpApData.length - 1].time_tag);
        }

        // done, build plots if possible
        finishLoadData();
      }
    }
  }

  /**
   * Load the Enlil predicted solar wind data.
   * @param {Object} error
   * @param {Array} data - the Enlil data
   */
  function loadEnlil(error, data) {
    if (error) {
      log("loadEnlil: " + JSON.stringify(error));
    } else {
      if (data.length === 0) {
        log("loadEnlil: no Enlil data fetched");
      } else {
//        log("loadEnlil: enlil data fetched, length " + data.length);
        enlilData = convertJSONToPlotData(data, true, 20 * 365 * 24 * 60 * 60, null);
//        log("loadEnlil: converted enlil " + JSON.stringify(enlilData[0]));

        // done, build plots if possible
        finishLoadData();

        // reload in 5 minutes
        if (enlilScheme === 'true') {
          window.setTimeout(loadEnlilData, FIVE_MINUTES * ONE_SECOND_MS);
        }
      }
    }
  }

  /**
   * Load the Geospace predicted solar wind data.
   * @param {Object} error
   * @param {Array} data - the Geospace data
   */
  function loadGeospace(error, data) {
    if (error) {
      log("loadGeospace: " + JSON.stringify(error));
    } else {
      if (data.length === 0) {
        log("loadGeospace: no geospace data fetched");
      } else {
        geospaceData = convertJSONToPlotData(data, true, 20 * 365 * 24 * 60 * 60, null);

        for (var i = 0; i < geospaceData.length; i++) {
          geospaceData[i].time_tag = geospaceData[i].propagated_time_tag;
        }

        // only keep the prediction, add a small gap before the predicted line
        geospaceData = cutDataBeforeStart(geospaceData, moment.utc(lastDataMoment).toDate());

        // done, build plots if possible
        finishLoadData();

        // reload in 5 minutes
        if (geospaceScheme === 'true') {
          window.setTimeout(loadGeospaceData, FIVE_MINUTES * ONE_SECOND_MS);
        }
      }
    }
  }


  /**
   * Mark each data element in the given array as being recurrence data and shift the time forward by 27 days.
   * @param {Array} data - the data to mark as recurrence data
   */
  function markRecur(data) {
    for (var i = 0; i < data.length; i++) {
      data[i].recurrence = true;
      data[i].time_tag = moment.utc(data[i].time_tag).add(CARRINGTON_ROTATION_MINUTE, 'minutes').toDate();
    }
  }

  /**
   * Adjust the mag data values as needed.
   * @param {Array} data - the array of data points to adjust
   * @returns {Array} - the adjusted data
   */
  function adjustMagData(data) {
    var i;
//    var bins = new Array(360).fill(0);
//    var adjbins = new Array(400).fill(0);
//    var minbins = new Array(360).fill(0);
//    var adjminbins = new Array(400).fill(0);
//    var maxbins = new Array(360).fill(0);
//    var adjmaxbins = new Array(400).fill(0);
//    var floor;

    // the phi plot data is adjusted from 0-360 to 45-405 for readability
    for (i = 0; i < data.length; i++) {
//      floor = Math.floor(data[i].lon_gsm);
//      if (data[i].lon_gsm !== null && !isNaN(data[i].lon_gsm)) {
//        bins[floor]++;
//      }

      data[i].lon_gsm = adjustPhiValue(data[i].lon_gsm);
//      if (data[i].lon_gsm !== null && !isNaN(data[i].lon_gsm)) {
//        floor = Math.floor(data[i].lon_gsm);
//        adjbins[floor]++;
//      }

      if (useBands()) {
//        floor = Math.floor(data[i].lon_gsm_min);
//        if (data[i].lon_gsm_min !== null && !isNaN(data[i].lon_gsm_min)) {
//          minbins[floor]++;
//        }
        data[i].lon_gsm_min = adjustPhiValue(data[i].lon_gsm_min);
//        if (data[i].lon_gsm_min !== null && !isNaN(data[i].lon_gsm_min)) {
//          floor = Math.floor(data[i].lon_gsm_min);
//          adjminbins[floor]++;
//        }

//        floor = Math.floor(data[i].lon_gsm_max);
//        if (data[i].lon_gsm_max !== null && !isNaN(data[i].lon_gsm_max)) {
//          maxbins[floor]++;
//        }
        data[i].lon_gsm_max = adjustPhiValue(data[i].lon_gsm_max);
//        if (data[i].lon_gsm_max !== null && !isNaN(data[i].lon_gsm_max)) {
//          floor = Math.floor(data[i].lon_gsm_max);
//          adjmaxbins[floor]++;
//        }
      }
    }

    return data;
  }

  /**
   * Determine which spacecraft provided the visible data.
   */
  function determineVisibleSource() {
    var sourceCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    var i;

    var start = visibleStart();
    var end = visibleEnd();

    // determine which spacecraft sent the visible data (just look at mag)
    for (i = 0; i < filteredMagData.length; i++) {
      // is this data element in the visible time range and visible based on the current source scheme?
      if (filteredMagData[i].time_tag >= start && filteredMagData[i].time_tag <= end) {
        sourceCount[filteredMagData[i].source]++;
      }
    }

    // set a global variable with the source spacecraft
    if ((sourceCount[SOURCE_ACE] > 0 && sourceCount[SOURCE_DSCOVR] > 0) || sourceCount[SOURCE_MULTIPLE] > 0) {
      visibleSource = SOURCE_MULTIPLE;
    } else if (sourceCount[SOURCE_ACE] > 0) {
      visibleSource = SOURCE_ACE;
    } else {
      visibleSource = SOURCE_DSCOVR;
    }
  }

  /**
   * Adjust the plasma data values as needed.
   * @param {Array} data - the array of data points to adjust
   * @returns {Array} - the adjusted data
   */
  function adjustPlasmaData(data) {
    var i;

    for (i = 0; i < data.length; i++) {
      // clamp densities below 0.1
      data[i].density = limitLow(data[i].density, 0.1);
      data[i].density_min = limitLow(data[i].density_min, 0.1);
      data[i].density_max = limitLow(data[i].density_max, 0.1);

      // clamp temperatures below 5000
      data[i].temperature = limitLow(data[i].temperature, 5000);
      data[i].temperature_min = limitLow(data[i].temperature_min, 5000);
      data[i].temperature_max = limitLow(data[i].temperature_max, 5000);
    }

    return data;
  }

  var count = 0;

  /**
   * (d3-specific) Build the plots using the current data set.
   */
  function buildPlots() {

    // start from scratch by removing svg dom elements
    clearPlots();

    // build the y (value) axes and define the y scales
    // A - Bt+Bz
    // B - Bx+By
    // C - density
    // D - speed
    // E - temp

//      Here are the different ways you can easily manipulate a D3 axis.
//          Without any ticks or tick labels: d3.svg.axis().tickValues([]); No line or text elements are created this way.
//          Without ticks and with tick labels: d3.svg.axis().tickSize(0); ...
//          With ticks and without tick labels: d3.svg.axis().tickFormat("");

    var plotList = getCurrentPlotList();

    // create new arrays for the visible plot y axes
    yAxisLeft = [plotList.length];
    yAxisRight = [plotList.length];

    // build the y axes
    buildYAxes();

    // create a top level element for the plot gridlines
    gridlines = main_graphic.append("g").attr("class", "gridlines");

    // create an SVG element for each series, not each plot
    // it is possible to draw one series on top of the other, as the backgrounds are transparent by default
    var seriesCount = 0;
    for (var i = 0; i < plotList.length; i++) {
      // the plot we are working on
      var plt = plotList[i];

      // build the grid lines before the series, so they will appear underneath
      buildGridlines(boxDimensions[i], plt);

      // the series this plot shows
      var seriesList = SERIES_LISTS[plt];

      // create a top-level DOM element for each series and set the visibility, which will be used later to toggle
      for (var k = 0; k < seriesList.length; k++) {
        seriesD3[seriesCount] = main_graphic.append('g').attr("class", "series-" + SERIES_NAMES[seriesList[k]]).attr("visibility", "visible");
        seriesCount++;
      }
    }

    // build the flag indicator strip box
    buildFlagBox();

    // draw the series and bands over the plot boxes and grid lines
    reRenderSeries();

    // build the plot boxes and axes
    buildPlotBoxes();
  }

  /**
   * Draw the major gridlines.
   * @param {Object} box - the box containing this plot on the page
   * @param {number} plotNum - the index into the plots array
   */
  function buildGridlines(box, plotNum) {

    // create a top-level element for the gridlines for this plot
    // offset by half a pixel and use scale.rangeRound to get thin, crisp gridlines
    var gl = gridlines.append("g").attr("class", "gridlines"); //.attr("transform", "translate(0.5,0.5)");

    // create a background rectangle behind each plot. SVG elements have transparent backgrounds, which is fine except for when we need to change just the
    // surrounding non-plot background to red to show a data outage
    gl.append("rect")
        .attr("class", "plot_background_rect")
        .attr("y", box.y1)
        .attr("width", plt_width)
        .attr("height", plt_height)
        .attr("fill", getPlotBackgroundColor());

    // adjust the sub-pixel width gridline color, which varies by browser
    var color = getLineColor();

    //   if (plotNum === KPAP_GRAPH) {

    // determine gridline color for each page background color and browser, 000 is black, FFF is white
    if (colorScheme === WHITE_SCHEME) {
      color = isFirefox() ? "#CCC" : "#EEE";
    } else {
      color = isFirefox() ? "#999" : "#888";
    }

    // draw the major gridlines as faint lines
    gl.selectAll("gridline")
        .data(yGridlines[plotNum])
        .enter()
        .append("line")
        .attr("x1", 0)
        .attr("x2", plt_width - 1)
        .attr("y1", function (d) {
          return yScales[plotNum](d)
        })
        .attr("y2", function (d) {
          return yScales[plotNum](d)
        })
        .attr("fill", "none")
        .attr("stroke", function (d) {
          var finalColor = color;

          // B plot zero line is brighter than the other grid lines
          if (isBZero(plotNum, d)) {
            if (colorScheme === WHITE_SCHEME) {
              finalColor = "#666";
            } else {
              finalColor = "#CCC";
            }
          }
          return finalColor;
        })
        .attr("stroke-width", function (d) {
          return (isBZero(plotNum, d)) ? 1 : 0.5; // sub-pixel gridlines
        });

//    } else {
//      // draw the major gridlines
//      gl.selectAll("gridline")
//          .data(yGridlines[plotNum])
//          .enter()
//          .append("line")
//          .attr("x1", 0)
//          .attr("x2", plt_width - 1)
//          .attr("y1", function (d) {
//            return yScales[plotNum](d);
//          })
//          .attr("y2", function (d) {
//            return yScales[plotNum](d);
//          })
//          .attr("fill", "none")
//          .attr("stroke", getLineColor())
//          .attr("shape-rendering", "crispEdges")
//          .attr("stroke-dasharray", ("10, 10"));
//    }
  }

  /**
   * Is this line the Mag B zero line?
   *
   * @param plotNum the plot number
   * @param d the y value
   * @returns {boolean} true if this is the zero grid line
   */
  function isBZero(plotNum, d) {
    return (plotNum === BT_BZ_GRAPH && d === 0);
  }

  /**
   * Build the box that shows the flags associated with the plotted values.
   */
  function buildFlagBox() {

    // define a top level SVG element to contain all of the axes and border elements
    flagBox = main_graphic.append('g').attr('class', 'flag-box');

    // y1 = top, y0 = bottom
    var y1 = box_guide.y1;
    var y0 = y1 + FLAG_HEIGHT;

    // create the flag description labels directly below the flag strips
    var x = 50;
    y0 = y1 + FLAG_GAP + (FLAG_LINES * (FLAG_LINE_WIDTH + FLAG_GAP));

    // tweak the y value slightly to look ok on both Chrome and FF
    y0 += 3;
    if (isFirefox()) {
      y0 += 1;
    } else if (isMSIE()) {
      y0 += 4;
    }

    var fontSize = (FLAG_FONT_SIZE - 1) / 11 + "em";

    flagBox.append("text")
        .attr("class", "source-label")
        .text("DSCOVR")
        .attr("x", x)
        .attr("fill", colorScheme === WHITE_SCHEME ? DARK_BLUE : BLUE);

    flagBox.append("text")
        .attr("class", "source-label")
        .text("ACE")
        .attr("x", x + 49)
        .attr("fill", GREEN);

    flagBox.append("text")
        .attr("class", "source-label")
        .text("ACE+DSCOVR")
        .attr("x", x + 75)
        .attr("fill", MAGENTA);

    flagBox.append("text")
        .text("error")
        .attr("x", x + 170)
        .attr("fill", RED);

    flagBox.append("text")
        .text("suspect")
        .attr("x", x + 200)
        .attr("fill", (colorScheme === WHITE_SCHEME) ? DARK_YELLOW : YELLOW);

    flagBox.append("text")
        .text("density < 1")
        .attr("x", x + 270)
        .attr("fill", ORANGE);

//    flagBox.append("text")
//        .text("maneuver")
//        .attr("x", x + 330)
//        .attr("fill", PURPLE) // getFlagColor(name);

    // set all common text attributes
    // tweak the y value slightly to look ok on both Chrome and FF
    flagBox.selectAll('text')
        .attr("y", y0)
        .attr("stroke", "none")
        .attr('font-size', fontSize)
        .attr("text-anchor", "start")
        .attr("dominant-baseline", "central");

    // draw a box around the flag lines and labels
    flagBox.append("rect")
        .attr("class", "flag_rect")
        .attr("y", y1)
        .attr("width", plt_width)
        .attr("height", FLAG_HEIGHT)
        .attr("fill", "none")
        .attr("stroke", getLineColor())
        .attr("shape-rendering", "crispEdges");

    if (flagScheme !== 'true') {
      flagBox.attr('visibility', 'hidden');
    }
  }

  /**
   * Build the box that shows how far the plots are zoomed in. This box always shows the full timespan.
   */
  function buildZoomBox() {

    // define a top level SVG element to contain all of the axes and border elements
    zoomBox = main_graphic.append('g').attr('class', 'zoom');

    // draw all axes and tick lines the same color depending on the page color scheme
    var lineColor = getLineColor();

    // the zoom box is under the flag strips and date ticks
    var dateTickHeight = 2 + 11 + 2;
    var y1 = box_guide.y1 + getFlagHeight() + dateTickHeight;
    var y0 = y1 + ZOOM_HEIGHT;

    // the y axis scale is simple, the line will be drawn in the middle at zero
    zoomBoxYScale = d3.time.scale.utc().range([y0, y1]);
    zoomBoxYScale.domain([-1, 1]);

    // create the data presence bar
    buildZoomDataPresenceLine();

    // upper axis is zoomed dates: computeDateTicks(ZOOM_DATE_TICKS), determineTimeFormat(true)
    // lower axis is full timespan dates: computeDateTicks(TIMESPAN_DATE_TICKS), determineTimeFormat(false)

    // create the axis to use as the left and right borders, no ticks
    var yAxis = d3.svg.axis().scale(zoomBoxYScale).orient("left").tickSize(0).tickFormat('');

    // create the border and date ticks
    zoomBox.append("g")
        .attr("class", "y axis")
        .attr("id", "zoomLeft")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .call(yAxis);

    zoomBox.append("g")
        .attr("class", "y axis")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(" + plt_width + ",0)")
        .call(yAxis);

    // define the d3 data domain for the full timespan
    var axisTopEdge = d3.svg.axis().scale(x_scale_timespan).tickSize(0).tickFormat('');

    // the top border with no ticks
    zoomBox.append("g")
        .attr("class", "x axis")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(0," + y1 + ")")
        .call(axisTopEdge);

    // the bottom border has the date ticks
    var format = determineTimeFormat(false);
    var axisDate = d3.svg.axis().scale(x_scale_timespan).orient("bottom").tickSize(3).ticks(format.unit, format.count).tickFormat(d3.time.format.utc(format.format));

    // the bottom border, with ticks facing downwards
    zoomBox.append("g")
        .attr("class", "x axis")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(0," + y0 + ")")
        .call(axisDate);

    // create a separate axis for the minor ticks
    var minorTickAxis = d3.svg.axis().scale(x_scale_timespan).orient("bottom").tickSize(2).ticks(format.minorUnit, format.minorCount).tickFormat('');

    // overlay the minor ticks on the bottom border, with ticks facing downwards
    zoomBox.append("g")
        .attr("class", "x axis")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(0," + y0 + ")")
        .call(minorTickAxis);

    // create the timespan start date description label
    var x = -(margin_left / 2) - 4;
    zoomBox.append("text")
        .attr('class', 'timespan-start')
        .text(timespanStartDateLabel);

    // create the timespan start time description label underneath the time label
    zoomBox.append("text")
        .attr('class', 'timespan-start')
        .text(timespanStartTimeLabel)
        .attr("dy", "1.0em");


    // set the font size of all of the axis labels and set to normal weight (drawn using fill only, no outline)
    zoomBox.selectAll('text').attr('font-size', '0.82em').attr("fill", getLabelColor()).attr("stroke", "none");

    // then override the font size of the start date/time labels and set their common attributes
    zoomBox.selectAll('.timespan-start').attr('font-size', '0.72em').attr("x", x).attr("y", y0).attr("text-anchor", "middle");

    // build the shaded drag rectangles for the zoombox
    buildZoomDragBox();
  }

  /**
   * Build the data presence line within the zoom box.
   */
  function buildZoomDataPresenceLine() {

    // the first and last non-null data points which define the data presence bar
    var first;
    var last;

    try {
      // are we zoomed in?
      if (saveFirstDataMoment === undefined) {

        // determine the start/end dates of the actual data (if any)
        if (filteredMagData.length > 0 || filteredPlasmaData.length > 0) {
          first = getFirstNonNullDataMomentD3(false);

          // clip to the left edge of the plot
          if (first.isBefore(startMoment)) {
            first = moment.utc(startMoment);
          }
          last = getLastNonNullDataMomentD3(false);
        } else {
          // if no data, use the whole plot
          first = moment.utc(startMoment);
          last = moment.utc(endMoment);
        }
      } else {
        // if zoomed in to a higher-resolution, continue to show the zoom against the current (original) timespan
        first = moment.utc(saveFirstDataMoment);
        last = moment.utc(saveLastDataMoment);
      }

      // will plot a straight line to show the data range in the zoom box as an aid ot the user
      var data = [
        [first, 0],
        [last, 0]
      ];

      // delete the old line, if present
      zoomBox.selectAll(".zoomDataPresenceLine").remove();

      var dataPresenceLine = d3.svg.line()
          .x(function (d) {
            return x_scale_timespan(d[0]);
          })
          .y(function (d) {
            return zoomBoxYScale(d[1]);
          });

      // draw the line
      zoomBox.append('path')
          .attr('class', 'zoomDataPresenceLine')
          .attr("clip-path", "url(#plot_clip)")
          .attr('d', dataPresenceLine(data))
          .attr('stroke', ZOOM_BOX_LINE_COLOR)
          .attr('stroke-width', DATA_PRESENCE_LINE_WIDTH)
          .attr("shape-rendering", "crispEdges")
          .attr('fill', 'none');
    } catch (e) {
      log("ERROR building zoom data presence line " + JSON.stringify(e));
    }
  }

  /**
   * Clear the d3 plot boxes and series
   */
  function clearPlots() {
    var i;

    // TODO simplify be using a top-level element
    // clear the series data plots (markers/lines/bands)
    for (i = 0; i < seriesD3.length; i++) {
      seriesD3[i].remove();
    }

    // clear the gridlines
    if (gridlines !== undefined) {
      gridlines.remove();
    }

    // clear the plot boxes and legends
    if (boxes !== undefined) {
      boxes.remove();
    }

    if (flagBox !== undefined) {
      flagBox.remove();
    }

    // clear the zoom box
    if (zoomBox !== undefined) {
      zoomBox.remove();
    }

    // clear the hover readout overlay
    if (focus !== undefined) {
      focus.remove();
    }

    // clear the zoom drag box
    if (dragbox !== undefined) {
      dragbox.remove();
    }

    // clear the zoom drag box
    if (zoomdragbox !== undefined) {
      zoomdragbox.remove();
    }

    // clear the mouse overlay
    main_graphic.selectAll(".overlay").remove();
  }

  /**
   * (d3-specific) Draw the plot boxes and axes.
   */
  function buildPlotBoxes() {

    var plt;

    // define a top level SVG element to contain all of the axes and border elements
    boxes = main_graphic.append('g').attr('class', 'boxes');

    // create the groups for the left and right axes
    xaxis_E_grp = boxes.append('g').attr('class', 'dateaxis-group');

    // build the visible plot axes and borders
    var scheme = "Mag + Solar Wind";
    var box;
    var i;
    var plotList = getCurrentPlotList();

    for (i = 0; i < plotList.length; i++) {
      // the plot we are working on
      plt = plotList[i];

      // lowest plot on the page?
      var lowestPlotOnPage = (i === plotList.length - 1);

      box = boxDimensions[i];
      buildPlotBox(yAxisLeft[i], yAxisRight[i], box.y0, box.y1, lowestPlotOnPage);
    }

    scheme = (seriesScheme === MAG_SCHEME) ? "Mag" : scheme;
    scheme = (seriesScheme === SOLAR_WIND_SCHEME) ? "Solar Wind" : scheme;

    // build the header above the plots
    buildHeader(scheme);

    // now make all of the axis labels just created to be normal weight (drawn using fill only, no outline)
    boxes.selectAll("text").attr("fill", getLabelColor()).attr("stroke", "none");

    // build the legends to the left of the plots
    buildLegends();

    // draw the zoom controller
    buildZoomBox();

    // build a sliding plot overlay for displaying the elements which track the mouse such as the cursor line and hover readouts
    buildMouseOverlay();

    // toggle the series on or off as needed after legends and mouse overlay are built
    setSeriesVisibility();

    // build the zoom rectangles for the plots
    buildDragBox();

    // handle capturing mouse events - do this last, so that the mouse events are associated with the last DOM element!
    captureMouseMovement();
  }

  /**
   * Set the visibility of each series, including the legend and cursor dot, according to the last known value. This is needed since DOM state is lost when the
   * plots are rebuilt.
   */
  function setSeriesVisibility() {
    var i;
    var k;
    var plt;
    var name;
    var legend;
    var legendRecur;
    var cursorDot;
    var cursorDotRecur;
    var series;
    var seriesRecur;
    var seriesList;
    var state;
    var plotList = getCurrentPlotList();

    // for each plot
    for (i = 0; i < plotList.length; i++) {

      // the plot we are working on
      plt = plotList[i];

      // the series this plot shows
      seriesList = SERIES_LISTS[plt];

      // create a dot for each series to track the cursor as it moves
      for (k = 0; k < seriesList.length; k++) {
        name = SERIES_NAMES[seriesList[k]];

        // select the legend
        legend = legendBox.selectAll('#text_' + plt + '_' + k + '_' + name);

        // select the cursor dot
        cursorDot = focus.selectAll('#circle_' + plt + '_' + k + '_' + name);

        // select the series container
        series = main_graphic.selectAll(".series-" + name);

        // select the recurrence counterparts
        if (drawRecurrence()) {
          legendRecur = legendBox.selectAll('#text_' + plt + '_' + k + '_' + name + '_recur');
          cursorDotRecur = focus.selectAll('#circle_' + plt + '_' + k + '_' + name + '_recur');
          seriesRecur = main_graphic.selectAll(".series-" + name + '_recur');
        }

        // determine the current visibility of the series
        state = SERIES_VISIBLE[plt][k];

        // set the visibility
        if (state) {
          series.attr("visibility", "visible");
          cursorDot.attr("visibility", "visible");
          legend.attr("text-decoration", "none");

          if (drawRecurrence()) {
            seriesRecur.attr("visibility", "visible");
            cursorDotRecur.attr("visibility", "visible");
            legendRecur.attr("text-decoration", "none");
          }
        } else {
          series.attr("visibility", "hidden");
          cursorDot.attr("visibility", "hidden");
          legend.attr("text-decoration", "line-through");

          if (drawRecurrence()) {
            seriesRecur.attr("visibility", "hidden");
            cursorDotRecur.attr("visibility", "hidden");
            legendRecur.attr("text-decoration", "line-through");
          }
        }
      }
    }
  }

  /**
   * Build the header above the plots.
   * @param {String} scheme - the series scheme description
   */
  function buildHeader(scheme) {

    // create the SWPC info description label
    boxes.append("text")
        .attr("class", "date_ranges")
        .text(infoLabel)
      // 0 is the plot left edge...
        .attr("x", -margin_left + 1)
        .attr("y", 12);

    // create the start date description label
    boxes.append("text")
        .attr("class", "date_ranges")
        .text(startDateLabel)
        .attr("x", 0)
        .attr("y", margin_top - 20);

    // create the resolution description label
    boxes.append("text")
        .attr("class", "date_ranges report_label")
        .text(resolutionLabel)
        .attr("x", plt_width / 2)
        .attr("y", margin_top - 20)
        .attr("text-anchor", "middle");

    // create the report bottom line label
    boxes.append("text")
        .attr("class", "date_ranges report_label")
        .text(reportBLabel)
        .attr("x", plt_width / 2)
        .attr("y", margin_top - 5)
        .attr("text-anchor", "middle");

    // showing the reports in the header?
    if (isSwfo() && currentSpanHours == 24) {

      // position the report to the right of the start date
      var x = isSmallScreen ? 120 : 140;
      boxes.selectAll('.report_label')
          .attr("x", x)
          .attr("text-anchor", "start");
    }

    // create the end date description label
    boxes.append("text")
        .attr("class", "date_ranges")
        .text(endDateLabel)
        .attr("x", plt_width)
        .attr("y", margin_top - 20)
        .attr("text-anchor", "end");

    // create the scheme description label, ie. "Mag + Solar Wind"
    boxes.append("text")
        .attr("class", "date_ranges")
        .text(scheme)
        .attr("x", 0)
        .attr("y", margin_top - 5);

    // create the source description label, ie. "ACE+DSCOVR"
    var prefix = (sourceScheme === ACTIVE_SCHEME) ? "[Active] " : "";
    boxes.append("text")
        .attr("class", "date_ranges")
        .text(prefix + sourceSpacecraft[visibleSource] +
            (drawRecurrence() ? "+Recurrence" : '') +
            ((enlilScheme === 'true') ? "+WSA-Enlil" : '') +
            ((geospaceScheme === 'true') ? "+Geospace" : ''))
        .attr("x", plt_width)
        .attr("y", margin_top - 5)
        .attr("text-anchor", "end");
  }

  /**
   * Build a sliding plot overlay for displaying the elements which track the mouse such as the cursor line and hover readouts.
   */
  function buildMouseOverlay() {

    // begin set up for mouse events
    focus = main_graphic.append("g").attr("class", "focus").attr("display", "none");

    var plotList = getCurrentPlotList();

    // define the plot y scales
    for (var i = 0; i < plotList.length; i++) {

      // the plot we are working on
      var plt = plotList[i];

      // add a vertical cursor line over each plot
      buildCursorLine(yScales[plt]);

      // the series this plot shows
      var seriesList = SERIES_LISTS[plt];

      var name;
      var color;

      // create a dot for each series to track the cursor as it moves
      for (var k = 0; k < seriesList.length; k++) {
        name = SERIES_NAMES[seriesList[k]];
        // Ap is a special case since it's plotted as text
        if (name !== 'ap') {
          color = getColors(plt)[k];

          // cursor dot for recurrence data, draw first so that it will be underneath the current dot if they overlap
          if (drawRecurrence()) {
            focus.append('circle')
                .attr('id', 'circle_' + plt + '_' + k + '_' + name + '_recur')
                .attr('r', 3.0)
                .attr('stroke', GRAY)
                .attr('fill', GRAY)
                .attr('fill-opacity', 0.5);
          }

          // cursor dot for current data
          focus.append('circle')
              .attr('id', 'circle_' + plt + '_' + k + '_' + name)
              .attr('r', 3.0)
              .attr('stroke', color)
              .attr('fill', color)
              .attr('fill-opacity', 0.5);
        }
      }
    }

    // set up the hover readout display panes last, so they will be drawn on top
    buildHoverReadouts();
  }

  /**
   * (d3-specific) Build the plot box, with one Y axis and the rest plain borders with ticks, unless showing the date axis.
   * @param {Object} yAxisLeft - the left y axis
   * @param {Object} yAxisRight - the right y axis
   * @param {number} y0 - the plot bottom y coordinate
   * @param {number} y1 - the plot top y coordinate
   * @param {boolean} showDateAxis - show the date axis
   */
  function buildPlotBox(yAxisLeft, yAxisRight, y0, y1, showDateAxis) {

    // draw all axes and tick lines the same color depending on the page color scheme
    var lineColor = getLineColor();

    //      Here are the different ways you can easily manipulate a D3 axis.
//          Without any ticks or tick labels: d3.svg.axis().tickValues([]); No line or text elements are created this way.
//          Without ticks and with tick labels: d3.svg.axis().tickSize(0); ...
//          With ticks and without tick labels: d3.svg.axis().tickFormat('');

    // get the tick label format and major/minor tick spacing
    var format = determineTimeFormat(true);

    // the plot date axis tick marks, these date ticks may be zoomed
    var axisTop = d3.svg.axis().scale(x_scale).orient("bottom").tickSize(10).ticks(format.unit, format.count).tickFormat('');
    var axisTopMinor = d3.svg.axis().scale(x_scale).orient("bottom").tickSize(5).ticks(format.minorUnit, format.minorCount).tickFormat('');

    var axisBottom = d3.svg.axis().scale(x_scale).orient("top").tickSize(10).ticks(format.unit, format.count).tickFormat('');
    var axisBottomMinor = d3.svg.axis().scale(x_scale).orient("top").tickSize(5).ticks(format.minorUnit, format.minorCount).tickFormat('');

    boxes.append("g")
        .attr("class", "box-border")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .call(yAxisLeft);

    boxes.append("g")
        .attr("class", "box-border")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(" + (plt_width - 1) + ",0)")
        .call(yAxisRight);

    // the top border, with major/minor ticks facing down
    boxes.append("g")
        .attr("class", "box-border")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(0," + y1 + ")")
        .call(axisTop);

    boxes.append("g")
        .attr("class", "box-border")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(0," + y1 + ")")
        .call(axisTopMinor);

    // the bottom border, with major/minor ticks facing up
    boxes.append("g")
        .attr("class", "box-border")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(0," + y0 + ")")
        .call(axisBottom);

    boxes.append("g")
        .attr("class", "box-border")
        .attr("fill", "none")
        .attr("stroke", lineColor)
        .attr("shape-rendering", "crispEdges")
        .attr("transform", "translate(0," + y0 + ")")
        .call(axisBottomMinor);

    if (showDateAxis) {
      // add a date axis below the flags, which are below the bottom plot

      // now the date labels drawn under the flag strips
      y0 += getFlagHeight();
      var axisDate = d3.svg.axis().scale(x_scale).tickSize(2).ticks(format.unit, format.count).tickFormat(d3.time.format.utc(format.format));
      var minorTickAxis = d3.svg.axis().scale(x_scale).orient("bottom").tickSize(2).ticks(format.minorUnit, format.minorCount).tickFormat('');

      // create the zoom date axis units labels above the data presence line
      boxes.append("g")
          .attr("class", "date-axis")
          .attr("fill", "none")
          .attr("stroke", "none")
          .attr("shape-rendering", "crispEdges")
          .attr("alignment-baseline", "hanging")
          .attr("transform", "translate(0," + y0 + ")")
          .call(axisDate);

      // overlay the minor ticks on the bottom border, with ticks facing downwards
      boxes.append("g")
          .attr("class", "x axis")
          .attr("fill", "none")
          .attr("stroke", lineColor)
          .attr("shape-rendering", "crispEdges")
          .attr("transform", "translate(0," + y0 + ")")
          .call(minorTickAxis);

      // the zoom date axis units label off to the left, allow for wide date text
      var x = -17;
      boxes.append("text")
          .text(zoomIntervalSizeLabel)
          .attr("id", "zoom_units")
          .attr("x", -margin_left + 2)
          .attr("y", y0 + ZOOM_HEIGHT + 4)
          .attr("fill", getLabelColor())
          .attr("stroke", "none")
          .attr("text-anchor", "start");
    }

    // set the font size of all of the axis labels
    // Important! the browser determines the conversion ratio between points and pixels, and they may not be identical between browsers or even between
    // browser releases. Chrome updated underneath me and all my axis labels got smaller by about 1/3
    boxes.selectAll('text').attr('font-size', '0.82em');
  }

  /**
   * (d3-specific) Build the legends for each series to the left of the plots.
   */
  function buildLegends() {
    var i;
    var box;
    var plt;
    var name;
    var legend;
    var color;
    var y;

    // start fresh
    if (legendBox !== undefined) {
      legendBox.remove();
    }

    // define a top level SVG element to contain all of the axes and border elements
    legendBox = main_graphic.append('g').attr('class', 'legends');

    var plotList = getCurrentPlotList();

    // for each plot
    for (i = 0; i < plotList.length; i++) {
      box = boxDimensions[i];

      // the plot we are working on
      plt = plotList[i];

      // the series this plot shows
      var seriesList = SERIES_LISTS[plt];

      var legendLabels = (isSwfo()) ? SERIES_LEGENDS_SWFO[plt] : SERIES_LEGENDS[plt];

      // only one series?
      if (seriesList.length === 1) {
        name = SERIES_NAMES[seriesList[0]];
        legend = legendLabels[0];
        color = getColors(plt)[0];

        // center the rotated legend vertically on the plot
        y = box.y0 - (plt_height / 2);

        buildLegend('text_' + plt + '_0_' + name, color, y, legend, 'middle', seriesList.length, 0);
      } else {
        // multiple series, handle laying out multiple legends
        buildLegendGroup(box, plt, seriesList, legendLabels);
      }
    }
  }

  /**
   * Build the legends for a given plot, handling multiple legends on one or two lines.
   * @param {Object} box - the box containing this plot on the page
   * @param {number} plt - the index into the plots array
   * @param {Array} seriesList - the data series this plot shows
   * @param {Array} legendLabels - the legend label strings
   */
  function buildLegendGroup(box, plt, seriesList, legendLabels) {
    var name;
    var legend;
    var color;
    var combinedWidth;
    var y = [];
    var k;
    var i;
    var index;
    var line;

    // compute the vertical center of the plot box
    var plotCenter = box.y0 - (plt_height / 2);

    // get the width of each legend in pixels
    var textWidths = computeLegendWidths(legendLabels);

    // at present, no plots have more than 4 series; if 1-3, put all legends on one line, if 4, split into two lines with 2 legends each
    if (seriesList.length === 4) {
      // split into two lines (series 0-1 and 2-3)
      for (i = 0; i < 2; i++) {
        index = i * 2;
        combinedWidth = textWidths[index] + textWidths[index + 1];

        // start at the bottom (after rotation) of the combined legends that make up this line
        y[i] = plotCenter + (combinedWidth / 2);
      }
    } else {
      // all on one line
      combinedWidth = 0;
      for (k = 0; k < legendLabels.length; k++) {
        combinedWidth += textWidths[k];
      }

      // start at the bottom (after rotation) of the combined legends
      y[0] = plotCenter + (combinedWidth / 2);
    }

    // create the legend for each series
    for (k = 0; k < seriesList.length; k++) {
      name = SERIES_NAMES[seriesList[k]];
      legend = legendLabels[k];
      color = getColors(plt)[k];

      // is this the second or first line?
      line = (seriesList.length === 4 && k > 1) ? 1 : 0;

      // build the legend
      buildLegend('text_' + plt + '_' + k + '_' + name, color, y[line], legend, 'start', seriesList.length, line);

      // shift the y to the top (after rotation) of this legend text to get ready for the next one
      y[line] -= textWidths[k];
    }
  }

  /**
   * Compute the combined width of the legend line.
   * @param {Array} legendLabels - the legend label strings
   * @returns {Array} the legend widths, in pixels
   */
  function computeLegendWidths(legendLabels) {

    // multiple series, compute the y coordinate for each legend
    var textWidths = [];

    // temporarily create a dummy node in order to fetch the width
    legendBox.append('g').selectAll('.dummyText')
        .data(legendLabels)
        .enter()
        .append('text')
        .attr("font-family", "Courier monospace")
        .attr("font-size", "0.9em")
        .attr("x", -1000)
        .text(function (d) {
          return d;
        })
        .each(function () {
          // get the width of the rendered bounding box
          var thisWidth = this.getBBox().width;
          textWidths.push(thisWidth);
          // done, remove it from the DOM
//          this.remove();
        });

    for (var k = 0; k < legendLabels.length; k++) {
      // hack to add a space between each legend, since getComputedTextLength apparently ignores trailing spaces!
      textWidths[k] += (k < legendLabels.length - 1) ? 8 : 0;
    }

    return textWidths;
  }

  /**
   * (d3-specific) Build an individual series legend to the left side of the plot, rotated 90 degrees.
   * @param {String} id - the element id
   * @param {String} color - the text color
   * @param {number} yTranslate - the number of pixels of y translation before rotation
   * @param {String} label - the legend text
   * @param {String} anchor - the text anchor style (start/middle/end)
   * @param {number} seriesCount - the number of series shown on this plot
   * @param {number} line - the legend line number (0 or 1)
   */
  function buildLegend(id, color, yTranslate, label, anchor, seriesCount, line) {

    // adjust the legend position to accommodate multiple lines
    var x = -margin_left + 30 + (line * 14);

    legendBox.append("text")
        .attr("class", "legend-text")
        .attr("id", id)
        .attr("font-family", "Courier monospace")
        .attr("font-size", "0.9em")
        .attr("fill", color)
        .attr("transform", "translate(" + x + "," + yTranslate + ")rotate(-90)")
        .attr("dy", "-1.0em")
        .attr("text-anchor", anchor)
        .text(label);

    // if there are multiple series, enable toggling of each series by clicking on the legend
    if (seriesCount > 1) {
      // select the legend
      var legend = legendBox.selectAll("#" + id);

      legend.on("click", function () {

        // toggle the series visibility
        toggleSeries(id);
      });
    }
  }

  /**
   * Toggle the series visibility.
   * @param {string} id - the series id
   */
  function toggleSeries(id) {

    // select the legend
    var legend = legendBox.selectAll("#" + id);

    // parse the plot number, series number, and name from the id - example id: text_3_0_bx_gsm
    var plotNum = id.substring(5, 6);
    var seriesNum = id.substring(7, 8);
    var name = id.substring(9);

    var cursorDot = focus.selectAll('#circle_' + plotNum + '_' + seriesNum + '_' + name);

    // select the series container
    var series = main_graphic.selectAll(".series-" + name);

    // determine the current visibility of the series
    var state = (series.attr("visibility") === "visible");

    // toggle the visibility
    if (state) {
      series.attr("visibility", "hidden");
      cursorDot.attr("visibility", "hidden");
      legend.attr("text-decoration", "line-through");
    } else {
      series.attr("visibility", "visible");
      cursorDot.attr("visibility", "visible");
      legend.attr("text-decoration", "none");
    }

    // update the visibility state
    SERIES_VISIBLE[plotNum][seriesNum] = !state;

//    // delete and then rebuild the hover readout and cursor dot overlay
//    if (focus !== undefined) {
//      focus.remove();
//    }
//    // TODO switch to buildHoverReadouts()
//    buildMouseOverlay();
//    captureMouseMovement();

    // TODO calling buildPlots is too slow, work on only recomputing the plot extent for the affected plot
//      buildPlots();
  }

  /**
   * Build the hover readouts.
   */
  function buildHoverReadouts() {

    // create a container for the readouts which will be flipped to either side of the cursor line as the cursor moves to the left or right of the plot
    focus.append("svg")
        .attr("class", "g_hover_readout_container")
        .attr("id", "hover_readout_container");

    // set up the hover readout display panes
    var textColor = (colorScheme === WHITE_SCHEME) ? '#444444' : '#dddddd';
    var backgroundColor = (colorScheme === WHITE_SCHEME) ? '#e4e4e4' : '#333333';
    var borderColor = getBorderColor();

    // hover readouts background + text label, larger y values are lower on the screen

    // timestamp readout
    buildHoverReadoutTimestamp('readout_time', backgroundColor, borderColor, textColor);

    var plotList = getCurrentPlotList();

    // for each plot box
    for (var i = 0; i < plotList.length; i++) {

      // the plot we are working on
      var plt = plotList[i];

      var colorList = getColors(plt);
      var seriesVisible = SERIES_VISIBLE[plt];

      // readout for recurrence values
      if (drawRecurrence()) {
        // recurrence box border is gray (outer_div pt size + 5)
        buildHoverReadoutBox('readout_' + i + '_recur', boxDimensions[i].y1 + 16, backgroundColor, GRAY);
        buildHoverReadoutText('readout_' + i + '_recur', boxDimensions[i].y1 + 16, colorList, seriesVisible);
      }

      // want to use series color for each value; single box contains separate text field for each series
      buildHoverReadoutBox('readout_' + i, boxDimensions[i].y1, backgroundColor, colorList[0]);
      buildHoverReadoutText('readout_' + i, boxDimensions[i].y1, colorList, seriesVisible);
    }
  }

  /**
   * Build a hover readout box. The box border is the color of the first series, or gray if recurrence.
   * @param {String} id - the element id
   * @param {number} y - the y coordinate
   * @param {String} backgroundColor - the background color
   * @param {String} borderColor - the border color
   */
  function buildHoverReadoutBox(id, y, backgroundColor, borderColor) {
    var container = focus.selectAll('.g_hover_readout_container');

    // create parent graphic element that will hold the box and text fields for this readout
    var box = container.append("g")
        .attr("class", "g_hover_readout")
        .attr("id", id + '_g')
        .attr("transform", "translate(0," + (y + 1) + ")");

    // crisp the rectangle edges,otherwise they may randomly be blurry from spanning two screen pixels
    box.append("rect")
        .attr("class", "hover_readout")
        .attr("id", id + '_rect')
        .attr("x", 1)
        .attr("y", 0)
        .attr("width", READOUT_WIDTH)
        .attr("height", "1.1em")
        .attr("font-size", '1.0em')
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges")
        .attr("fill", backgroundColor)
        .attr("fill-opacity", 0.7)
        .attr("stroke", borderColor);
  }

  /**
   * Build the hover readout text fields for each series in this plot.
   * @param {String} id - the element id
   * @param {number} y - the y coordinate
   * @param {Array} textColors - the text colors
   * @param {Array} seriesVisible - the visibility of each series
   */
  function buildHoverReadoutText(id, y, textColors, seriesVisible) {

    // divide up readout into a field for each series (ie. for 2 visible, divide into thirds)
    var visibleCount = 0;
    for (var i = 0; i < textColors.length; i++) {
      if (seriesVisible[i]) {
        visibleCount++;
      }
    }
    var textWidth = READOUT_WIDTH / visibleCount;

    // get the parent graphic element that holds the box and text fields
    var box = focus.selectAll('#' + id + '_g');

    var visibleNum = 0;

    // create a field for each series
    for (i = 0; i < textColors.length; i++) {

      // only add the readout field if the series is visible
      if (seriesVisible[i]) {
        // compute the center of the text field
        var x = (textWidth / 2) + (i * textWidth);
        x = (visibleNum++ + 1) * (READOUT_WIDTH / (visibleCount + 1));

        box.append("text")
            .attr("class", "hover_readout_text")
            .attr("id", id + "_" + i)
            .attr("font-family", "Courier monospace")
            .attr("font-size", '1.0em')
            .attr("fill", (id.indexOf('_recur') !== -1) ? GRAY : textColors[i])
            .attr("x", x)
            .attr("y", 0)
            .attr("dy", "0.9em")
            .attr("text-anchor", "middle");
      }
    }
  }

  /**
   * (d3-specific) Build a hover readout pane.
   * @param {String} id - the element id
   * @param {String} backgroundColor - the background color
   * @param {String} borderColor - the border color
   * @param {String} textColor - the text color
   */
  function buildHoverReadoutTimestamp(id, backgroundColor, borderColor, textColor) {

    // the top timestamp is just above the topmost plot (positive is downward from 0 origin at top left)
    var y = margin_top - 20;

    // the timestamp uses a larger font
    var fontSize = '1.1em';
    var width = READOUT_WIDTH + 50;

    var box = focus.append("svg")
        .attr("class", "g_hover_readout_time_container")
        .attr("id", "hover_readout_time_container")
        .attr("x", -(width / 2))
        .attr("y", y);

    // add the first timestamp above the plots
    // TODO put these in a container that can be hidden when saving as image
    // crisp the rectangle edges,otherwise they may randomly be blurry from spanning two screen pixels
    box.append("rect")
        .attr("class", "hover_readout_time")
        .attr("id", id + '_rect')
        .attr("width", width)
        .attr("height", "1.1em")
        .attr("font-size", fontSize)
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges")
        .attr("fill", backgroundColor)
        .attr("stroke", borderColor);

    box.append("text")
        .attr("class", "hover_readout_text_time")
        .attr("id", id)
        .attr("font-family", "Courier monospace")
        .attr("font-size", fontSize)
        .attr("fill", textColor)
        .attr("x", (width / 2))
        .attr("dy", "1.0em")
        .attr("text-anchor", "middle");

    // add a second timestamp above the zoom controller box
    // TODO make a constant, here and elsewhere
    var dateTickHeight = 2 + 11 + 2;
    var height = y + box_guide.y1 + getFlagHeight() + dateTickHeight - 20;

    box.append("rect")
        .attr("class", "hover_readout_time")
        .attr("id", id + '_rect2')
        .attr("x", 0)
        .attr("y", height)
        .attr("width", width)
        .attr("height", "1.1em")
        .attr("font-size", fontSize)
        .attr("stroke-width", 1)
        .attr("shape-rendering", "crispEdges")
        .attr("fill", backgroundColor)
        .attr("stroke", borderColor);

    box.append("text")
        .attr("class", "hover_readout_text_time")
        .attr("id", id + '2')
        .attr("font-family", "Courier monospace")
        .attr("font-size", fontSize)
        .attr("fill", textColor)
        .attr("x", (width / 2))
        .attr("y", height - 1)
        .attr("dy", "1.0em")
        .attr("text-anchor", "middle");
  }

  /**
   * (d3-specific) Build a vertical cursor line that overlays a plot.
   * @param yScale - the y scale for the plot
   */
  function buildCursorLine(yScale) {
    // define the cursor vertical line function
    // tickSize and tickFormat are extra stuff to turn off the ticks, which D3 auto-generates even when you tell it you don't want any...
    //TODO vertical line doesn't need to be an axis, can just be a line element
    var vert_line = d3.svg.axis().scale(yScale).orient("left").ticks(0).tickSize(0).tickFormat('');

    focus.append("g")
        .call(vert_line)
        .attr("class", "cursor")
        .attr("fill", "none")
        .attr("stroke", getLineColor())
        .attr("stroke-width", 1)
        .attr("stroke-opacity", vert_line_marker_opacity)
        .attr("shape-rendering", "crispEdges");
  }

  /**
   * Get the current list of plots to display. For now, the PlasMag plots are always shown, and then the KpAp plot is appended if selected.
   * @returns {*}
   */
  function getCurrentPlotList() {
    // make a deep copy of the plot list
    var plotList = JSON.parse(JSON.stringify(PLOT_LISTS[seriesScheme]));

    if (kpApScheme === 'true') {
      // append to the copy of the list, this plot will be at the bottom
      plotList.push(KPAP_GRAPH);
    }

    return plotList;
  }

  /**
   * Build the shaded rectangles for showing the zoomed area on each plot.
   */
  function buildDragBox() {

    // initially invisible
    dragbox = main_graphic.append("g").attr("class", "dragbox").attr("display", "none");

    var plotList = getCurrentPlotList();

    // separate flanking rectangle pairs for each plot, leaving the zoomed area open
    for (var i = 0; i < plotList.length; i++) {
      dragbox.append("rect")
          .attr("id", "dragbox_left_" + i)
          .attr("y", boxDimensions[i].y1)
          .attr("width", plt_width)
          .attr("height", plt_height)
          .attr("fill", "gray")
          .attr("opacity", DRAG_BOX_OPACITY);

      dragbox.append("rect")
          .attr("id", "dragbox_right_" + i)
          .attr("y", boxDimensions[i].y1)
          .attr("width", plt_width)
          .attr("height", plt_height)
          .attr("fill", "gray")
          .attr("opacity", DRAG_BOX_OPACITY);
    }
  }

  /**
   * Build the shaded rectangles for showing the zoomed area on each plot.
   */
  function buildZoomDragBox() {

    // initially invisible
    zoomdragbox = zoomBox.append("g").attr("class", "zoomdragbox").attr("hidden", true);

    // TODO add constants for font and gap sizes
    var y1 = box_guide.y1 + getFlagHeight() + 2 + 11 + 2;

    // separate flanking rectangle pairs for the zoom box, leaving the zoomed area open
    zoomdragbox.append("rect")
        .attr("id", "zoomdragbox_left")
        .attr("y", y1)
        .attr("width", 0)
        .attr("height", ZOOM_HEIGHT)
        .attr("fill", "gray")
        .attr("opacity", DRAG_BOX_OPACITY);

    zoomdragbox.append("rect")
        .attr("id", "zoomdragbox_right")
        .attr("y", y1)
        .attr("width", 0)
        .attr("height", ZOOM_HEIGHT)
        .attr("fill", "gray")
        .attr("opacity", DRAG_BOX_OPACITY);

    // the black background needs a little extra something to be able to see the zoomed area on the zoombox
    zoomdragbox.append("rect")
        .attr("id", "zoomdragbox_center")
        .attr("y", y1)
        .attr("width", 0)
        .attr("height", ZOOM_HEIGHT)
        .attr("fill", "none")
        .attr("stroke", "yellow")
        .attr("stroke-width", 2)
        .attr("visibility", (colorScheme === BLACK_SCHEME) ? "visible" : "hidden");

    // the zoom state is retained on loading of new data, so may need to reconstitute the rectangles after they're cleared
    if (isZoomed) {
      var left = x_scale_timespan(zoomStartMoment);
      var right = x_scale_timespan(zoomEndMoment);

      zoomdragbox.selectAll("#zoomdragbox_left")
          .attr("width", left);

      zoomdragbox.selectAll("#zoomdragbox_right")
          .attr("x", right)
          .attr("width", plt_width - right);

      zoomdragbox.selectAll("#zoomdragbox_center")
          .attr("x", left)
          .attr("width", right - left);
    }
  }

  /**
   * (d3-specific) Capture mouse movement anywhere on the page.
   */
  function captureMouseMovement() {
//    var dragCircle = d3.behavior.drag()
//            .on('dragstart', function () {
//              d3.event.sourceEvent.stopPropagation();
//              log('start dragging');
//            })
////        .on('drag', function (d, i) {
////          d.cx += d3.event.dx;
////          d.cy += d3.event.dy;
////          d3.select(this).attr('cx', d.cx).attr('cy', d.cy)
////        })
//        ;

    main_graphic.append("rect")
        .attr("class", "overlay")
        .attr("width", plt_width)
        .attr("height", box_guide.y1)
        .attr("fill", "none")
        .attr("pointer-events", "all")
        .on("mouseover", function () {
          focus.attr("display", null);
        })
        .on("mouseout", function () {
//          log("mouseout turning off overlay")
          focus.attr("display", "none");
        })
        .on("mousemove", function () {
          mousemoveD3(d3.event, d3.mouse(this)[0])
        })
        .on("mousedown", function () {
          mousedownD3(d3.mouse(this)[0])
        })
        .on("mouseup", function () {
          mouseUpD3(d3.mouse(this)[0])
        })
//        .call(dragCircle)
//        .on("click", function() {log("click received")})
        .on("dblclick", function () {
//          log("dblclick received");
          zoomReset(d3.event, false)
        });

    // bind keydown events to handle moving the cursor using arrow keys
    d3.select("body").on("keydown", function () {
      keyMouseMove(d3.event)
    });

//    main_graphic.on("mouseup", function () {
//      var coords = d3.mouse(this);
//      log("d3 mouseup " + JSON.stringify(coords));
//
//      // Normally we go from data to pixels, but here we're doing pixels to data
////      var newData= {
////        x: Math.round( xScale.invert(coords[0])),  // Takes the pixel number to convert to number
////        y: Math.round( yScale.invert(coords[1]))
////      };
//    });
  }

  /**
   * Handle a successful fetch of multiple Phase II mag data files.
   * @param {Object} error - the query error condition, if any
   * @param {Array} jsonFiles - one or more fetched JSON data arrays
   */
  function initialLoadMagMultiple(error, jsonFiles) {
    var i;
    if (error) {
      log("initialLoadMagMultiple: ERROR " + JSON.stringify(error));
      magData = [];
    } else {
//      log("initialLoadMagMultiple: no error, jsonFiles length " + jsonFiles.length);

      for (i = 0; i < jsonFiles.length; i++) {
        // TODO what is the 20 year offset for? Should it be 30 now?
        var data = convertJSONToPlotData(jsonFiles[i], true, visibleResolutionByInstrument(BT_BX_BY_GRAPH), moment.utc(startMoment).subtract(20, 'years'));

        // testing - looked for out-of-order data, didn't find any
        // var time = data[0].time_tag;
        // for (var k = 1; k < data.length; k++) {
        //   if (moment.utc(k.time_tag).isBefore(time)) {
        //     log("initialLoadMagMultiple: out of order data[" + k + "] " + JSON.stringify(data[k].time_tag) + " " + data[k].source);
        //   }
        // }

        if (i === 0) {
          // use the first array as the baseline
          magData = data;
        } else {
          // combine with the previously processed array
          magData = combineData(magData, data);
        }

        // time = magData[0].time_tag;
        // for (k = 1; k < magData.length; k++) {
        //   if (moment.utc(k.time_tag).isBefore(time)) {
        //     log("initialLoadMagMultiple: out of order magData[" + k + "] " + JSON.stringify(magData[k].time_tag) + " " + magData[k].source);
        //   }
        // }
      }

//      log("initialLoadMagMultiple: combined mag length " + magData.length);
    }

    finalizeMagLoad();
  }

  /**
   * Handle a successful fetch of multiple Phase II plasma data files.
   * @param {Object} error - the query error condition, if any
   * @param {Array} jsonFiles - one or more fetched JSON data arrays
   */
  function initialLoadPlasmaMultiple(error, jsonFiles) {
    var i;
    if (error) {
      log("initialLoadPlasmaMultiple: ERROR " + JSON.stringify(error));
      plasmaData = [];
    } else {
//      log("initialLoadPlasmaMultiple: no error, jsonFiles length " + jsonFiles.length);

      for (i = 0; i < jsonFiles.length; i++) {
        var data = convertJSONToPlotData(jsonFiles[i], true, visibleResolutionByInstrument(DENS_GRAPH), moment.utc(startMoment).subtract(20, 'years'));
        if (i === 0) {
          // use the first array as the baseline
          plasmaData = data;
        } else {
          // combine with the previously processed array
          plasmaData = combineData(plasmaData, data);
        }
      }

//      log("initialLoadPlasmaMultiple: combined plasma length " + plasmaData.length);
    }

    finalizePlasmaLoad();
  }

  /**
   * Handle a successful fetch of multiple Phase II Kp-Ap data files.
   * @param {Object} error - the query error condition, if any
   * @param {Array} jsonFiles - one or more fetched JSON data arrays
   */
  function initialLoadKpApMultiple(error, jsonFiles) {
    var i;
    if (error) {
      log("initialLoadKpApMultiple: ERROR " + JSON.stringify(error));
      kpApData = [];
    } else {
//      log("initialLoadKpApMultiple: no error, jsonFiles length " + jsonFiles.length);

      for (i = 0; i < jsonFiles.length; i++) {
        var data = convertJSONToPlotData(jsonFiles[i], true, visibleResolutionByInstrument(KPAP_GRAPH), moment.utc(startMoment).subtract(20, 'years'));
        if (i === 0) {
          // use the first array as the baseline
          kpApData = data;
        } else {
          // combine with the previously processed array
          kpApData = combineData(kpApData, data);
        }
      }

//      log("initialLoadKpApMultiple: combined kp ap length " + kpApData.length);
    }

    finalizeKpApLoad(false);
  }

  /**
   * Handle a successful fetch of multiple Phase II mag data files for use as recurrence.
   * @param {Object} error - the query error condition, if any
   * @param {Array} jsonFiles - one or more fetched JSON data arrays
   */
  function initialLoadMagMultipleRecurrence(error, jsonFiles) {
    var i;
    if (error) {
      log("initialLoadMagMultipleRecurrence: ERROR " + JSON.stringify(error));
      magDataRecurrence = [];
    } else {
//      log("initialLoadMagMultipleRecurrence: no error, jsonFiles length " + jsonFiles.length);

      for (i = 0; i < jsonFiles.length; i++) {
        var data = convertJSONToPlotData(jsonFiles[i], true, visibleResolutionByInstrument(BT_BX_BY_GRAPH), moment.utc(startMoment).subtract(20, 'years'));
        if (i === 0) {
          // use the first array as the baseline
          magDataRecurrence = data;
        } else {
          // combine with the previously processed array
          magDataRecurrence = combineData(magDataRecurrence, data);
        }
      }

           log("initialLoadMagMultipleRecurrence: combined mag length " + magDataRecurrence.length);
    }

    finalizeMagLoadRecurrence();
  }

  /**
   * Handle a successful fetch of multiple Phase II plasma data files for use as recurrence.
   * @param {Object} error - the query error condition, if any
   * @param {Array} jsonFiles - one or more fetched JSON data arrays
   */
  function initialLoadPlasmaMultipleRecurrence(error, jsonFiles) {
    var i;
    if (error) {
      log("initialLoadPlasmaMultipleRecurrence: ERROR " + JSON.stringify(error));
      plasmaDataRecurrence = [];
    } else {
//      log("initialLoadPlasmaMultipleRecurrence: no error, jsonFiles length " + jsonFiles.length);

      for (i = 0; i < jsonFiles.length; i++) {
        var data = convertJSONToPlotData(jsonFiles[i], true, visibleResolutionByInstrument(DENS_GRAPH), moment.utc(startMoment).subtract(20, 'years'));
        if (i === 0) {
          // use the first array as the baseline
          plasmaDataRecurrence = data;
        } else {
          // combine with the previously processed array
          plasmaDataRecurrence = combineData(plasmaDataRecurrence, data);
        }
      }

      log("initialLoadPlasmaMultipleRecurrence: combined plasma length " + plasmaDataRecurrence.length);
    }

    finalizePlasmaLoadRecurrence();
  }

  /**
   * Handle a successful fetch of multiple Phase II Kp-Ap data files for use as recurrence.
   * @param {Object} error - the query error condition, if any
   * @param {Array} jsonFiles - one or more fetched JSON data arrays
   */
  function initialLoadKpApMultipleRecurrence(error, jsonFiles) {
    var i;
    if (error) {
      log("initialLoadKpApMultipleRecurrence: ERROR " + JSON.stringify(error));
      kpApDataRecurrence = [];
    } else {
      //     log("initialLoadKpApMultipleRecurrence: no error, jsonFiles length " + jsonFiles.length);

      for (i = 0; i < jsonFiles.length; i++) {
        var data = convertJSONToPlotData(jsonFiles[i], true, visibleResolutionByInstrument(KPAP_GRAPH), moment.utc(startMoment).subtract(20, 'years'));
        if (i === 0) {
          // use the first array as the baseline
          kpApDataRecurrence = data;
        } else {
          // combine with the previously processed array
          kpApDataRecurrence = combineData(kpApDataRecurrence, data);
        }
      }

//      log("initialLoadKpApMultipleRecurrence: combined kp ap length " + kpApDataRecurrence.length);
    }

    finalizeKpApLoad(true);
  }


  /**
   * Combine a pair of data arrays after conversion and stripping of the column headers.
   * @param pendingData
   * @param newData
   * @returns {Array}
   */
  function combineData(pendingData, newData) {
    var combinedData;
    var first;
    var second;
    var pendingTime;
    var dataTime;

    // the expected order
    first = pendingData;
    second = newData;

    // did both fetches return more records than just the header line?
    if (pendingData.length > 1 && newData.length > 1) {
      // look at the first timestamp to determine which one is first since they can be returned in the wrong order
      pendingTime = moment.utc(pendingData[1][0]);
      dataTime = moment.utc(newData[1][0]);

      // are they in the wrong order?
      if (pendingTime > dataTime) {
        // reverse them
        first = newData;
        second = pendingData;
      }
    }

    if (first.length > 0 && second.length > 0) {
      //  checking for trim
      var secondStart = second[0].time_tag;
      if (moment.utc(first[first.length - 1].time_tag).isAfter(moment.utc(secondStart))) {
        // trimming at secondStart
        var cutData = [];
        var i = 0;

        // start searching from the beginning for elements before the second start time
        while ((i < first.length - 1 && first[i].time_tag.getTime() - secondStart.getTime() < 0)) {
          i++;
        }

        // return a truncated array of all data after the start time
        if (i === first.length - 1) {
//          log("trimmed all data!");
        } else {
          // make a shallow copy of the trimmed array
          cutData = first.slice(0, i);
//          log("last after trimming " + cutData[cutData.length - 1].time_tag);
        }

        first = cutData;
      }
    }

    // combine the two arrays
    combinedData = first.concat(second.slice());

    if (combinedData.length > 0) {
//        log("combineData: " + combinedData[0].time_tag + " to " + combinedData[combinedData.length - 1].time_tag);
//    log("combineData: final length " + combinedData.length);
    } else {
//      log("combineData: no combined data!");
    }

    return combinedData;
  }

// ***********************************************************************************************************
//  periodic update processing
// ***********************************************************************************************************

  /**
   * Fired at regular intervals to fetch the next five minutes of data.
   */
  function updateSeries() {

    // don't update until the initial load completes
    if (lastMagDataMoment == undefined && lastPlasmaDataMoment == undefined) {
      log("updateSeries: initial load not done, falling out");
      return;
    }

    updateCount++;
//    log("***** tick ***** updateSeries: count=" + updateCount + " lastMag=" + lastMagDataMoment + " lastPlasma=" + lastPlasmaDataMoment);

    try {
      // use cases:
      // not zoomed (showing Phase I file) - send query, append data, let data timeshift off (for all but Mission span)
      // zoomed
      //   magnifying (Phase I file), current time visible - send query, append data
      //   magnifying (Phase I file), current time not visible - send query, append data
      //   1+ level in (Phase II file), current time visible - send query
      //   1+ level in (Phase II file), current time not visible - don't bother sending query
//            var dontBother = (visibleIndex() != currentIndex && endMoment.diff(moment.utc(), 'seconds') < visibleResolution());
      // TODO handle the case when zoomed in at least one level and the file desired is different from the selected span
      var dontBother = (visibleIndex() != currentIndex);
//            log("dont bother " + dontBother + " visible index " + visibleIndex() + " current index " + currentIndex);

      //     if (!dontBother) {
      var tag = getDataServiceTag();
      var magQuery = dataServiceUrl + MAG_PREFIX + tag + FIVE_MINUTE_SUFFIX + PHASE_II_FINAL_EXTENSION;
      var plasmaQuery = dataServiceUrl + PLASMA_PREFIX + tag + FIVE_MINUTE_SUFFIX + PHASE_II_FINAL_EXTENSION;
      var kpQuery = dataServiceUrl + KP_PREFIX + tag + FIVE_MINUTE_SUFFIX + PHASE_II_FINAL_EXTENSION;

//      log("queueing data update calls");
//      log(magQuery);
//      log(plasmaQuery);
//      log(kpQuery);

      d3_queue.queue()
          .defer(d3_request.json, magQuery)
          .defer(d3_request.json, plasmaQuery)
          .defer(d3_request.json, kpQuery)
          .await(dataUpdate);

      // load fresh recurrence data if necessary to handle update
      if (loadRecurrence()) {
        loadAllRecurrenceData();
      }

//      } else {
//        log("updateSeries: not bothering to send query for 5-minute update, wouldn't be used");
//      }
    } catch (e) {
      log("ERROR: exception in updateSeries" + "\n" + e.message + "\n" + e.stack);
    }
  }

  /**
   * (d3-specific) Handle the receipt of both the mag and plasma 5-minute update JSON data.
   * @param {Object} error - the query error condition, if any
   * @param {Array} magJsonData - the mag data lines
   * @param {Array} plasmaJsonData - the plasma data lines
   * @param {Array} kpJsonData - the Kp-Ap data lines
   */
  function dataUpdate(error, magJsonData, plasmaJsonData, kpJsonData) {
    if (error) {
      log("dataUpdate: error " + error);
      if (magJsonData !== undefined && plasmaJsonData !== undefined && kpJsonData !== undefined) {
        log("dataUpdate: stringified error " + JSON.stringify(error));
      }
    } else {
      // log("dataUpdate: mag len " + magJsonData.length + " plasma len " + plasmaJsonData.length + " kp len " + kpJsonData.length);

      // get objects with all of the new data from the JSON string
      var magIncrement = convertJSONToPlotData(magJsonData, false, visibleResolutionByInstrument(BT_BX_BY_GRAPH), lastMagDataMoment);
      var plasmaIncrement = convertJSONToPlotData(plasmaJsonData, false, visibleResolutionByInstrument(DENS_GRAPH), lastPlasmaDataMoment);
      var kpApIncrement = convertJSONToPlotData(kpJsonData, false, visibleResolutionByInstrument(KPAP_GRAPH), lastKpApDataMoment);
//      log("kp 5-minute increment after lstKpApDataMoment " + lastKpApDataMoment.format(DATE_FORMAT_DISPLAY) + " " + JSON.stringify(kpApIncrement));

      // adjust the incoming data values as needed before adding them to the global arrays
      plasmaIncrement = adjustPlasmaData(plasmaIncrement);

//      log("magIncrement length " + magIncrement.length + " plasmaIncrement length " + plasmaIncrement.length);

      // did any new data arrive?
      newMagData = magIncrement.length > 0;
      newPlasmaData = plasmaIncrement.length > 0;
      newKpApData = kpApIncrement.length > 0;

      // add the new data to the existing data sets
      magData = addAnyNewData(magData, magIncrement);
      plasmaData = addAnyNewData(plasmaData, plasmaIncrement);
      kpApData = addAnyNewData(kpApData, kpApIncrement);
//     log("kp data after adding 5-min " + JSON.stringify(kpApData));

      // append the adjusted new current data to the existing current-recurrence
      if (loadRecurrence()) {

        // make a deep copy of the current (non-recurrence) data
        var md = JSON.parse(JSON.stringify(magIncrement));
        var pd = JSON.parse(JSON.stringify(plasmaIncrement));
        var kd = JSON.parse(JSON.stringify(kpApIncrement));

        // shift it forward and mark as recurrence. This data will be combined with the recurrence data when drawn
        markRecur(md);
        markRecur(pd);
        markRecur(kd);

        // append it to the existing current-recurrence data
        mdatar = addAnyNewData(mdatar, md);
        pdatar = addAnyNewData(pdatar, pd);
        kdatar = addAnyNewData(kdatar, kd);

        applyFiltersR();
      }

      // create the filtered versions for use throughout
      applyFilters();

      // for data with resolution <= 5 minutes, verify that the timestamp is updating
      var updateLast = false;
      if (resolutions[visibleIndex()] <= FIVE_MINUTES) {
        updateLast = (magData.length > 0 && moment.utc(magData[magData.length - 1].time_tag).isAfter(lastMagDataMoment));
//        log('resolution is <5min ' + resolutions[visibleIndex()]);
      } else if (newMagData || newPlasmaData) {
        // otherwise, just verify that we can reach the server
        updateLast = true;
      }

      // update the last PlasMag data received variables if any new data has arrived
      // PlasMag is the primary data on the plot, others such as Kp do not drive the overall last times
      if (updateLast) {
//        log(" last mag data " + moment.utc(magData[magData.length - 1].time_tag).format(DATE_FORMAT_DISPLAY) +
//            " is after lastMagDataMoment " + lastMagDataMoment.format(DATE_FORMAT_DISPLAY));

        // track new data fetch success to support indicating outages
        updateLastSuccess(magIncrement);

        // update the last data times
        lastMagDataMoment = moment.utc(magData[magData.length - 1].time_tag);
        updateLastDataMoment(lastMagDataMoment);

        lastPlasmaDataMoment = moment.utc(plasmaData[plasmaData.length - 1].time_tag);
        updateLastDataMoment(lastPlasmaDataMoment);

//      } else {
//        log("no new data received " + moment.utc(magData[magData.length - 1].time_tag).format(DATE_FORMAT_DISPLAY));
      }

      // update the last KpAp data received variable
      if (kpApIncrement.length > 0) {
        lastKpApDataMoment = moment.utc(kpApData[kpApData.length - 1].time_tag);
//        log("dataUpdate: updated lastKpApDataMoment from the increment " + lastKpApDataMoment.format(DATE_FORMAT_DISPLAY));
      }
    }

    // perform the timeshift whether or not the data was fetched successfully
    timeShift();
  }

  /**
   * Track successful receipt of data to support indicating outages.
   * @param {Array} data - the last data received
   */
  function updateLastSuccess(data) {
//    log("data was received");
    // is there any data present?
    if (data.length > 0) {
      lastSuccess = moment.utc();
    }
  }

  /**
   * Add the new data array to the end of the original data array, overriding any old items with the same timestamp.
   * @param {Array} original_data - the original data array
   * @param {Array} new_data - the new data array to append
   * @returns {Array} - the updated data array
   */
  function addAnyNewData(original_data, new_data) {
    var i;
    var k;
    var data1;
    var data2;

    // is there any existing data that might be overridden?
    if (original_data !== undefined && original_data.length > 0) {
      var removeIndices = [];

      // look at the most recent section of the array. Use 3x the new data array length since there may be 3 entries for each time stamp (DSCOVR, ACE, MIXED)
      var startIndex = Math.max(0, original_data.length - 1 - (3 * new_data.length));

      // compare the new items to the most recent section of the original array, and identify any items that should be overridden
      for (i = startIndex; i < original_data.length; i++) {
        data1 = original_data[i];

        for (k = 0; k < new_data.length; k++) {
          data2 = new_data[k];
          // a new element with this time and source has arrived, which will replace this one
          if (isMatch(data1, data2)) {
            // store the index of the element if it needs to be replaced with an updated version
            removeIndices.push(i);
            break;
          }
        }
      }

      // remove all elements that will be overridden by new versions, working backwards through the list
      for (i = removeIndices.length - 1; i >= 0; i--) {
        // splice modifies the array
        original_data.splice(removeIndices[i], 1);
      }

      // add all the new data
      for (i = 0; i < new_data.length; i++) {
        data2 = new_data[i];
        original_data.push(data2);
      }
    } else {
      // no existing data, just add all of the new data
      original_data = [];
      for (i = 0; i < new_data.length; i++) {
        original_data.push(new_data[i]);
      }
    }

    return original_data;
  }

  /**
   * Determine if two elements match enough for one to replace the other.
   * @return - true if the two elements match
   */
  function isMatch(data1, data2) {
    if (data1 === undefined || data1 === null) {
      return false;
    } else {
      var time1 = moment.utc(data1.time_tag);
      var time2 = moment.utc(data2.time_tag);

      // do the two elements share the same timestamp and source spacecraft?
      return (time1.isSame(time2) && data1.source === data2.source);
    }
  }

  /**
   * (d3-compliant) Trim all data before the start time.
   * @param {Array} data - the data array to trim
   * @param {Object} start_time - the plot start time as Javascript Date object
   * @returns {Array} - the trimmed data array
   */
  function cutDataBeforeStart(data, start_time) {
    var cutData = [];

    // is there any data to potentially trim?
    if (data.length > 0) {
      var i = 0;

      // start searching from the beginning for elements before the start time
      while ((i < data.length && data[i].time_tag.getTime() - start_time.getTime() < 0)) {
        i++;
      }

      // return a truncated array of all data after the start time
      if (i === data.length) {
//        log("trimmed all data!");
      } else {
        // TODO switch to deep copy
        cutData = data.slice(i);
//        cutData = JSON.parse(JSON.stringify(data));
      }
    }

    return cutData;
  }

  /**
   *  Recompute the start/end times of the overall timespan, trim the old data, and replot as time passes.
   */
  function timeShift() {
//    log("timeshift: startMoment " + startMoment.format(DATE_FORMAT_DISPLAY) + " sourceScheme " + sourceScheme + " visibleSource " + visibleSource);
    timerStart();

    try { // get the millis, don't just assign or it will reference the object
      var saveStartMs = startMoment.valueOf();

      // shift the visible start/end dates if necessary based on the offset period, ie., the dates don't shift every time
      setUpGraphDates();

      // if the the mission timespan is selected, grow it
      if (isMission()) {
        currentSpanHours = (endMoment.diff(startMoment, 'hours'));
//        log("timeshift: mission currentSpanHours " + currentSpanHours);
      }

//      log("timeshift: new start " + startMoment.format() + " end " + endMoment.format());

      // determine if the start time has changed
      var startModified = (startMoment != saveStartMs);

//      log("timeshift: possibly new startMoment " + startMoment.format(DATE_FORMAT_DISPLAY) + " startModified " + startModified);
//      log("timeshift: newMagData " + newMagData + " newPlasmaData " + newPlasmaData);

      // has any new data arrived or the start date moved forward since the last shift?
      if (newMagData || newPlasmaData || startModified) {
//        log("*** timeshift: need to replot");

        // clear the flags
        newMagData = false;
        newPlasmaData = false;

        // did the start data move forward?
        if (startModified) {
          // redraw all the plots with the new start/end dates and possibly new y-axis scales

          // update the x_scale domains to the revised timespan
          updateXScaleDomains();

          // TODO what about recurrence arrays?

          // trim old data
//          log("timeshift: cutting data before startMoment " + startMoment.format(DATE_FORMAT_DISPLAY));
          magData = cutDataBeforeStart(magData, startMoment.toDate());
          plasmaData = cutDataBeforeStart(plasmaData, startMoment.toDate());
          kpApData = cutDataBeforeStart(kpApData, moment.utc(startMoment).subtract(3, 'hours').toDate());

//          log("timeshift: after cut, start " + moment.utc(magData[0].time_tag).format(DATE_FORMAT_DISPLAY) +
//              " end " + moment.utc(magData[magData.length - 1].time_tag).format(DATE_FORMAT_DISPLAY));

          // create the filtered versions for use throughout
          //TODO is this needed here? cut filtered arrays instead
          applyFilters();

          // if the tapped date is no longer relevant, clear it
          if (tappedDataposXMoment != undefined && tappedDataposXMoment.diff(startMoment)) {
            tappedDataposXMoment = undefined;
          }

//          log("*** timeshift: replotting via buildPlots");

          // create the plot boxes
          buildPlots();
          //   replotData();
        } else {
//          log("*** timeshift: replotting via replotData");

          // redraw all the plots with the possibly new y-axis scales
          replotData();
        }

//        log("** timeshift: done replotting");
      } else {
//        log("no new data, date didn't change");
      }

      // update current data indicator to show if data is stale or not
      updateCurrentDataIndicator();
    } catch (e) {
      log('ERROR: uncaught exception processing timeshift ' + JSON.stringify(e));
    }

//    log("* timeshift: done with time shift, startMoment " + startMoment.format(DATE_FORMAT_DISPLAY) + " " + timerRead() +
//        "ms for span " + currentSpanHours + " hours");
  }

  /**
   * Draw the given series using the current rendering scheme.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
  function drawSeries(plot, plotBoxNum, plotNum, seriesNum) {

    //   try {
    // if the timespan is such that bands should be shown, draw them first
    if (useBands()) {
      drawBand(plot, plotBoxNum, plotNum, seriesNum);
    }

    // draw the Phi background shading and current Kp bars
    drawAsBar(plot, plotBoxNum, plotNum, seriesNum);

    // draw the Kp recurrence thin bars over the current Kp tall bars
    if (drawRecurrence()) {
      drawAsBarRecurrence(plot, plotBoxNum, plotNum, seriesNum);
    }

    if (plotNum === KPAP_GRAPH) {
//      drawAsText(plot, plotBoxNum, plotNum, seriesNum);
//
//      // draw the Ap recurrence text
//      if (drawRecurrence()) {
//        drawAsTextRecurrence(plot, plotBoxNum, plotNum, seriesNum);
//      }

//        // draw the Kp recurrence data as markers under the real data
//        if (drawRecurrence() && seriesNum === 0) {
//          drawAsMarkersRecurrence(plot, plotBoxNum, plotNum, seriesNum);
//        }
      // draw the Kp recurrence data as line over the real data drawn as bars
//        if (drawRecurrence() && seriesNum === 0) {
//          drawAsLine(plot, plotBoxNum, plotNum, seriesNum);
//        }
    } else {
      // always draw the recurrence data as markers (lines are too confusing) under the real data
      if (drawRecurrence()) {
        drawAsMarkersRecurrence(plot, plotBoxNum, plotNum, seriesNum);
      }

      // draw the series data either as markers or lines depending on the selected user option
      if (getMarkerScheme(plotNum)) {
        drawAsMarkers(plot, plotBoxNum, plotNum, seriesNum);
      } else {
        drawAsLine(plot, plotBoxNum, plotNum, seriesNum);
      }
    }

    // draw the Enlil overlay?
    if (enlilScheme === 'true') {
      drawEnlil(plot, plotBoxNum, plotNum);
    }

    // draw the Geospace overlay?
    if (geospaceScheme === 'true') {
      drawGeospace(plot, plotBoxNum, plotNum);
    }
//    } catch (e) {
//      log("ERROR: exception drawing series " + e);
//    }
  }

  /**
   * (d3-specific) Draw the given flag series as a linear strip of dots.
   * @param {string} name - the flag name
   */
  function drawFlags(name) {
    var showFlags = 'true' === flagScheme;

    // does the user want to see any of the flags?
    if (showFlags) {

      // special case of source spacecraft, which is only relevant if data from more than one is visible
      if (name === 'source') {
        var sourceLabels = flagBox.selectAll(".source-label");
        var state;
        // show the source flag strip only if multiple sources need to be distinguished,
        if (visibleSource === SOURCE_MULTIPLE) {
          // show the source labels
          state = "visible";
        } else {

          // don't draw the source flag strip
          showFlags = false;

          // hide the source labels
          state = "hidden";
        }
        // toggle the source label visibility
        sourceLabels.attr("visibility", state);
      }

      // should we continue?
      if (showFlags) {
        var className = "flag-" + name;

        // the data array driving this flag
        var data;
        if ("maneuver" === name || "source" === name) {
          // use the maneuver flag and source spacecraft from the mag data
          data = filteredMagData;
        } else {
          // use the quality flag from the plasma data
          data = filteredPlasmaData;
        }

        // bind the data to the DOM elements in the update phase using the time tag as the unique identifier
        var dots = flagBox.selectAll("." + className)
            .data(data, keyFunction);

        // 3 possible single-pixel lines with single pixel gap in between
        // 1 = source spacecraft, 2 = quality + density, 3 = maneuver
        var index = 1;
        if ("quality" === name) {
          index = 2;
        } else if ("maneuver" === name || "density" === name) {
          index = 3;
        }
        var y = box_guide.y1 + 0 + (index * (FLAG_LINE_WIDTH + FLAG_GAP));

        // keep in sync with AbstractJsonFileGenerator SOURCE_MIXED
        // 0=ACE, 1=DSCOVR, 9=MIXED
        var sourceColors = [GREEN, colorScheme === WHITE_SCHEME ? DARK_BLUE : BLUE, MAGENTA];

        // 0=normal (no flag drawn), 1=suspect, 2=error)
        var qualityColors = [getBackgroundColor(), (colorScheme === WHITE_SCHEME) ? DARK_YELLOW : YELLOW, RED];
        var densityThreshold = 1.0;

        // define a common function for computing x
        var xFunction = function (d, increment) {
          if (d[name] !== null && useData(d)) {
            if ("source" === name) {
              return x_scale(d.time_tag) + increment;
            } else if ("density" === name) {
              return d[name] < densityThreshold ? x_scale(d.time_tag) + increment : 0;
            } else if ("maneuver" === name) {
              // value of 0 = no maneuver (not drawn), 1 = maneuver
              return d[name] > 0 ? x_scale(d.time_tag) + increment : 0;
            } else {
              // quality(
              return x_scale(d.time_tag) + increment;
            }
          } else {
            return null;
          }
        };

        // define a common function for computing y
        var yFunction = function (d) {
          return d[name] !== null && useData(d) ? y : null;
        };

        // enter phase, create DOM elements for any new data
        dots.enter().append("svg:line")
            .attr("class", className)
            .attr("stroke", function (d) {
              var color;
              if ("source" === name) {
//                if (d[name] === 0) {
//                  log("drawing source flag for ACE " + JSON.stringify(d));
//                }
                color = sourceColors[d[name]];
//                if (color === GREEN) {
//                  log("source flag is green, name " + name + " d[name] " + d[name] + " d " + JSON.stringify(d));
//                }
              } else if ("maneuver" === name) {
                color = PURPLE;
              } else if ("quality" === name) {
                color = qualityColors[d[name]];
              } else if ("density" === name) {
                color = ORANGE;
              }
              return color;
            })
            .attr("stroke-width", FLAG_LINE_WIDTH)
            .attr("shape-rendering", "crispEdges")
            .attr("fill", "none")
            .attr("clip-path", "url(#plot_clip)")
            .attr("x1", function (d) {
              return xFunction(d, 0)
            })
            .attr("x2", function (d) {
              return xFunction(d, 2)
            })
            .attr("y1", yFunction)
            .attr("y2", yFunction);

        // exit phase, remove any DOM elements without associated data
        dots.exit().remove();
      }
    }
  }

  /**
   * (d3-specific) Draw the Enlil data as markers.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   */
  function drawEnlil(plot, plotBoxNum, plotNum) {
    // the data array driving this plot
    var data = enlilData;
    if (data === undefined || data.length === 0) {
      return;
    }

    var name = null;

    switch (plotNum) {
      case SPEED_GRAPH:
        name = "speed";
        break;
      case DENS_GRAPH:
        name = "density";
        break;
      case TEMP_GRAPH:
        name = "temperature";
        break;
    }

    if (name !== null) {
      // the y-axis scale
      var yScale = yScales[plotNum];

      // the series color
      var color = getColors(plotNum)[0];

      // line generator function that splits at nulls
      var lineFunction = d3.svg.line()
          .defined(function (d) {
            return d[name] != null && d[name] != undefined;
          })
          .x(function (d) {
            return x_scale(d.time_tag);
          })
          .y(function (d) {
            return d[name] === null ? null : yScale(d[name]);
          });

      // delete the existing path describing the series line segments
      plot.selectAll(".enlil").remove();

      // draw the line
      plot.append('path')
          .attr('class', 'enlil')
          .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")")
          .attr('d', lineFunction(data))
          .attr('stroke', color)
          .attr('stroke-width', enlilWidth)
          .attr("stroke-opacity", enlilOpacity)
          .attr("stroke-linecap", "round")
          .attr('fill', 'none');
    }
  }

  /**
   * (d3-specific) Draw the drawGeospace data as markers.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   */
  function drawGeospace(plot, plotBoxNum, plotNum) {

    // the data array driving this plot
    var data = geospaceData;

    // fall out if no geospace data loaded
    if (data === undefined || data.length === 0) {
      return;
    }

    // only keep the prediction, add a small gap before the predicted line
    geospaceData = cutDataBeforeStart(geospaceData, moment.utc(lastDataMoment).add(0, 'm').toDate());
    data = geospaceData;

    var names = [];
    switch (plotNum) {
      case BT_BZ_GRAPH:
        names = ['bt', 'bz'];
        break;
      case SPEED_GRAPH:
        names = ['speed'];
        break;
      case DENS_GRAPH:
        names = ['density'];
        break;
      case TEMP_GRAPH:
        names = ['temperature'];
        break;
    }

    if (names.length > 0) {
      // the y-axis scale
      var yScale = yScales[plotNum];

      // delete the existing path describing the series line segments
      plot.selectAll(".geospace").remove();

      for (var i = 0; i < names.length; i++) {
        var name = names[i];

        // the series color
        var color = getColors(plotNum)[i];

        // make it slightly darker
        var c = d3.rgb(color);
        c.darker(2);

        // line generator function that splits at nulls
        var lineFunction = d3.svg.line()
            .defined(function (d) {
              return d[name] != null && d[name] != undefined;
            })
            .x(function (d) {
              return x_scale(d.time_tag);
            })
            .y(function (d) {
              return d[name] === null ? null : yScale(d[name]);
            })
            .interpolate("basis");

        // draw the line
        plot.append('path')
            .attr('class', 'geospace')
            .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")")
            .attr('d', lineFunction(data))
            .attr('stroke', c.toString())
            .attr('stroke-width', geospaceWidth)
            .attr("stroke-opacity", geospaceOpacity)
            .attr("stroke-linecap", "round")
            .attr('stroke-dasharray', ('30,10'))
            .attr('fill', 'none');
      }
    }
  }

  /**
   * (d3-specific) Draw the given series as markers.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
  function drawAsMarkers(plot, plotBoxNum, plotNum, seriesNum) {

    // the data array driving this plot
    var data = getPlotData(plotNum);
    // the y-axis scale
    var yScale = yScales[plotNum];
    // the series color
    var color = getColors(plotNum)[seriesNum];
    // the array of series this plot shows
    var seriesList = SERIES_LISTS[plotNum];
    // the name of this series
    var name = SERIES_NAMES[seriesList[seriesNum]];

    // bind the data to the DOM elements in the update phase using the time tag as the unique identifier
    // Note: it's 20% faster to do the remove and redraw than the join
    var points = plot.selectAll(".dcircle").remove();

    points = plot.selectAll(".dcircle")
        .data(data, keyFunction);

    // convert from diameter to radius
    var radius = getMarkerSize(plotNum) / 2;

    // enter phase, create DOM elements for new data
    points.enter().append("svg:circle")
        .attr("class", "dcircle")
        .attr("stroke", "none").attr("fill", color)
        .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")")
        .attr("r", function (d) {
          return d[name] !== null && useData(d) ? radius : 0;
        })
        .attr("cx", function (d) {
          return d[name] !== null && useData(d) ? x_scale(d.time_tag) : null;
        })
        .attr("cy", function (d) {
          var value = (d[name] !== null && useData(d)) ? d[name] : null;
          // adjust Phi range
          value = (plotNum === PHI_GRAPH) ? adjustPhiValue(value) : value;
          return (value !== null) ? yScale(value) : null;
        });

    // exit phase, remove DOM elements without associated data
    points.exit().remove();
  }

  /**
   * (d3-specific) Draw the given series as markers.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
  function drawAsMarkersRecurrence(plot, plotBoxNum, plotNum, seriesNum) {

    // get the combined recurrence data
    var data = getRecurrenceData(plotNum);

    if (data === undefined) {
      log("drawAsMarkersRecurrence: data undefined, falling out");
      return;
    }

    // the y-axis scale
    var yScale = yScales[plotNum];
    // the series color
    var color = getColors(plotNum)[seriesNum];

    // use the series color if there are multiple series that need to be differentiated
    if (colorScheme === WHITE_SCHEME) {
      color = (SERIES_COLORS[plotNum].length > 1 && color !== BLACK) ? color : BLACK;
    } else {
      color = (SERIES_COLORS[plotNum].length > 1 && color !== WHITE) ? color : WHITE;
    }

    // TODO handle better
    // special cases: Bx, By, Bz only on Bt/Bx/By/Bz graph need tailored colors to aid differentiation
    if (plotNum === BT_BZ_GRAPH) {
      if (seriesNum === 1) {
        color = PURPLE_GRAY;
      } else if (seriesNum == 2) {
        color = ORANGE_GRAY;
      } else if (seriesNum == 3) {
        color = GREEN_GRAY;
      }
    }

    // the array of series this plot shows
    var seriesList = SERIES_LISTS[plotNum];

    // the name of this series
    var name = SERIES_NAMES[seriesList[seriesNum]];

    // bind the data to the DOM elements in the update phase using the time tag as the unique identifier
    // Note: it's 20% faster to do the remove and redraw than the join
    var points = plot.selectAll(".rcircle").remove();

    points = plot.selectAll(".rcircle")
        .data(data, keyFunctionRecurrence);

    // convert from diameter to radius
    var radius = getMarkerSize(plotNum) / 2;

    // the point density of high-res recurrence data is so high that the markers look just like non-recurrence, so adjust
    if (visibleIndex() === 0 && radius === 0.5) {
      radius = 0.25;
    }

    // enter phase, create DOM elements for new data
    points.enter().append("svg:circle")
        .attr("class", "rcircle")
        .attr("stroke", "none")
        .attr("fill", function () {
          return color;
        })
      // colored markers need to be a bit brighter than gray ones
        .attr("fill-opacity", seriesNum > 0 ? 0.6 : recurrenceOpacity)
        .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")")
        .attr("r", function (d) {
          return d[name] !== null && useData(d) ? radius : 0;
        })
        .attr("cx", function (d) {
          return d[name] !== null && useData(d) ? x_scale(d.time_tag) : null;
        })
        .attr("cy", function (d) {
          var value = (d[name] !== null && useData(d)) ? d[name] : null;
          // adjust Phi range
          value = (plotNum === PHI_GRAPH) ? adjustPhiValue(value) : value;
          return (value !== null) ? yScale(value) : null;
        });

    // exit phase, remove DOM elements without associated data
    points.exit().remove();
  }

  /**
   * Determine if the given data element should be used for the currently visible plots based on it's source spacecraft and active state.
   * @param {Object} d - the data object
   * @returns {boolean} - true if the data should be used
   */
  function useData(d) {
    var use = false;

    // var reason = "none";

    // TODO best way to handle non-plasmag data sets?
    if (d.kp !== undefined || d.ap !== undefined) {
      use = true;
    } else if (sourceScheme === ACTIVE_SCHEME) {
      use = d.active === 1;
      // if (!use ) {
      //   reason = "not active";
      // }
    } else if (sourceScheme === DSCOVR_SCHEME) {
      use = d.source === 1;
      if (!use) {
        reason = "dscovr but ace is active";
      }
    } else if (sourceScheme === ACE_SCHEME) {
      use = d.source === 0;
      // if (!use) {
      //   reason = "ace but dscovr is active";
      // }
    }

    // // jjj HACK, delete
    // use = true;

    return use;
  }

  /**
   * (d3-specific) Draw the given series as a connected line.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
  function drawAsLine(plot, plotBoxNum, plotNum, seriesNum) {

    // the data array driving this plot
    var data = getPlotData(plotNum);

    // because of how D3 builds paths, need to filter the data down to just the elements of interest
    var filteredData = filterData(data);

    // the y-axis scale
    var yScale = yScales[plotNum];
    // the series color
    var color = getColors(plotNum)[seriesNum];
    // the array of series this plot shows
    var seriesList = SERIES_LISTS[plotNum];
    // the name of this series
    var name = SERIES_NAMES[seriesList[seriesNum]];

    // line generator function that splits at nulls
    var lineFunction = d3.svg.line()
        .defined(function (d) {
          return d[name] != null && d[name] != undefined;
        })
        .x(function (d) {
          return x_scale(d.time_tag);
        })
        .y(function (d) {
          return d[name] === null ? null : yScale(d[name]);
        });

    // delete the existing path describing the series line segments
    plot.selectAll(".line-element").remove();

    // draw the line
    plot.append('path')
        .attr('class', 'line-element')
        .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")")
        .attr('d', lineFunction(filteredData))
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('fill', 'none');
  }

  /**
   * (d3-specific) Draw the given series as a connected line.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
    // TODO delete
  function drawAsLineRecurrence(plot, plotBoxNum, plotNum, seriesNum) {

    // get the combined recurrence data
    var data = getRecurrenceData(plotNum);

    if (data === undefined) {
      log("drawAsLineRecurrence: data undefined, falling out");
      return;
    }

    // because of how D3 builds paths, need to filter the data down to just the elements of interest
    var filteredData = filterData(data);

    // the y-axis scale
    var yScale = yScales[plotNum];
    // the series color
    var color = getColors(plotNum)[seriesNum];

    // use the series color if there are multiple series that need to be differentiated
    if (colorScheme === WHITE_SCHEME) {
      color = (SERIES_COLORS[plotNum].length > 1 && color !== BLACK) ? color : BLACK;
    } else {
      color = (SERIES_COLORS[plotNum].length > 1 && color !== WHITE) ? color : WHITE;
    }

    // the array of series this plot shows
    var seriesList = SERIES_LISTS[plotNum];
    // the name of this series
    var name = SERIES_NAMES[seriesList[seriesNum]];

    // line generator function that splits at nulls
    var lineFunction = d3.svg.line()
        .defined(function (d) {
          return d[name] != null && d[name] != undefined;
        })
        .x(function (d) {
          return x_scale(d.time_tag);
        })
        .y(function (d) {
          return d[name] === null ? null : yScale(d[name]);
        });

    // delete the existing path describing the series line segments
    plot.selectAll(".rline-element").remove();

    // draw the line
    plot.append('path')
        .attr('class', 'rline-element')
        .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")")
        .attr('d', lineFunction(filteredData))
        .attr('stroke', color)
        .attr('stroke-width', 1)
        .attr('fill', 'none')
      // colored lines need to be a bit brighter than gray ones
        .attr("fill-opacity", seriesNum > 0 ? 0.6 : recurrenceOpacity)
  }

  /**
   * Draw the min-max band.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
  function drawBand(plot, plotBoxNum, plotNum, seriesNum) {

    // fall out if Kp-Ap or Phi, which use bars instead of bands
    if (plotNum === KPAP_GRAPH || plotNum === PHI_GRAPH) {
      return;
    }

    // the data array driving this plot
    var data = getPlotData(plotNum);

    // because of how D3 builds paths, need to filter the data down to just the elements of interest
    var filteredData = filterData(data);

    // the y-axis scale
    var yScale = yScales[plotNum];
    // the series color
    var color = getColors(plotNum)[seriesNum];
    // the array of series this plot shows
    var seriesList = SERIES_LISTS[plotNum];
    // the name of this series
    var name = SERIES_NAMES[seriesList[seriesNum]];

    var band = d3.svg.area()
        .defined(function (d) {
          if (plotNum === DENS_GRAPH) {
            // if (moment.utc(d.time_tag).isAfter(moment.utc('2018-11-01')) && moment.utc(d.time_tag).isBefore(moment.utc('2019-03-02'))) {
            //   log("drawBand check: " + JSON.stringify(d));
            // }
          }
          // create breaks in the filled areas for missing data
//          if (plotNum === DENS_GRAPH) {
//            log("drawBand: ok? "  + (!isNaN(d[name]) && d[name] !== null) + " " + JSON.stringify(d));
//          }
          return !isNaN(d[name]) && d[name] !== null;
        })
        .x(function (d) {
          // if (plotNum === DENS_GRAPH) {
          //   if (moment.utc(d.time_tag).isAfter(moment.utc('2018-11-01')) && moment.utc(d.time_tag).isBefore(moment.utc('2019-03-02'))) {
          //     log("drawBand scaled time is: " + JSON.stringify(moment.utc(d.time_tag)));
          //   }
          // }
          if (isNaN(x_scale(d.time_tag))) {
            log("drawBand: scaled time is NaN " + JSON.stringify(d));
          }
          return x_scale(d.time_tag);
        })
        .y0(function (d) {
          if (isNaN(x_scale(d.time_tag))) {
            log("drawBand: scaled _min is NaN " + JSON.stringify(d));
          }
//          log("y0 " + JSON.stringify(d.time_tag) + " name " + name + " d[name] " + d[name] + " " + yScale(d[name+"_min"]));
          return yScale(d[name + "_min"]);
        })
        .y1(function (d) {
          if (isNaN(x_scale(d.time_tag))) {
            log("drawBand: scaled _max is NaN " + JSON.stringify(d));
          }
          return yScale(d[name + "_max"]);
        });

    // delete the existing path describing the band area perimeter segments
    plot.selectAll(".band-element").remove();

    // draw the band
    plot.append("path")
        .datum(filteredData)
        .attr("class", "band-element")
        .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")")
        .attr("d", band)
        .attr("fill", color)
        .attr("opacity", band_opacity)
        .attr("stroke", "none");
  }

  /**
   * (d3-specific) Draw background rectangles above or below the midline behind Phi values.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
  function drawAsBar(plot, plotBoxNum, plotNum, seriesNum) {

    // fall out if not Phi or Kp
    if (plotNum !== PHI_GRAPH && !(plotNum === KPAP_GRAPH && seriesNum === 0) && !(plotNum === BT_BZ_GRAPH && seriesNum === 1)) {
      return;
    }

    // the data array driving this plot
    var data = getPlotData(plotNum);

    // the y-axis scale
    var yScale = yScales[plotNum];

    // the array of series this plot shows
    var seriesList = SERIES_LISTS[plotNum];

    // the name of this series
    var name = SERIES_NAMES[seriesList[seriesNum]];

    // get the width of one sample in pixels
    var width = sampleWidth(plotNum);

    // delete the existing path describing the series line segments
    plot.selectAll(".g-drect").remove();

    // set the clip rectangle on the outermost box, since the inner boxes are translated
    var box = plot.append("g")
        .attr("class", "g-drect")
        .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")");

    // make the zero KP a couple pixels high to differentiate from null
    var ZERO_KP_HEIGHT = 2;

    // the background rectangle above or below the mid-point
    box.selectAll("rect")
        .data(data).enter()
        .append("rect")
        .attr("class", "drect")
        .attr("transform", function (d) {
          // the left edge of the Kp bar aligns with the time
          var x = x_scale(d.time_tag);
          var y = boxDimensions[plotBoxNum].y1;
          return "translate(" + x + "," + y + ")";
        })
        .attr("y", function (d) {
          if (plotNum === PHI_GRAPH) {
            return (d[name] > PHI_ADJUST && d[name] < 180 + PHI_ADJUST) ? plt_height / 2 : 0;
          } else if (plotNum === BT_BZ_GRAPH) {
            // below or above the midline
            return d[name] < 0 ? plt_height / 2 : 0;
          } else {
            // Kp
            var value = (d.kp_max !== undefined) ? d.kp_max : d.kp;
            // add 2 pixels so that Kp=0 is distinguishable from no data
            return plt_height - (yScale(0) - yScale(value) + ((value === 0) ? ZERO_KP_HEIGHT : 0));
          }
        })
        .attr("width", function () {
          return width;
        })
        .attr("height", function (d) {
          if (plotNum === PHI_GRAPH || plotNum === BT_BZ_GRAPH) {
            // shade top or bottom half
            return d[name] === null ? null : plt_height / 2;
          } else {
            // Kp
            var value = (d.kp_max !== undefined) ? d.kp_max : d.kp;
            // add 2 pixels so that Kp=0 is distinguishable from no data
            return (value === null) ? null : yScale(0) - yScale(value) + ZERO_KP_HEIGHT;
          }
        })
        .attr("fill", function (d) {
          if (plotNum === KPAP_GRAPH) {
            // vary the color according to the NOAA scale
            var value = (d.kp_max !== undefined) ? d.kp_max : d.kp;
            return KP_COLORS[value];
          } else {

            if (plotNum === PHI_GRAPH) {
              // use different colors below/above the midline for away/towards (red below/away, series color above/towards)
              return (d[name] > PHI_ADJUST && d[name] < 180 + PHI_ADJUST) ? RED : SERIES_COLORS[plotNum][seriesNum];
            } else if (plotNum === BT_BZ_GRAPH) {
              // below or above the midline
//              return d[name] < 0 ? SERIES_COLORS[plotNum][seriesNum] : getBackgroundColor();
              return d[name] <= -5 ? PURPLE_GRAY : getBackgroundColor();
            }

            // by default, use the series color
            return SERIES_COLORS[plotNum][seriesNum];
          }
        })
        .attr("fill-opacity", plotNum === KPAP_GRAPH ? 1.0 : (colorScheme === WHITE_SCHEME ? 0.22 : 0.25))
//        .attr("shape-rendering", "crispEdges")  // seems to work the same with or without this, leaving off for now
    ;
  }

  /**
   * (d3-specific) Draw the given series background rectangles with recurrence shading.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
  function drawAsBarRecurrence(plot, plotBoxNum, plotNum, seriesNum) {

    // fall out if not Phi or Kp
    if (!(plotNum === KPAP_GRAPH && seriesNum === 0) && !(plotNum === PHI_GRAPH) && !(plotNum === BT_BZ_GRAPH && seriesNum === 1)) {
      return;
    }

    // get the combined recurrence data
    var data = getRecurrenceData(plotNum);

    if (data === undefined) {
      log("drawAsBarRecurrence: plotNum " + plotNum + " data undefined, falling out");
      return;
    }

    // to optimize speed and memory usage, Kp-Ap recurrence bars are drawn behind the current bars, all others only after last data moment
    if (plotNum !== KPAP_GRAPH) {
      data = cutDataBeforeStart(data, moment.utc(lastDataMoment).toDate());
    }

    // the y-axis scale
    var yScale = yScales[plotNum];

    // the array of series this plot shows
    var seriesList = SERIES_LISTS[plotNum];

    // the name of this series
    var name = SERIES_NAMES[seriesList[seriesNum]];

    // get the width of one sample in pixels
    var width = sampleWidth(plotNum);

    // delete the existing path describing the series line segments
    plot.selectAll(".rrect").remove();

    // set the clip rectangle on the outermost box, since the inner boxes are translated
    var box = plot.append("g")
        .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")");

    // the background rectangle above or below the mid-point
    box.selectAll(".rrect")
        .data(data)
        .enter()
        .append("rect")
        .attr("class", "rrect")
        .attr("transform", function (d) {
          // the left edge of the Kp bar aligns with the time
          var x = x_scale(d.time_tag);
          var y = boxDimensions[plotBoxNum].y1;
          return "translate(" + x + "," + y + ")";
        })
        .attr("y", function (d) {
          if (plotNum === PHI_GRAPH) {
            // below or above the midline
            return (d[name] > PHI_ADJUST && d[name] < 180 + PHI_ADJUST) ? plt_height / 2 : 0;
          } else if (plotNum === BT_BZ_GRAPH) {
            // below or above the midline
            return d[name] < 0 ? plt_height / 2 : 0;
          } else {
            // Kp
            var value = (d.kp_max !== undefined) ? d.kp_max : d.kp;
            return plt_height - (yScale(0) - yScale(value));
          }
        })
        .attr("width", function (d) {
          // only show plasmag (e.g, Phi) recurrence bars for future
          return (plotNum === KPAP_GRAPH) ? width : (moment.utc(d.time_tag).isAfter(lastDataMoment)) ? width : 0;
        })
        .attr("height", function (d) {
          if (plotNum === PHI_GRAPH || plotNum === BT_BZ_GRAPH) {
            // Phi and Bz, the bar is always half the height of the plot
            return d[name] === null ? null : plt_height / 2;
          } else {
            // Kp, the bar height is driven by the max value
//            var value = (d.kp_max !== undefined) ? d.kp_max : d.kp;
            return KP_RECURRENCE_BAR_HEIGHT;
          }
        })
        .attr("fill", function (d) {

          if (plotNum === BT_BZ_GRAPH) {
            // below or above the midline
            return d[name] <= -5 ? GRAY : getBackgroundColor();
          }

          // use gray rather than the series color
          return GRAY;
        })
        .attr("fill-opacity", plotNum === KPAP_GRAPH ? 1.0 : (colorScheme === WHITE_SCHEME ? 0.15 : 0.5))
    ;
  }

  /**
   * (d3-specific) Draw the series as text numbers near the top of the plot.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
  function drawAsText(plot, plotBoxNum, plotNum, seriesNum) {

    // fall out if not AP
    if (!(plotNum === KPAP_GRAPH && seriesNum > 0)) {
      return;
    }

    // the data array driving this plot
    var data = getPlotData(plotNum);

    // fall out if no data
    if (data === undefined || data.length === 0) {
      return;
    }

    // get the width of one sample in pixels
    var width = sampleWidth(plotNum);

    // delete the existing text by removing the enclosing <g> node
    plot.selectAll(".g-dtext").remove();

    // set the clip rectangle on the plot box
    var box = plot.append("g")
        .attr("class", "g-dtext")
        .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")");

    // add the text element
    box.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "dtext")
        .attr("transform", function (d) {
          // center the text
          var x = x_scale(d.time_tag) + (width / 2);
          return "translate(" + x + "," + (boxDimensions[plotBoxNum].y1 + 8) + ")rotate(-90)";
        })
        .text(function (d) {
          return d.ap_daily;
        })
        .attr("text-anchor", "end")
      // center the text over the bar
        .attr("alignment-baseline", "central")
        .attr('font-size', apLabelFontSize + "pt")
        .attr("fill", getLabelColor());
  }

  /**
   * (d3-specific) Draw the series as text numbers near the top of the plot.
   * @param plot - the svg plot object
   * @param {number} plotBoxNum - the index of the plot on the page (0-based, from top)
   * @param {number} plotNum - the index into the plots array
   * @param {number} seriesNum - the index into the series array for this plot
   */
  function drawAsTextRecurrence(plot, plotBoxNum, plotNum, seriesNum) {

    // fall out if not AP
    if (!(plotNum === KPAP_GRAPH && seriesNum > 0)) {
      return;
    }

    // get the combined recurrence data
    var data = getRecurrenceData(plotNum);

    // fall out if no data
    if (data === undefined) {
      return;
    }

    // only draw future values
    var recurStart = moment.utc(lastKpApDataMoment).add(kpApResolutions[visibleIndex()], 'seconds').toDate();
    data = cutDataBeforeStart(data, recurStart);

    // fall out if no data
    if (data === undefined || data.length === 0) {
      return;
    }

    // get the width of one sample in pixels
    var width = sampleWidth(plotNum);

    // delete the existing text by removing the enclosing <g> node
    plot.selectAll(".g-rtext").remove();

    // set the clip rectangle on the plot box
    var box = plot.append("g")
        .attr("class", "g-rtext")
        .attr("clip-path", "url(#plot_clip_" + plotBoxNum + ")");

    // add the text element
    box.selectAll("text")
        .data(data)
        .enter()
        .append("text")
        .attr("class", "rtext")
        .attr("transform", function (d) {
          // center the text
          var x = x_scale(d.time_tag) + (width / 2);
          return "translate(" + x + "," + (boxDimensions[plotBoxNum].y1 + 8) + ")rotate(-90)";
        })
        .text(function (d) {
          return d.ap_daily;
        })
        .attr("text-anchor", "end")
      // center the text over the bar
        .attr("alignment-baseline", "central")
        .attr('font-size', apLabelFontSize + "pt")
        .attr('font-style', 'italic')
        .attr("fill", getLabelColor());
  }

  /**
   * Recreate the plots after updated data is received, old data is shifted off, or colors changed.
   */
  function replotData() {
    // TODO seems to be some d3 caching or something that causes replot to not work correctly in terms of changing the y-axis labels...
    buildPlots();

//    // update the reporting statistics
//    getStats();
//
//    // zooming, determine which spacecraft's data are visible
//    determineVisibleSource();
//
//    // update the start/end dates
//    updateDateLabels();
//
//    // set the x_scale domains
//    // TODO is this the right place for this?
//    updateXScaleDomains();
//
//    // rebuild the y axes based on the new, trimmed data set
//    // TODO is this the right place for this?
//    buildYAxes();
//
//    // update the data
//    reRenderSeries();
//
//    // redraw the data presence line
//    buildZoomDataPresenceLine();
  }

  /**
   * Build the currently visible Y axes.
   */
  function buildYAxes() {

    // handle switching between axis labels on the left and right
    var side = 'left';

    var plotList = getCurrentPlotList();

    // draw the series and bands
    for (var i = 0; i < plotList.length; i++) {

      // the plot we are working on
      var plt = plotList[i];

      // define the plot y-axis scales using the plot boxes for the ranges (the domains will be defined later)
      var box = boxDimensions[i];

      // define the plot y scale, use rangeRound() to improve rendering of strokewidth < 1 lines
      if (useLogAxis(plt)) {
        yScales[plt] = d3.scale.log().base(10).range([box.y0, box.y1]).rangeRound([box.y0, box.y1]);
      } else {
        yScales[plt] = d3.scale.linear().range([box.y0, box.y1]).rangeRound([box.y0, box.y1]);
      }

      // use log scale?
      if (useLogAxis(plt)) {
        if ('left' === side) {
          yAxisLeft[i] = buildLogAxis(plt, side, SHOW_LABELS);
          yAxisRight[i] = buildLogAxis(plt, side, NO_LABELS);
        } else {
          yAxisLeft[i] = buildLogAxis(plt, side, NO_LABELS);
          yAxisRight[i] = buildLogAxis(plt, side, SHOW_LABELS);
        }
      } else {
        if ('left' === side) {
          yAxisLeft[i] = buildLinearAxis(plt, side, SHOW_LABELS);
          yAxisRight[i] = buildLinearAxis(plt, side, NO_LABELS);
        } else {
          yAxisLeft[i] = buildLinearAxis(plt, side, NO_LABELS);
          yAxisRight[i] = buildLinearAxis(plt, side, SHOW_LABELS);
        }
      }

      // special case
      if (plt === PHI_GRAPH) {
        buildTowardsAway(box);
      }

      // toggle the y-axis labeling between left and right sides?
      if (Y_ALTERNATING_SCHEME === yLabelScheme) {
        side = ('left' === side) ? 'right' : 'left';
      }
    }
  }

  /**
   * Build the Towards / Away axis labels for the Phi plot.
   * @param box
   */
  function buildTowardsAway(box) {
    // this gets called often, only want one set
    main_graphic.selectAll('.towards-away').remove();

    var lineColor = getLineColor();
    var boxHeight = box.y0 - box.y1;
    var xTranslate = (yLabelScheme === Y_LEFT_SCHEME) ? plt_width + 14 : -4;

    main_graphic.append("text")
        .attr('class', 'towards-away')
        .text("Towards -")
      // not order-dependent
        .attr("transform", "translate(" + xTranslate + "," + (box.y0 - (boxHeight * 0.75)) + ")rotate(-90)")
        .attr("fill", lineColor)
        .attr("stroke", "none")
        .attr('font-size', '0.8em')
        .attr("text-anchor", "middle");

    main_graphic.append("text")
        .attr('class', 'towards-away')
        .text("Away +")
      // not order-dependent
        .attr("transform", "translate(" + xTranslate + "," + (box.y0 - (boxHeight * 0.26)) + ")rotate(-90)")
        .attr("fill", lineColor)
        .attr("stroke", "none")
        .attr('font-size', '0.8em')
        .attr("text-anchor", "middle");
  }

  /**
   * Get the overall plot min/max values, regardless of the number of series in the plot.
   * @param {number} plotNum - the index into the plots array
   * @returns {Object} - the overall extent of the data in this plot
   */
  function getPlotExtent(plotNum) {
    var extent = {};
    extent.min = Number.MAX_VALUE;
    extent.max = -Number.MAX_VALUE;

    // the series this plot shows
    var seriesList = SERIES_LISTS[plotNum];
    var seriesVisible = SERIES_VISIBLE[plotNum];

    // special case: ignore AP
    if (plotNum === KPAP_GRAPH) {
      seriesList = [KP_SERIES];
      seriesVisible = [true];
    }

    var data = getPlotData(plotNum);

    // on startup before the first data is fetched, the data arrays are undefined
    if (data !== undefined) {
      var series;
      var name;
      var mm;

      // loop through each series
      for (series = 0; series < seriesList.length; series++) {
        name = SERIES_NAMES[seriesList[series]];

        // the series extent should only be considered if the series is toggled on
        if (seriesVisible[series]) {

          // are the bands visible?
          if (useBands()) {
            // get the band minimum
            mm = getSeriesExtent(data, name + '_min');
            extent.min = (mm[0] < extent.min) ? mm[0] : extent.min;

            // get the band maximum
            mm = getSeriesExtent(data, name + '_max');
            extent.max = (mm[1] > extent.max) ? mm[1] : extent.max;
          } else {
            // no bands, just get the plain series extent
            mm = getSeriesExtent(data, name);

            extent.min = (mm[0] < extent.min) ? mm[0] : extent.min;
            extent.max = (mm[1] > extent.max) ? mm[1] : extent.max;
          }

          logSep(plotNum);
          logExtent("current   ", plotNum, extent);

          // expand the extent if there are matching overlays or recurrence series shown
          extent = widenExtent(name, extent, recurrenceScheme, filteredMagDataRecurrence, ['bt', 'bx_gsm', 'by_gsm', 'bz_gsm']);
          extent = widenExtent(name, extent, recurrenceScheme, filteredPlasmaDataRecurrence, ['speed', 'density', 'temperature']);
          logExtent("filtRecur", plotNum, extent);

          extent = widenExtent(name, extent, recurrenceScheme, filteredMdatar, ['bt', 'bx_gsm', 'by_gsm', 'bz_gsm']);
          extent = widenExtent(name, extent, recurrenceScheme, filteredPdatar, ['speed', 'density', 'temperature']);
          logExtent("filtPdatr ", plotNum, extent);

          extent = widenExtent(name, extent, geospaceScheme, geospaceData, ['bt', 'bz', 'speed', 'density', 'temperature']);
          extent = widenExtent(name, extent, enlilScheme, enlilData, ['speed', 'density', 'temperature']);
        }
      }
    }

    logExtent("final      ", plotNum, extent);
    logSep(plotNum);

    return extent;
  }

  function logExtent(msg, plotNum, extent) {
    if (plotNum === SPEED_GRAPH) {
//      log("getPlotExtent: " + msg + " " + extent.min + " " + extent.max);
  }
  }

  function logSep(plotNum) {
    if (plotNum === SPEED_GRAPH) {
//      log("---");
  }
  }

  /**
   * Widen the extent of the given series if the dataset (e.g., recurrence or overlay) has a matching series name.
   * @param {string} name - the name of the series being processed
   * @param {Object} extent - the current extent for the given series
   * @param {string} scheme - the additional data scheme
   * @param {*} data - the additional data to search
   * @param {Array} seriesNames - the additional data series names
   * @returns {Object} - the potentially updated extent
   */
  function widenExtent(name, extent, scheme, data, seriesNames) {
    // expand the extent if there are relevant overlays
    if (isDataPresent(scheme, data)) {

      // loop through each series looking for a match
      for (var series = 0; series < seriesNames.length; series++) {
        var overlayName = seriesNames[series];

        // does this series name match?
        if (overlayName === name) {
          var mm = getSeriesExtent(data, overlayName);

          // update the extent for this name
          extent.min = (mm[0] < extent.min) ? mm[0] : extent.min;
          extent.max = (mm[1] > extent.max) ? mm[1] : extent.max;
        }
      }
    }

    return extent;
  }

  /**
   * Get the series min/max values.
   * @param {Array} data - the data array (mag or plasma)
   * @param {String} name - the series name
   * @returns {Object} - the series data value extent (min/max)
   */
  function getSeriesExtent(data, name) {
    return d3.extent(data, function (d) {
      // only consider visible data
      var time = moment.utc(d.time_tag);
      return (time.isAfter(visibleStart()) && time.isBefore(visibleEnd())) ? d[name] : null;
    });
  }

  /**
   * Get the filtered data array (mag or plasma) this plot uses.
   * @param {number} plotNum - the index into the plots array
   * @returns {*} - the data array this plot uses
   */
  function getPlotData(plotNum) {
    var dataSet;
    switch (DATA_SET[plotNum]) {
      case USE_MAG:
        dataSet = filteredMagData;
        break;
      case USE_PLASMA:
        dataSet = filteredPlasmaData;
        break;
      case USE_KPAP:
        dataSet = kpApData;
        break;
    }
    return dataSet;
  }

  /**
   * Get the filtered recurrence data array (mag or plasma) this plot uses.
   * @param {number} plotNum - the index into the plots array
   * @returns {Array} - the data array this plot uses
   */
    //TODO refactor to combine into non and recur pairs, use argument to determine which returned
  function getPlotDataRecurrence(plotNum) {
    var dataSet;
    switch (DATA_SET[plotNum]) {
      case USE_MAG:
        dataSet = filteredMagDataRecurrence;
        break;
      case USE_PLASMA:
        dataSet = filteredPlasmaDataRecurrence;
        break;
      case USE_KPAP:
        dataSet = kpApDataRecurrence;
        break;
    }
    return dataSet;
  }

  /**
   * Get the filtered current-recurrence data array (mag or plasma) this plot uses.
   * @param {number} plotNum - the index into the plots array
   * @returns {Array} - the data array this plot uses
   */
  function getPlotDataRecurrenceR(plotNum) {
    var dataSet;
    switch (DATA_SET[plotNum]) {
      case USE_MAG:
        dataSet = filteredMdatar;
        break;
      case USE_PLASMA:
        dataSet = filteredPdatar;
        break;
      case USE_KPAP:
        dataSet = kdatar;
        break;
    }
    return dataSet;
  }

  /**
   * Get the combined recurrence data (previous 27 days + current timespan), which will be adjusted forward +27 days.
   * @param {number} plotNum - the index into the plots array
   * @returns {*} - the combined recurrence data array
   */
  function getRecurrenceData(plotNum) {
    var data;

    // use recurrence data?
    if (timespans[visibleIndex()] < 365 * 1440) {
      // get the data from -54 to -27 days ago. This will fetch one or two files, so won't be exactly that span
      var data1 = getPlotDataRecurrence(plotNum);

      // default to using just this dataset
      data = data1;

      // for timespans > 27 days, need to also repeat the current data shifted forward by 27 days
      if (timespans[currentIndex] >= CARRINGTON_ROTATION_MINUTE) {
        data = combineData(data1, getPlotDataRecurrenceR(plotNum));
      }
    } else {
      // for timespans 1 year or longer, didn't need to fetch recurrence data, it won't show recurrence for only the first month, but that's ok
      data1 = getPlotData(plotNum);

      // make a deep copy
      data = JSON.parse(JSON.stringify(data1));
      markRecur(data);
    }

    var done;
    var newData;
    if (data !== undefined) {
      newData = data.slice();
      done = false;
      for (var k = 0; k < newData.length && !done; k++) {
        // cut data after endMoment, which won't be visible
        var m = moment.utc(newData[k].time_tag);
        if (m.isAfter(endMoment)) {
          // done searching, the rest will be discarded
          done = true;
        }
      }

      // if we found an element after the end moment, slice the array up to that point
      if (done) {
        // make a shallow copy
        newData = newData.slice(0, k);
      }
    }

    return newData;
  }

  /**
   * Redraw the plots after the render scheme has changed (marker vs line). This entails removing and recreating the SVG trees for each plot. The axes aren't
   * affected.
   */
  function reRenderSeries() {
    // log("reRenderSeries");
    // fall out if data not loaded
    if (!allDataLoaded()) {
      return;
    }

    var seriesCount = 0;
    var plotList = getCurrentPlotList();

    // for each plot on the page
    for (var i = 0; i < plotList.length; i++) {
      // the plot we are working on
      var plt = plotList[i];

      // the series this plot shows
      var seriesList = SERIES_LISTS[plt];

      // update the data for each series
      for (var k = 0; k < seriesList.length; k++) {

        // draw the series and bands
        drawSeries(seriesD3[seriesCount], i, plt, k);
        seriesCount++;
      }
    }

    // draw the flag strips
    drawFlags("source");
    //TODO for now, rely on folding into "suspect"
//    drawFlags("maneuver");
    drawFlags("quality");
    drawFlags("density");
  }

  /**
   * Get the current browser system UTC time as a Moment object.
   * @returns {Object} - the current browser UTC time
   */
  function calculateNowDate() {

    // get the current system time of the system the browser is running on
    var now = moment.utc();

    // round it to the start of the current period (always use Mag periods)
    return roundToPeriodStart(now, visibleResolution());
  }

  /**
   * Get the correct data service query tag used to build a JSON file name based on the current time span.
   * @returns {string} - the data service tag, e.g., '1-day'
   */
  function getDataServiceTag() {
    var index;

    // override if zoomed
    if (zoomIndex !== undefined && zoomIndex !== null) {
      index = zoomIndex;
    } else {
      index = currentIndex;
    }

    return files[index];
  }

  /**
   * (d3-compliant) Convert from DTS Data Service JSON format to an object.
   * Ex. inData = [["time_tag","density","speed","temperature"],
   * ["2015-11-06 19:47:00","2.29334","622.3361","481465.5"],
   * ["2015-11-06 19:48:00","2.956252","637.0074","650436.1"],
   * ["2015-11-06 19:49:00","3.088083","624.1366","558307.2"]]
   * Ex: returns an object containing one sub-object per column:
   * density: Object
   *   data: Array[2]
   *   element 0:
   *   0: "2015-11-06 19:47:00"
   *   1: 6.977247
   *   element 1:
   *   0: "2015-11-06 19:48:00"
   *   1: 6.855263
   *   max: 6.977247
   *   min: 6.855263
   * speed...
   * @param {Array} inData - the data as parsed from the JSON file (an array of arrays)
   * @param {boolean} isInitialLoad - true if this is an initial load, false if a 5-minute update
   * @param {number} resolution - the data resolution in seconds
   * @param {Object} lastData - the timestamp of the last data of this type (Mag or Plasma) as a Moment
   * @returns {Array} - the data converted to an array of objects
   */
  function convertJSONToPlotData(inData, isInitialLoad, resolution, lastData) {
//    log("convertJson: length " + inData.length);
//    for (var k = 0; k < 2; k++) {
//      log("inData[" + k + "] " + JSON.stringify(inData[k]));
//    }
//
//    k = inData.length - 1;
//    log("inData[" + k + "] " + JSON.stringify(inData[k]));

    var rootD3 = [];
    // fall out if file only contains the column names
    if (inData.length < 2) {
      return rootD3;
    }

    var obj;
    var name;
    var row;
    var column;
    var m;
    var k;

    var vsMs = visibleStart().valueOf();
    var veMs = visibleEnd().valueOf();
    var visibleCount = 0;
    var nullCount = 0;
    var time;
    var timeMs;
    var tempTime;
    var source;
    var active;
    var addNull;
    var nonNull;
    var value;

    // get the column names from the first element
    var names = inData[0];

    var isKp = (names[1] === 'kp');

    // keep track of the previous record timestamp of *each source* in order to detect and fill gaps independently for each source
    var previousTimeMs = [];
    for (k = 0; k < 10; k++) {
      if (lastData === undefined) {
        previousTimeMs[k] = inData[0].time_tag;
      } else {
        previousTimeMs[k] = (isInitialLoad) ? inData[0].time_tag : lastData.valueOf();
      }
    }

    // Loop through all rows excluding the 1st column name row
    for (row = 1; row < inData.length; row++) {

      // extract the Unix timestamp offset for this row
      timeMs = moment.utc(inData[row][0]).valueOf();
//      log("convertJson: row " + row + " timeMs " + moment.utc(timeMs).format(DATE_FORMAT_DISPLAY));

      // default to source 0, since some data files don't have a source column
      source = 0;
      active = 0;
      for (column = 1; column < names.length; column++) {
        if (names[column] === 'source') {
          source = inData[row][column];
        }
        if (names[column] === 'active') {
          active = inData[row][column];
        }
      }

//      log("inData[" + row + "] " + JSON.stringify(inData[row]));

      // the number of null records to add to each column to fill the gap
      addNull = getAddNullCount(previousTimeMs[source], timeMs, resolution);

      if (addNull > 0) {
//        log("convertJson: ideally adding " + addNull + " nulls between previousTimeMs[" + source + "] " +
//            moment.utc(previousTimeMs[source]).format(DATE_FORMAT_DISPLAY) + " " + moment.utc(timeMs).format(DATE_FORMAT_DISPLAY));

        // only need one to cause a break in the line or band; using only one reduces # of d3 DOM elements
        if (addNull > 1) {
          addNull = 1;
        }

        // add a null in the data gap
        for (m = 0; m < addNull; m++) {

          // compute the time of the null record
          time = moment.utc(previousTimeMs[source]).add((m + 1) * resolution, 'seconds');

          // create the object for this row
          obj = {time_tag: parseDate2(time.format(DATE_FORMAT_FILE))};

          // Loop through each data column excluding time, e.g., density or Bz
          for (column = 1; column < names.length; column++) {

            // the column being built, i.e., density
            name = names[column];

//          log("pushing null for column " + name + " for time " + time.format(DATE_FORMAT_FILE));
            // add null value for this column
            obj[name] = null;
          }

          // nulls are added per source
          obj.source = parseFloat(source);
          obj.active = parseFloat(active);

          // add the object which contains sub-objects for each time tag and each value
          rootD3.push(obj);
          nullCount++;

//        log("added null at " + obj.time_tag);
//          log("added null obj " + JSON.stringify(obj));
        }
      }

      // determine if this is a non-null record
      nonNull = false;

      // create the object for this row
      tempTime = inData[row][0];
      if (tempTime.indexOf('.000')) {
        tempTime = tempTime.substring(0, 19);
      }
      obj = {time_tag: parseDate2(tempTime)};
//        log("parsed time of " + JSON.stringify(obj) + " from " + inData[row][0] + " tempTime " + tempTime);

      // Loop through each data column excluding time, e.g., density or Bz
      for (column = 1; column < names.length; column++) {

        // the column being built, i.e., density
        name = names[column];

        value = null;

        // extract the column value. Note that boolean flag values must be encoded as 0/1 rather than true/false
        if (inData[row][column] != null) {
          value = parseFloat(inData[row][column]);

          // there is a non-null value, so this is a good record
          nonNull = true;

          // TODO this should never happen, indicates problem in file
          if (name === 'density' && value < 0) {
//              log("negative density! " + value);
            value = 0.0001;
          }

          // hack for geospace
          if (name === 'propagated_time_tag') {
            tempTime = inData[row][column];
            if (tempTime.indexOf('.000')) {
              tempTime = tempTime.substring(0, 19);
            }
            value = parseDate2(tempTime);
          }
        }

        obj[name] = value;
      }

      // add the object which contains sub-objects for each time tag and each value
      rootD3.push(obj);

//      log("rootD3 adding " + JSON.stringify(obj));

      // is this sample non-null and within the currently visible (possibly zoomed) timespan?
      if (nonNull && timeMs > vsMs && timeMs < veMs) {
        visibleCount++;
      }

      // save this time for processing the next row
      previousTimeMs[source] = timeMs;
    }

//    log("done converting from JSON visibleCount " + visibleCount);
//
//    log("rootD3 length " + rootD3.length + " including " + nullCount + " added nulls " + invisibleCount + " less trimmed");

//    for (k = 0; k < 1; k++) {
//      log("rootD3[" + k + "] " + JSON.stringify(rootD3[k]));
//    }
//    k = rootD3.length - 1;
//    log("rootD3[" + k + "] " + JSON.stringify(rootD3[k]));

//    for (k = 0; k < rootD3.length; k++) {
//      var d = rootD3[k];
//      log("convertJson: "+ moment.utc(d.time_tag).format(DATE_FORMAT_DISPLAY) + " sourceScheme " + sourceScheme + " d.source " + d.source +
//          " d.active " + d.active);
//      log("convertJson: rootD3[" + k + "] " + JSON.stringify(d));
//    }

//    log("rootD3 size " + rootD3.length + " including " + nullCount + " nulls");
    return rootD3;
  }

  /**
   * Determine how many null records are required to fill the data gap.
   * @param {number} previousTimeMs - the timestamp of the previous record in milliseconds, or -1
   * @param {number} timeMs - the timestamp of the current non-null record being processed, in milliseconds
   * @param {number} resolution - the data resolution in seconds
   * @returns {number} - the number of null records required to fill the gap
   */
  function getAddNullCount(previousTimeMs, timeMs, resolution) {
    // the number of null records to add to fill the gap
    var addNull = 0;

    // is there a data gap?
    var delta = Math.floor((timeMs - previousTimeMs) / (resolution * ONE_SECOND_MS));
    if (delta > 1) {
      // determine the number of missing records
      addNull = delta - 1;
    }

    return addNull;
  }

  /**
   * Build a linear y axis including ticks.
   * @param {number} plotNum - the index into the plot array
   * @param {String} side - which side to put the axis on: left or right
   * @param {boolean} showLabels - true if the axis labels should be shown
   * @returns {Object} - the y axis object
   */
  function buildLinearAxis(plotNum, side, showLabels) {
    var sy = {};

    // Phi graph has special domain and ticks
    if (plotNum === PHI_GRAPH) {
      // TODO delete all showMark, not used for d3
      // Phi uses a fixed scale from 45-405, with gridlines at 135 and 315
      // add the min/max as minor ticks so that a gridline won't be drawn over the border
      sy.min = PHI_ADJUST;
      sy.max = 360 + PHI_ADJUST;
      sy.ticks = [
        {value: sy.min, showLabel: false, showMark: false, showGridline: false},
        {value: 135, showLabel: true, showMark: true, showGridline: true},
        {value: 315, showLabel: true, showMark: true, showGridline: true},
        {value: sy.max, showLabel: false, showMark: false, showGridline: false}
      ];
    } else if (plotNum === THETA_GRAPH) {
      // add the min/max as minor ticks so that a gridline won't be drawn over the border
      // return {ticks: [minMaxTick(-90), -45, 0, 45, minMaxTick(90)]};
      sy.min = -90;
      sy.max = 90;
      sy.ticks = [minMaxTick(-90),
        {value: -45, showLabel: true, showMark: true, showGridline: true},
        {value: 0, showLabel: true, showMark: true, showGridline: true},
        {value: 45, showLabel: true, showMark: true, showGridline: true},
        minMaxTick(90)];

    } else if (plotNum === KPAP_GRAPH) {
      sy.min = 0;
      sy.max = 9;

      // define the ticks and horizontal gridlines
      sy.ticks = [];
      for (var i = 0; i <= 9; i++) {
        sy.ticks.push({value: i, showLabel: true, showGridline: true});
      }

      // don't show the gridline at the top and bottom edge
      sy.ticks[0].showGridline = false;
      sy.ticks[9].showGridline = false;
    } else {
      var extent = getPlotExtent(plotNum);
      var forceZero = FORCE_ZEROES[plotNum];

      // are there user-entered values?
      if (yAxisMin[plotNum] !== undefined) {
        // use the user-entered min/max
        extent.min = yAxisMin[plotNum];
        extent.max = yAxisMax[plotNum];

        // don't force a zero, let the user min/max drive the scale
        forceZero = DO_NOT_FORCE_ZERO;
      }

      // constrain the BtBz scale to a minimum of +/-10 to keep noise-level data from appearing larger
      if (plotNum === BT_BZ_GRAPH) {
        extent.min = (extent.min > -10 ? -10 : extent.min);
        extent.max = (extent.max < 10 ? 10 : extent.max);
      }

      // determine the scale based on the data
      sy = calculateScaleYAxis(extent.min, extent.max, MIN_INTERVALS[plotNum], forceZero);
    }

    // start fresh, as the gridlines may change each time
    yGridlines[plotNum] = [];

    // define the tick marks
    var axis_ticks = [];
    for (var k = 0; k < sy.ticks.length; k++) {
      // add label
      if (sy.ticks[k].showLabel) {
        axis_ticks.push(sy.ticks[k].value);
      }

      // add gridlines
      if (sy.ticks[k].showGridline) {
        yGridlines[plotNum].push(sy.ticks[k].value);
      }
    }

    var yScale = yScales[plotNum];

    // define the d3 data domain for this plot
    yScale.domain([sy.min, sy.max]);

    // create the axis with labels on one side only
    var axis;

    if (showLabels) {
      axis = d3.svg.axis().scale(yScale).orient(side).tickValues(axis_ticks).tickFormat(d3.format('d')).innerTickSize(-TICK_SIZE).outerTickSize(0);
    } else {
      axis = d3.svg.axis().scale(yScale).orient(side).tickValues(axis_ticks).tickFormat('').tickSize(TICK_SIZE);
    }
    return axis;
  }

  /**
   * (d3-specific) Build a log Y axis including ticks.
   * @param {number} plotNum - the index into the plot array
   * @param {String} side - which side to put the axis on: left or right
   * @param {boolean} showLabels - true if the axis labels should be shown
   * @returns {Object} - the Y-axis object
   */
  function buildLogAxis(plotNum, side, showLabels) {
    var sy;

    // are there overriding user-entered values?
    if (yAxisMin[plotNum] !== undefined) {
      // use the user-entered min/max
      sy = calculateLogScaleYAxis(yAxisMin[plotNum], yAxisMax[plotNum]);
    } else {
      // no override
      if (plotNum === TEMP_GRAPH) {
        // temp is special case, use a fixed scale
        sy = calculateTempLogScaleYAxis();
      } else {
        // adjust the scale to the data
        var extent = getPlotExtent(plotNum);
        sy = calculateLogScaleYAxis(extent.min, extent.max);
      }
    }

    // start fresh, as the gridlines may change each time
    yGridlines[plotNum] = [];

    // define the tick marks
    var axis_ticks = [];
    for (var k = 0; k < sy.ticks.length; k++) {
      axis_ticks.push(sy.ticks[k].value);

      // add gridlines
      if (sy.ticks[k].showGridline) {
        yGridlines[plotNum].push(sy.ticks[k].value);
      }
    }

    var yScale = yScales[plotNum];

    // define the d3 data domain for this plot
    yScale.domain([sy.min, sy.max]);

    // create the axis with labels on one side only
    var axis;
    if (showLabels) {
      if (plotNum === DENS_GRAPH) {
        // use integer labels (e.g., 1-100)
        axis = d3.svg.axis().scale(yScale).orient(side).ticks(3).tickValues(axis_ticks).innerTickSize(-TICK_SIZE).outerTickSize(0).tickFormat(function (d) {
          return yScale.tickFormat(3, d3.format("d"))(d)
        });
      } else if (plotNum === TEMP_GRAPH) {
        // automatically generate minor ticks, but only add labels where specified
        axis = d3.svg.axis().scale(yScale).orient(side).tickValues([1.0E+4, 1.0E+5, 1.0E+6]).tickFormat(d3.format(".0e"))
            .innerTickSize(-TICK_SIZE).outerTickSize(0);
      } else {
        // all other plots
        axis = d3.svg.axis().scale(yScale).orient(side).ticks(3).tickValues(axis_ticks).innerTickSize(-TICK_SIZE).outerTickSize(0);
      }
    } else {
      // the unlabeled axis with ticks inward
      axis = d3.svg.axis().scale(yScale).orient(side).ticks(3).tickFormat('').tickSize(TICK_SIZE);
    }

    return axis;
  }

  /**
   * Calculate the y-axis tick marks.
   * @param {number} min - the minimum value
   * @param {number} max - the maximum value
   * @returns {Object} - an object containing the array of ticks
   */
  function calculateLogScaleYAxis(min, max) {
    var yaxisVals = {};
    var tickVals = [];
    var j;
    var i;
    var i2;
    var k;
    var x;

    // round the max up to the nearest power of 10
    max = roundToNearestPowerOf10(max);

    // brute force, find the minimum value in steps of 10x. artificially clip values at 0.1 (start / 10) by default, 1.0 for SWFO
    var start = (isSwfo()) ? 10 : 1;
    for (i = start; i <= max; i = i * 10) {
      j = i;

      // if the step is larger than the minimum data value, we've found the minimum
      if (i > min) {
        // use the next lower 10x step as the axis minimum
        // add a minor tick so that a gridline won't be drawn over the border
        tickVals.push(minMaxTick(i / 10));
        break;
      }
    }

    // start searching for the maximum value in steps of 10x from where we left off
    for (i2 = j; i2 <= max; i2 = i2 * 10) {

      // add minor ticks between each major tick
      x = i2 / 10;
      for (k = 1; k < 9; k++) {
        tickVals.push(minorTick(x + (k * x)));
      }

      // if the step is larger than the maximum data value, we're done
      if (i2 > max) {
        // add a minor tick so that a gridline won't be drawn over the border
        tickVals.push(minMaxTick(i2));

        break;
      } else {
        // add a major tick
        tickVals.push({value: i2, showLabel: true, showMark: true, showGridline: true});
      }
    }

    // set the axis ticks
    yaxisVals.ticks = tickVals;
    yaxisVals.min = (tickVals.length > 0) ? tickVals[0].value : 1;
    yaxisVals.max = (tickVals.length > 0) ? tickVals[tickVals.length - 1].value : 10;

    return yaxisVals;
  }

  function calculateTempLogScaleYAxis() {
    var yaxisVals = {};
    var tickVals = [];

    // the applicable range for actual solar wind, 5K-5M degrees
    var min = 5.0E+3;
    var max = 5.0E+6;

    tickVals.push(minMaxTick(min));
    tickVals.push({value: 1.0E+4, showLabel: true, showMark: true, showGridline: true});
    tickVals.push({value: 1.0E+5, showLabel: true, showMark: true, showGridline: true});
    tickVals.push({value: 1.0E+6, showLabel: true, showMark: true, showGridline: true});
    tickVals.push(minMaxTick(max));

    // set the axis ticks
    yaxisVals.ticks = tickVals;
    yaxisVals.min = tickVals[0].value;
    yaxisVals.max = tickVals[tickVals.length - 1].value;

    return yaxisVals;
  }

  /**
   * Calculate the y-axis linear scale and ticks, example: newYAxis = calculateScaleYAxis(speed.min, speed.max, 100, false);
   * @param {number} min - the minimum Y value of the current plot data
   * @param {number} max - the maximum Y value of the current plot data
   * @param {number} minSeparation - the nominal tick separation in Y units (e.g., nT for Bz)
   * @param {boolean} forceZero - if true, force a zero in the center of the y-axis (e.g., for Bt)
   * @returns {Object} - an object containing y-axis parameters
   */
  function calculateScaleYAxis(min, max, minSeparation, forceZero) {
    var yAxis = {};
    yAxis.ticks = [];

    // if there is only one data point, the min will equal the max. Bump it a little until more data arrives
    if (max === min) {
      max += 1;
    }

    // gracefully increase the minimum separation as needed (for mag field)
    if (minSeparation === MIN_B_INTERVAL && forceZero) {
      if (min < -70 || max > 70) {
        minSeparation = 50;
      } else if (min <= -40 || max >= 40) {
        minSeparation = 20;
      } else if (min <= -20 || max >= 20) {
        minSeparation = 10;
      }
    } else if (minSeparation === MIN_SPEED_INTERVAL) {
      if (max - min > minSeparation) {
        minSeparation = 100;
//        log("changing minSep " + minSeparation);
      }
    }
//    log( " min " + min + " max " + max + " minSep " + minSeparation);

    // adjust the min value
    var remainder = min % minSeparation;
    if (remainder !== 0) {
      // need to push the max to the next higher boundary
      if (min > 0) {
        // go up to the next minSeparation boundary
        min = min - remainder;
      } else if (min < 0) {
        // go down to the next minSeparation boundary
        min = min - (minSeparation + remainder);
      }
    }

    // adjust the max value
    remainder = max % minSeparation;
    if (remainder !== 0) {
      // need to push the max to the next higher boundary
      if (max > 0) {
        // go up to the next minSeparation boundary
        max = max + (minSeparation - remainder);
      } else if (max < 0) {
        // go down to the next minSeparation boundary
        max = max - remainder;
      }
    }

//    log( " min " + min + " max " + max);

    // force the zero line to be in the middle of the plot
    if (forceZero == true) {
      if (min > 0 && max > 0) {
        // both positive
        min = -max;
      } else if (min < 0 && max < 0) {
        // both negative
        max = -min;
      } else {
        // one positive, one negative
        if (Math.abs(min) > Math.abs(max)) {
          max = -min;
        } else {
          min = -max;
        }
      }
    }

    // explicitly define the array of tick values
    yAxis.ticks = computeYTicks(min, max, minSeparation, forceZero);

    yAxis.min = min;

    // the max may have been increased by computeYTicks
    yAxis.max = (yAxis.ticks.length > 0) ? yAxis.ticks[yAxis.ticks.length - 1].value : min * 10;

//    log( " ymin " + yAxis.min + " ymax " + yAxis.max + " ticks " + JSON.stringify(yAxis.ticks));

    return yAxis;
  }

  /**
   * Compute the intermediate tick locations for the given min/max.
   * @param {number} min - the axis minimum value
   * @param {number} max - the axis maximum value
   * @param {number} minSeparation - the minimum separation between ticks
   * @param {boolean} forceZero - true if the zero axis must be shown, which implies a gridline
   * @returns {Array} - the array of tick objects
   */
  function computeYTicks(min, max, minSeparation, forceZero) {
    var ticks = [];

    // explicitly define the array of tick values
    var cnt = 0;
    for (var i = min; i <= max; i += minSeparation) {
      ticks[cnt++] = createTick(i, forceZero);
    }

    // if there are too many intervals, adjust the tick separation if necessary by recursively calling with doubled tick separation until the number of
    // intervals is under the maximum
    var numIntervals = (max - min) / minSeparation;
    if (numIntervals > MAX_Y_INTERVALS) {
      // too many, reduce
      ticks = [];

      // ensure that there will be an odd number of ticks, which include at least min+zero+max
      if (forceZero) {
        cnt = 0;
        for (i = min; i <= max; i += max / 2) {
          ticks[cnt++] = createTick(i, forceZero);
        }
      } else {
        cnt = 0;
        for (i = min; i <= max + minSeparation; i += minSeparation * 2) {
          ticks[cnt++] = createTick(i, forceZero);
        }
      }
    } else if (numIntervals < MIN_Y_INTERVALS && !forceZero) {
      // too few, increase
      ticks = [];
      cnt = 0;
      for (i = min; i <= max; i += minSeparation / 2) {
        ticks[cnt++] = createTick(i, forceZero);
      }

      // still too few, just use the min and max as ticks
      if (cnt === 1) {

        // tick with no gridline at max
        ticks[cnt] = createTick(max, false);
      }
    }

    return ticks;
  }

// ***********************************************************************************************************
//  touch event handlers
// ***********************************************************************************************************

  /**
   * Handle pan movement to slide the zoom box left/right.
   * @param {number} deltaX - the number of pixels moved by the user (negative = left pan, positive = right pan)
   */
  function panMove(deltaX) {

    // get the currently visible time span
    var visibleSpanHours = visibleSpan();

    //log('panMove is zoomed, deltaX ' + deltaX + ' visible span ' + sigFig(visibleSpanHours));

    // the current scaling based on the zoomed span
    var pixelsPerHour = getPlotWidth() / visibleSpanHours;

    // compute the new zoom range in time units
    var deltaTime = (deltaX / pixelsPerHour) * ONE_HOUR_MS;

    // the zoom box may be panned left or right to zoom into different areas of the data
    if (deltaX < 0) {
      // pan left, show older data
      zoomStartMoment = moment.utc(panZoomStartMoment).add(deltaTime);

      // keep the left edge of the zoom box from scrolling off the left edge of the plot
      if (zoomStartMoment.isBefore(startMoment)) {
        zoomStartMoment = moment.utc(startMoment);
      }

      zoomEndMoment = moment.utc(zoomStartMoment).add(visibleSpanHours * ONE_HOUR_MS);
//            debug("panning left " + zoomStartMoment.format("ddd hh:mm") + " to " + zoomEndMoment.format("ddd hh:mm"));

    } else {
      // pan right, show newer data
      deltaTime += visibleSpanHours * ONE_HOUR_MS;
      zoomEndMoment = moment.utc(panZoomStartMoment).add(deltaTime);

      // keep the right edge of the zoom box from scrolling off the right edge of the plot
      if (zoomEndMoment.isAfter(endMoment)) {
        zoomEndMoment = moment.utc(endMoment);
      }

      zoomStartMoment = moment.utc(zoomEndMoment).subtract(visibleSpanHours * ONE_HOUR_MS);
//            debug("panning right " + zoomStartMoment.format("ddd hh:mm") + " to " + zoomEndMoment.format("ddd hh:mm") + " visibleSpan " + sigFig(visibleSpanHours));
    }

    // compute the resulting zoom box in pixels
    zoomStartPixel = convertMomentToPixels(zoomStartMoment);
    zoomEndPixel = convertMomentToPixels(zoomEndMoment);

    // update the zoom box as feedback to the user. The zoom of the plots won't happen until the pinch action ends
    drawZoomBoxD3(zoomController);
  }

  /**
   * Begin a pinch (zoom in) or zoom out operation.
   * @param {number} scale - the scaling factor of the pinch (<1 = zoom in, >1 = zoom out)
   */
  function pinchMove(scale) {
//        log('pinchMove cx ' + centerX + ' scale ' + scale);

    try {
      // enter zoom mode
      isZoomed = true;

      // get the zoomed visible span in time units
      var visibleSpanHours = currentSpanHours / scale;

      // cap the zoom to reasonable limits
      if (visibleSpanHours < 0.25) {
        // zoom in (magnify), limit the zoom in to 15 minutes
        visibleSpanHours = 0.25;

        // adjust the scale to match new new visible span
        scale = currentSpanHours / visibleSpanHours;
      } else if (visibleSpanHours > currentSpanHours) {
        visibleSpanHours = currentSpanHours;
        debug("resetting to original time span...");

        // zoom out (reduce), redraw at the original time span if maxxed out
        zoomReset(null, false);
        feedback('');
      }

//            debug('visible span ' + sigFig(visibleSpanHours) + ' hrs, scale ' + sigFig(scale) + "x, current span " + currentSpanHours + " hrs");

      if (isZoomed) {
//                debug('is zoomed, visible span ' + sigFig(visibleSpanHours) + ' scale ' + sigFig(scale));

        // the current scale which is always relative to the original time span
        var pixelsPerHour = getPlotWidth() / currentSpanHours;
        var newPixelsPerHour = pixelsPerHour * scale;

        if (isSmallScreen) {
          // since the screen is small, zooming is on the screen as a whole rather than each plot

          // determine the right side of the zoom box
          if (lastDataMoment == undefined && lastDataMoment == null) {
            // no data, use the right side of the plot
            zoomEndMoment = moment.utc(endMoment);
          } else {
            // the zoom box should default to include the latest data, then work backwards from there
            zoomEndMoment = moment.utc(lastDataMoment);
          }

          // determine the left side of the zoom box
          zoomStartMoment = moment.utc(zoomEndMoment).subtract(visibleSpanHours * ONE_HOUR_MS);

          // limit the zoom start date to the current start date
          if (zoomStartMoment.isBefore(startMoment)) {
            zoomStartMoment = moment.utc(startMoment);
          }
        } else {
          // assume desktop or laptop or large tablet, with enough physical size to allow zooming directly on an individual plot

          // convert the center position from screen to plot time coordinates
          var cPercentage = 0.5;
          var cx = visibleSpanHours * cPercentage;
          var cTime = moment.utc(startMoment).add(cPercentage * currentSpanHours * ONE_HOUR_MS);

          // compute the new zoom range in time units
          zoomStartMoment = moment.utc(cTime).subtract((cx / newPixelsPerHour) * ONE_HOUR_MS);

          // limit the zoom start date to the current start date
          if (zoomStartMoment.isBefore(startMoment)) {
            zoomStartMoment = moment.utc(startMoment);
          }

          // compute the end date by adding the zoomed span length to the zoom start
          zoomEndMoment = moment.utc(zoomStartMoment).add(visibleSpanHours * newPixelsPerHour * ONE_HOUR_MS);

          // limit the zoom end date to the current end date
          if (zoomEndMoment.isAfter(endMoment)) {
            zoomEndMoment = moment.utc(endMoment);
          }
        }

//                debug("zooming " + " startDate " + startDate.format('ddd hh:mm') + " "
//                    + zoomStartMoment.format("ddd hh:mm") + " to " + zoomEndMoment.format("ddd hh:mm") + ", " + sigFig(scale) + "x");

        // compute the zoom box in pixels
        zoomStartPixel = convertMomentToPixels(zoomStartMoment);
        zoomEndPixel = convertMomentToPixels(zoomEndMoment);

        // debug("pinchMove zoom px " + zoomStartPixel + " to " + zoomEndPixel + ", vs " + sigFig(visibleSp));

        // update the zoom box as feedback to the user. The zoom of the plots won't happen until the pinch action ends
        drawZoomBoxD3(zoomController);
      }
    } catch (e) {
      log("ERROR: exception " + e.name + "\n" + e.message + "\n" + e.stack);
    }
  }

  /**
   * Redraw the zoomed plots after pinch or pan.
   */
  function updateZoom() {
    debug("in updateZoom");

    if (isZoomed) {
      replotData();
      debug("updated zoom");
    }
  }

// ***********************************************************************************************************
//  mouse event handlers
// ***********************************************************************************************************

  /**
   * Start zooming on mouse down in a normal plot.
   * @param {number} x - the mouse x pixel offset from the left of the plot
   */
  function mousedownD3(x) {
    // fall out if touch
    if (isTouchSupported) {
      // the start of a tap
//      log("mouseDown, touch!");
      return;
    }

    // mouse button down
    isButtonDown = true;

//    log("mousedownD3: x " + x);

    // save the mouse x position in pixels from the left of the plot
    zoomStartPixel = x;

    if (isZoomed) {
//      log("mouseDown: isZoomed, setting drilldown to true");
      // this needs to be here to draw the zoom box during the subsequent mouse moves
      drilldown = true;
    }

    // save the mouse x position in user time coordinates
    zoomStartMoment = moment.utc(x_scale.invert(x));
//    log("mousedownD3: zoomStartMoment " + zoomStartMoment.format(DATE_FORMAT_DISPLAY));
  }

  /**
   * End zooming on mouse up in a normal plot.
   * @param {number} x - the mouse x pixel offset from the left of the plot
   */
  function mouseUpD3(x) {
//    log("mouseUpD3: x " + x);

    // make the zoom rectangles invisible again
    dragbox.attr("display", "none");

    if (isTouchSupported) {

      // store the tapped time coordinate
      tappedDataposXMoment = moment.utc(x_scale.invert(x));

//      log("d3 mouseUp, touch! setting tapped, isZoomed " + isZoomed + " tap time " + tappedDataposXMoment.format(DATE_FORMAT_DISPLAY) + " tap pixel " + x);

      // update the value readout to the tapped position
      updateMouseOverlay(x);
    } else {
      // is mouse event
//      log("mouseUpD3: gonna zoom");

      isButtonDown = false;
      //  feedback("mouseUp gridpos " + gridpos);

      // fall out if user had not started zooming
      if (zoomStartPixel === undefined) {
//        log("zoomStartPixel undefined, cancelling zoom");
        return;
      }

      // user has to move a least a few pixels to count as a zoom
//      log("delta movement " + (Math.abs(x - zoomStartPixel)) + " min zoom movement " + MIN_ZOOM_MOVEMENT);
      if (Math.abs(x - zoomStartPixel) < MIN_ZOOM_MOVEMENT) {
        cancelZoom();
        feedback("too few pixels, cancelling current zoom operation");
        return;
      }

      // assume moving left to right, so the mouse up is the end
      // get the timestamp that correlates to the pixel location
      zoomEndMoment = moment.utc(x_scale.invert(x));
//      log("mouseUpD3: zoomEndMoment " + zoomEndMoment.format(DATE_FORMAT_DISPLAY));
      zoomEndPixel = x;

      // perform the zoom operation
      zoomD3();
    }
//    log("mouseUpD3: done");
  }

  /**
   * Move the mouse cursor location using the left/right arrow keys.
   * @param {Object} ev - the d3 keydown event
   */
  function keyMouseMove(ev) {
    if (ev.keyCode === 37 || ev.keyCode === 39) {
      // get the current cursor x offset
      var x = d3.transform(focus.attr("transform")).translate[0];

      // get the width of one data sample in pixels
      var deltaX = sampleWidth(getCurrentPlotList()[0]);

      if (ev.keyCode === 37) {
        // scroll left
        x -= deltaX;
      } else if (ev.keyCode === 39) {
        // scroll right
        x += deltaX;
      }

      // move the mouse position
      updateMouseOverlay(x);
    }
  }

  /**
   * (d3-specific) Handle mouse movement over the plots to show the values under the cursor.
   * @param {Object} ev - the d3 event
   * @param {number} x - the mouse x pixel offset from the left of the plot
   */
  function mousemoveD3(ev, x) {

    // fall out if touch
    if (isTouchSupported) {
      return;
    }

    if (ev.shiftKey) {
//      log("panning using the mouse");

    } else {

      // if the user is currently zooming, update the zoomEndPixel position to track the cursor
      if (zoomStartPixel != undefined && isButtonDown) {
        zoomEndPixel = x;
      }

      // update the mouse overlay (readouts, cursor line, tracking dots) position and contents
      updateMouseOverlay(x);
    }
  }

  /**
   * Update the mouse overlay (cursor line, hover readouts, cursor dot) position and text.
   * @param {number} x - the mouse x pixel offset from the left of the plot
   */
  function updateMouseOverlay(x) {
    var start;
    var end;
    var i;

//    try {
    // if the user has tapped a value previously, the readout should maintain it as long as it's visible
    if (tappedDataposXMoment !== undefined) {
      start = (isZoomed) ? zoomStartMoment : startMoment;
      end = (isZoomed) ? zoomEndMoment : endMoment;

      // is the tapped value visible?
      if (tappedDataposXMoment.diff(start) > 0 && end.diff(tappedDataposXMoment) > 0) {
        debug('tapped ' + tappedDataposXMoment.format());
        //        // use the time of the last tap as the time of interest to display in the readout
        //        datapos = {};
        //        datapos.xaxis = convertToJqPlotUnixTime(tappedDataposXMoment);

        // determine the pixel position of this time in the zoomed plot
        //        gridpos = {};
        if (isZoomed) {
          //          gridpos.x = convertMomentToPixelsZoomed(tappedDataposXMoment);
          x = convertMomentToPixelsZoomed(tappedDataposXMoment);
        } else {
          //          gridpos.x = convertMomentToPixels(tappedDataposXMoment);
          x = convertMomentToPixels(tappedDataposXMoment);
        }
      }
    }

    // get the timestamp that correlates to the pixel location (as a Javascript Date object)
    var timeJs = x_scale.invert(x);

    // choose the default plot for finding the nearest time, use Mag if possible
    var plot = (seriesScheme === SOLAR_WIND_SCHEME) ? DENS_GRAPH : BT_BZ_GRAPH;

    // get the nearest data point for its time tag, recurrence data goes further to the right so use it if it's available
    var d = nearest(plot, timeJs, drawRecurrence());
    if (d !== null) {
      // move the mouse overlay (which contains the readouts, cursor line, and tracking dots) to this position
      focus.attr("transform", "translate(" + x + ",0)");

      // update the readout time
      var the_time = JSON.stringify(d.time_tag);
      var date_string = the_time.slice(1, 11);
      // if high-res, include the seconds
      var endIndex = (visibleIndex() === 0) ? 20 : 17;
      var time_string = the_time.slice(12, endIndex);
      focus.select("#readout_time").text(date_string + " " + time_string);
      focus.select("#readout_time2").text(date_string + " " + time_string);

      var plotList = getCurrentPlotList();

      // move the dot on each plot vertically to track the cursor
      // define the plot y scales
      for (i = 0; i < plotList.length; i++) {

        // the plot we are working on
        var plt = plotList[i];

        showPlotGraphDataD3(i, plt, timeJs);
      }

      // shift the hover readouts to the left or right of the cursor line as the cursor moves
      flipHoverReadouts(x);

      // show the zoomed area on each plot and the zoom controller
      drawZoomBoxD3(x);
    }
//    } catch (e) {
//      log("ERROR: exception in updateMouseOverlay " + e);
//    }
  }

  /**
   * Update the hover readout value and the value tracking dot.
   * @param {number} n - the Nth plot on the page
   * @param {number} plotNum - the index into the plot array
   * @param {Object} timeJs - the given  time as a Javascript Date object
   */
  function showPlotGraphDataD3(n, plotNum, timeJs) {
    var d;
    var dr;
    var k;
    var name;
    var readout = '';
    var readoutRecur = '';

    // get the data under the cursor line, or null if no data at that location
    d = nearest(plotNum, timeJs, false);
    if (drawRecurrence()) {
      dr = nearest(plotNum, timeJs, true);
    }

    if (d !== undefined) {
      // the series this plot shows
      var seriesList = SERIES_LISTS[plotNum];
      var seriesVisible = SERIES_VISIBLE[plotNum];

      for (k = 0; k < seriesList.length; k++) {
        name = SERIES_NAMES[seriesList[k]];

        // only show the series value if the series is visible
        if (seriesVisible[k]) {
          readout = buildReadoutString2(plotNum, k, name, d, false, readout);

          // update the series hover readout text
          focus.select('#readout_' + n + '_' + k).text(readout);

          // build the recurrence readout value string
          if (dr !== undefined) {
            readoutRecur = buildReadoutString2(plotNum, k, name, dr, true, readoutRecur);

            // update the series recurrence hover readout text
            focus.select('#readout_' + n + '_recur' + '_' + k).text(readoutRecur);
          }
        }
      }
    }
  }

  /**
   * Build the hover readout string of values.
   * @param {number} plotNum - the index into the plot array
   * @param {number} seriesNum - the index into the series array for this plot
   * @param {string} name - the series name
   * @param {Object} d - the series data object
   * @param {boolean} useRecurrence - if true, find the nearest element in the recurrence data, otherwise use the current data
   * @param {string} readout - the readout string
   * @returns {string} - the readout string
   */
  function buildReadoutString2(plotNum, seriesNum, name, d, useRecurrence, readout) {
    var yValue;

    if (d !== null) {
      // use the max rather than the median for Kp and Ap
      yValue = (name === 'kp') ? ((d.kp_max !== undefined) ? d.kp_max : d.kp) : ((name === 'ap') ? d.ap_daily : d[name]);
    }

    // Ap is a special case since it's already plotted as text
    if (name !== "ap") {
      // move the cursor dot for each series in this plot
      var suffix = useRecurrence ? '_recur' : '';
      translateCursorDot(name + suffix, plotNum, seriesNum, yValue);
    }

//    log("buildReadoutString2: plotNum " + plotNum + " seriesNum " + seriesNum + " name " + name + " yValue " + yValue + " d " + JSON.stringify(d));
    // add the formatted value to the text string
    readout = formatValue(plotNum, yValue);

    return readout;
  }

  /**
   * Find the nearest data to the given time in the appropriate data array .
   * @param {number} plotNum - the index into the plot array
   * @param {Object} timeJs - the given time as a Javascript Date object
   * @param {boolean} useRecurrence - if true, find the nearest element in the recurrence data, otherwise use the current data
   * @returns {Object} - the data element in the appropriate data array nearest to the given time
   */
  function nearest(plotNum, timeJs, useRecurrence) {

    // the index into the series data arrays where the mouse is positioned
    var mouseIndex;
    var firstIndex;
    var lastIndex;
    var USE_VISIBLE = true;
    var dataset;
    var d;
    var magDataset;
    var plasmaDataset;
    var kpDataset;

    // get the filtered datasets
    if (useRecurrence) {
      magDataset = getRecurrenceData(BT_BZ_GRAPH);
      plasmaDataset = getRecurrenceData(DENS_GRAPH);
      if (plotNum === KPAP_GRAPH) {
        kpDataset = getRecurrenceData(KPAP_GRAPH);

        if (kpDataset === undefined) {
          log("nearest: kp dataset is undefined, useRecurrence " + useRecurrence);
        }
      }
    } else {
      magDataset = getPlotData(BT_BZ_GRAPH);
      plasmaDataset = getPlotData(DENS_GRAPH);
      if (plotNum === KPAP_GRAPH) {
        kpDataset = getPlotData(KPAP_GRAPH);

        if (kpDataset === undefined) {
          log("nearest: kp dataset is undefined, useRecurrence " + useRecurrence);
        }
      }
    }

    var magFirstIndex = getFirstNonNullDataIndexD3(plotNum, magDataset, USE_VISIBLE);
    var magLastIndex = getLastNonNullDataIndexD3(plotNum, magDataset, USE_VISIBLE);
    var plasmaFirstIndex = getFirstNonNullDataIndexD3(plotNum, plasmaDataset, USE_VISIBLE);
    var plasmaLastIndex = getLastNonNullDataIndexD3(plotNum, plasmaDataset, USE_VISIBLE);
    if (plotNum === KPAP_GRAPH) {
      var kpApFirstIndex = getFirstNonNullDataIndexD3(plotNum, kpDataset, USE_VISIBLE);
      var kpApLastIndex = getLastNonNullDataIndexD3(plotNum, kpDataset, USE_VISIBLE);
    }

    // the index into the series data arrays where the mouse is positioned. Bisect returns the index where this time would be inserted, so subtract one
    // to get the index of the preceding element
    var magMouseIndex = bisectDate(magDataset, timeJs) - 1;
    var plasmaMouseIndex = bisectDate(plasmaDataset, timeJs) - 1;
    if (plotNum === KPAP_GRAPH) {
      var kpApMouseIndex = bisectDate(kpDataset, timeJs) - 1;
    }

    // handle non-plasmag plots (currently only Kp-Ap)
    if (plotNum === KPAP_GRAPH) {
      mouseIndex = kpApMouseIndex;
      firstIndex = kpApFirstIndex;
      lastIndex = kpApLastIndex;
    } else {
      // if only mag or plasma plots are currently displayed, use the first/last for that data set only
      if (seriesScheme === MAG_SCHEME) {
        mouseIndex = magMouseIndex;
        firstIndex = magFirstIndex;
        lastIndex = magLastIndex;
//        log("nearest: mag  first index " + firstIndex + " lastIndex " + lastIndex);

      } else if (seriesScheme === SOLAR_WIND_SCHEME) {
        mouseIndex = plasmaMouseIndex;
        firstIndex = plasmaFirstIndex;
        lastIndex = plasmaLastIndex;
//        log("nearest: wind  first index " + firstIndex + " lastIndex " + lastIndex);

      } else {
        // both mag and plasma plots are shown
        mouseIndex = (isPlasmaPlot(plotNum)) ? plasmaMouseIndex : magMouseIndex;
        firstIndex = (isPlasmaPlot(plotNum)) ? plasmaFirstIndex : magFirstIndex;
        lastIndex = (isPlasmaPlot(plotNum)) ? plasmaLastIndex : magLastIndex;
//        log("nearest: both isPlasmaPlot " + isPlasmaPlot(plotNum) + " first index " + firstIndex + " lastIndex " + lastIndex);
      }
    }

    var useNull = false;
    dataset = useRecurrence ? getRecurrenceData(plotNum) : getPlotData(plotNum);
//    log("nearest: plotNUm "+ plotNum+" dataset[0] " + JSON.stringify(dataset[0]));
//    log("nearest: intermediate mouseIndex " + mouseIndex + " " + dataset[mouseIndex].time_tag + " firstIndex " + firstIndex + " lastIndex " + lastIndex);

    if (dataset.length === 0) {
//      log("no data for plot " +plotNum+ ", setting useNull = true");
      useNull = true;
    } else {
      // adjust the readout position and time when not over the non-null data
      if (mouseIndex === null) {
        // the cursor is outside of the plot rectangles, place the readout over the last data values
//        log("nearest: mouse is outside of the plot, should never get here");
        mouseIndex = lastIndex;
      } else if (mouseIndex < firstIndex) {
        // cursor is to the left of the first non-null data, show the first data values
//        log("nearest: mouse is to the left of data mouseIndex " + mouseIndex + " firstIndex " + firstIndex);
        mouseIndex = firstIndex;
      } else {
//          log("over the data");
      }
    }

    // get the data element at that index
    d = dataset[mouseIndex];
//    if (plotNum === KPAP_GRAPH && !useRecurrence) {
//    log("nearest: d " + JSON.stringify(d));
//    log("nearest: dataset len " + dataset.length + " lastIndex " + lastIndex);
//    log("nearest: last d " + JSON.stringify(dataset[lastIndex]));
//    log("nearest: about to check for useNull, currently useNull " + useNull);
//    }

    // since the data arrays only contain a single null record regardless of the size of the gap, need to determine if we should return null
    // otherwise, the next record to the right will be shown
    // IMPORTANT: only need this if NOT adding N nulls in convertJson!
    if (d !== undefined) {
      var diffMs = Math.abs(timeJs - d.time_tag);
      if (diffMs > (1.5 * visibleResolutionByInstrument(plotNum) * 1000)) {
        if (plotNum === KPAP_GRAPH && !useRecurrence) {
//        log("too far from a datapoint -> use null, diffMs " + diffMs + " x " + sigFig(samplesPerPixel) + " " + sigFig(samplesPerPixel * visibleResolutionByInstrument(plotNum) * 1000) + " useRecurrence " + useRecurrence + " mouseIndex " + mouseIndex + " lastIndex " + lastIndex);
        }
//        log("plotNum " + plotNum + " diffMs " + diffMs + " too far from a datapoint, setting useNull = true, useRecurrence " + useRecurrence);
        useNull = true;
      } else if (timeJs > dataset[lastIndex].time_tag) {
//        log("time > last, using last data element");
        d = dataset[lastIndex];
      } else if (!useRecurrence && timeJs > dataset[lastIndex].time_tag) {
//        log("is not recur and time > last, setting useNull = true");
        useNull = true;
      }
    } else {
//      log("d is undefined, setting useNull = true");
      useNull = true;
    }

    return useNull ? null : d;
  }

  /**
   * Return the index of the nearest mag data element.
   * @param timeJs
   * @param useRecurrence
   * @returns {null}
   */
    // TODO switch to finding nearest mag, plasma, kp one time instead of per plot
  function nearestMag(timeJs, useRecurrence) {
    var USE_VISIBLE = true;
    var d;
    var useNull = false;

    // get the filtered datasets
    var dataset = (useRecurrence) ? getRecurrenceData(BT_BZ_GRAPH) : getPlotData(BT_BZ_GRAPH);

    var firstIndex = getFirstNonNullDataIndexD3(BT_BZ_GRAPH, dataset, USE_VISIBLE);
    var lastIndex = getLastNonNullDataIndexD3(BT_BZ_GRAPH, dataset, USE_VISIBLE);

    // the index into the series data arrays where the mouse is positioned. Bisect returns the index where this time would be inserted, so subtract one
    // to get the index of the preceding element
    var mouseIndex = bisectDate(dataset, timeJs) - 1;

    if (dataset.length === 0) {
      log("no data for plot " + BT_BZ_GRAPH + ", setting useNull = true");
      useNull = true;
    } else {
      // adjust the readout position and time when not over the non-null data
      if (mouseIndex === null) {
        // the cursor is outside of the plot rectangles, place the readout over the last data values
        log("nearest: mouse is outside of the plot, should never get here");
        mouseIndex = lastIndex;
      } else if (mouseIndex < firstIndex) {
        // cursor is to the left of the first non-null data, show the first data values
//        log("nearest: mouse is to the left of data mouseIndex " + mouseIndex + " firstIndex " + firstIndex);
        mouseIndex = firstIndex;
      } else {
//          log("over the data");
      }
    }

    // get the data element at that index
    d = dataset[mouseIndex];

    // since the data arrays only contain a single null record regardless of the size of the gap, need to determine if we should return null
    // otherwise, the next record to the right will be shown
    // only need this if NOT adding N nulls in convertJson
    if (d !== undefined) {
      var diffMs = Math.abs(timeJs - d.time_tag);
      if (diffMs > (1.5 * visibleResolutionByInstrument(BT_BZ_GRAPH) * 1000)) {
//        log("diffMs " + diffMs + " too far from a datapoint, setting useNull = true");
//        useNull = true;
      } else if (timeJs > dataset[lastIndex].time_tag) {
//        log("time > last, using last data element");
        d = dataset[lastIndex];
      } else if (!useRecurrence && timeJs > dataset[lastIndex].time_tag) {
//        log("is not recur and time > last, setting useNull = true");
        useNull = true;
      }
    } else {
//      log("d is undefined, setting useNull = true");
      useNull = true;
    }

    return useNull ? null : d;
  }

  /**
   * (d3-specific) Move the cursor tracking dot on the given plot.
   * @param {string} name - the series name
   * @param {number} plotNum - the index into the plot array
   * @param {number} seriesNum - the index into the series array for this plot
   * @param {*} yValue - the data value at the cursor location
   */
  function translateCursorDot(name, plotNum, seriesNum, yValue) {
    var id = '#circle_' + plotNum + '_' + seriesNum + '_' + name;
    var dot = focus.select(id);

    // only show the dot if valid, ignore null and bogus values
    if (yValue !== null && !isNaN(yValue)) {
      // adjust Phi range
      yValue = (plotNum === PHI_GRAPH) ? adjustPhiValue(yValue) : yValue;
      dot.attr("r", 3).attr("transform", "translate(0," + yScales[plotNum](yValue) + ")");
    } else {
      dot.attr('r', 0);
    }
  }

  /**
   * (d3-specific) Flip the plot hover readouts to the left or right of the cursor line as the cursor moves.
   * @param {number} x - the mouse x pixel offset from the left of the plot
   */
  function flipHoverReadouts(x) {
    var xp = (x < plt_width / 2) ? 20 : -READOUT_WIDTH - 20;
    focus.selectAll(".g_hover_readout_container").attr("x", xp);

    // shift the time hover readouts left if necessary to keep them on the page
    adjustHOverReadouts(x);
  }

  /**
   * Shift the time readout left if it would go off the right edge of the page.
   */
  function adjustHOverReadouts(x) {
    var width = READOUT_WIDTH + 50;
    var offset = (x + (width / 2) > plt_width + margin_right) ? x + (width / 2) - (plt_width + margin_right) : 0;
    focus.select("#hover_readout_time_container").attr("x", -(width / 2) - offset);
  }

  /**
   * Perform a zoom operation. Assumes that zoomStart/EndMoment and zoomStart/EndPixel are set.
   */
  function zoomD3() {
//    log("zoomD3");
    // Swap times if backwards (i.e., the user is moved the mouse from right to left), otherwise the data will be plotted in the wrong order!
    var temp;

    // is the end earlier than the start?
    if (zoomEndMoment.isBefore(zoomStartMoment)) {
      // swap the zoom start/end dates
      temp = moment.utc(zoomStartMoment);
      zoomStartMoment = moment.utc(zoomEndMoment);
      zoomEndMoment = temp;

      // swap the pixel locations too
      temp = zoomStartPixel;
      zoomStartPixel = zoomEndPixel;
      zoomEndPixel = temp;
    }

    // is the entire zoom rectangle outside of the non-null data?
//    try {
    if (zoomStartMoment.isAfter(getLastNonNullDataMomentD3(false)) || zoomEndMoment.isBefore(getFirstNonNullDataMomentD3(false))) {
      // don't bother zooming in on nothing
      cancelZoom();
      feedback("outside of the available data, falling out");
      return;
    }
//    } catch (e) {
//      log("exception zooming " + e);
//      return;
//    }

//    var visibleMagData = [];
//    for (var i = 0; i < filteredMagData.length; i++) {
//      var time = moment.utc(filteredMagData[i].time_tag);
//      if (time.isAfter(zoomStartMoment) && time.isBefore(zoomEndMoment)) {
//        visibleMagData.push(filteredMagData[i]);
//      }
//    }
//    if (visibleMagData.length > 0) {
////      log("zoomD3 worked " + zoomStartMoment.format(DATE_FORMAT_DISPLAY) + " end " + zoomEndMoment.format(DATE_FORMAT_DISPLAY) + JSON.stringify(visibleMagData));
//    } else {
////      log("zoomD3 empty");
//      return;
//    }

    // if we're at the next lower resolution from the high-res data, is the start of the zoom rectangle earlier than the start of the
    // high-res data availability?
//    if (zoomIndex === 1 && zoomStartMoment.isBefore(DSCOVR_START)) {
//      // outside of the available high-res DSCOVR data
//      cancelZoom();
//      feedback("outside of the available high-res data, falling out");
//      // TODO still want to magnify in this case
//      return;
//    }

//    log("zoomD3: final zoomStartMoment " + zoomStartMoment.format(DATE_FORMAT_DISPLAY) + " zoomEndMoment " + zoomEndMoment.format(DATE_FORMAT_DISPLAY));

    // is this the first zoom?
    if (!isZoomed) {
      // the user can zoom in several resolution levels, so on the first zoom only, save the data presence date range
      // save the data start/end dates for use in drawing the zoombox
      saveFirstDataMoment = getFirstDataMomentD3();
      saveLastDataMoment = moment.utc(lastDataMoment);

//      log("zoomD3: is first zoom, setting saveFirstDataMoment to " + saveFirstDataMoment.format(DATE_FORMAT_DISPLAY) +
//          " last " + saveLastDataMoment.format(DATE_FORMAT_DISPLAY));
    }

    // save the start/end of the zoomed plot for use in drilling down
//    log("zoomD3: this is a new zoom, setting saveZoomStart/End to zoomStart/End");
    saveZoomStartMoment = moment.utc(zoomStartMoment);
    saveZoomEndMoment = moment.utc(zoomEndMoment);

    // save the start pixel of the zoom plot for use in cancelling a pending zoom
    saveZoomStartPixel = zoomStartPixel;

    // passed all the checks, enter zoom mode
//    log("zoomD3: setting isZoomed to true, saveZoomStartMoment " + saveZoomStartMoment.format(DATE_FORMAT_DISPLAY));
    isZoomed = true;

    // are they very close to the right edge of the plot?
    if (zoomEndPixel > plt_width - 10) {
      // assume they are trying to get up through the latest data
      zoomEndPixel = plt_width;
      zoomEndMoment = moment.utc(endMoment);
    }

    // draw the zoomed plot at the highest resolution possible for the spacecraft
    var minVisibleIndex = (sourceScheme === ACE_SCHEME) ? 1 : 0;
    zoomReplotOrReload(minVisibleIndex);
  }

  /**
   * Cancel the currently in-process zoom operation. Note that the plots may already been in a zoom state from a previous operation!
   */
  function cancelZoom() {
//    log("cancel zoom");

    // restore the zoom start pixel from the saved value
    zoomStartPixel = (isZoomed) ? saveZoomStartPixel : undefined;

    // restore the zoom start/end time from the saved values
    zoomStartMoment = (isZoomed) ? saveZoomStartMoment : undefined;
    zoomEndMoment = (isZoomed) ? saveZoomEndMoment : undefined;

//    log('cancel zoom: after cancel, zoomStartMoment ' + zoomStartMoment + " isZoomed " + isZoomed);
  }

  /**
   * Exit zoom mode and reload/replot as necessary.
   * @param {Object} ev - the triggering event
   * @param {boolean} noReload - if true, don't bother reloading or replotting the data as it will be done by the caller
   */
  function zoomReset(ev, noReload) {

    // are we zoomed? Should only need to check isZoomed, but adding zoomStartMoment check as a fail-safe
    if (isZoomed || zoomStartMoment !== undefined) {
//      debugger;

      // make the zoombox rectangles invisible again
      zoomdragbox.attr("hidden", true);

      if (noReload === false) {
        if (ev != null && ev.shiftKey) {
          // shift-dbl-click zooms out by increments
          // increase the visible time span by 10x, then either magnify or load a new file as appropriate
          var diffMillisHalf = zoomEndMoment.diff(zoomStartMoment) / 2;

          // find the center time of the zoomed span
          var zoomCenterMoment = moment.utc(zoomStartMoment).add(diffMillisHalf);

          // double the width of the zoom span on the same center
          var diffMillisHalfX2 = diffMillisHalf * 2;
          zoomStartMoment = moment.utc(zoomCenterMoment).subtract(diffMillisHalfX2);
          zoomEndMoment = moment.utc(zoomCenterMoment).add(diffMillisHalfX2);

          // clamp the ends
          if (zoomStartMoment.isBefore(startMoment)) {
            zoomStartMoment = moment.utc(startMoment);
          }
          if (zoomEndMoment.isAfter(endMoment)) {
            zoomEndMoment = moment.utc(endMoment);
          }

          // save the start/end of the zoomed plot for use in drilling down from this point
          saveZoomStartMoment = moment.utc(zoomStartMoment);
          saveZoomEndMoment = moment.utc(zoomEndMoment);

          // compute the resulting zoom box in pixels
          zoomStartPixel = convertMomentToPixels(zoomStartMoment);
          zoomEndPixel = convertMomentToPixels(zoomEndMoment);
        } else {
          // by default, go all the way back out
          resetZoomAttributes();
        }

        // redraw as appropriate
        zoomReplotOrReload(zoomIndex);

        // did we back all the way out?
        if (zoomStartMoment.isSame(startMoment) && zoomEndMoment.isSame(endMoment)) {

          // flash the page background to show that the user has backed all the way out
          main_graphic.selectAll('.page_background').transition().duration(1500).attr('fill', 'white');

          resetZoomAttributes();
        } else {
//          log("zoomReset: no more changes");
        }
      } else {
        resetZoomAttributes();
      }
    }
  }

  /**
   * Determine the zoom level based on the zoom start and end dates.
   * @param {number} minimum - the minimum zoom level (i.e., 0)
   * @returns {Object} - an object containing the index into the file descriptor arrays and the start/end file numbers for the section being zoomed
   */
  function computeZoomLevel(minimum) {
    var zoomParameters = {};
    var index;

    // default to a minimum zoom index of 0 (the lowest possible) if given value is invalid
    if (minimum === null || minimum < 0) {
      minimum = 0;
    }

    // search for the highest-resolution file type (up to the currently selected timespan) that will completely contain the zoomed span
    for (index = minimum; index < currentIndex; index++) {

      // compute the file numbers that contain the zoom start and end dates, respectively
      var startNumber = computeFileNumber(files[index], zoomStartMoment);
      var endNumber = computeFileNumber(files[index], zoomEndMoment);

      // skip if any part of zoom region is before data is available (can happen with high-res data before the start of the DSCOVR mission)
      if (startNumber > 0 && endNumber > 0) {
        // how many files
        var diff = endNumber - startNumber;

        // is the zoomed date range contained in either a single file or two adjacent files?
        if (diff === 0 || diff === 1) {
          zoomParameters.start = startNumber;
          zoomParameters.end = endNumber;

          // fall out if the zoomed span fits within a single file or pair of files. Note that this doesn't guarantee that the file will contain data, only that it
          // could (and should!)
          break;
        }
      }
    }

    // if we went through the loop entirely, can't zoom so use the currently selected timespan
    if (index == currentIndex) {
      index = currentIndex;
    }

    zoomParameters.index = index;

    return zoomParameters;
  }

  /**
   * Update the visible plot start/end date labels.
   */
  function updateDateLabels() {

    // update the overall timespan timestamp
    updateTimespanStartDate();

    // update the plot start/end timestamps (zoomed or unzoomed)
    var start = visibleStart();
    var end = visibleEnd();

    // display the visible span as either seconds, minutes, hours, days, or years
    var diff;
    var diffText;
    var diffSeconds = end.diff(start, 'seconds');
    if (diffSeconds < 3 * ONE_MINUTE) {
      diff = diffSeconds;
      diffText = 'sec';
    } else if (diffSeconds < ONE_HOUR) {
      diff = end.diff(start, 'minutes');
      diffText = 'min';
    } else if (diffSeconds < ONE_DAY) {
      diff = end.diff(start, 'hours');
      diffText = 'hour';
    } else if (diffSeconds < SECONDS_PER_YEAR) {
      diff = end.diff(start, 'days');
      diffText = 'day';
    } else {
      diff = end.diff(start, 'years', true);
      // round to 1 sig fig
      diff = Math.round(10 * diff) / 10;
      diffText = 'year';
    }

    // handle singular vs plural differences
    if (diff > 1) {
      diffText += 's';
    }

    // update the display to show the resolution (ie., time per sample, always use Mag periods)
    var samples = Math.floor(end.diff(start, 'seconds') / visibleResolution());
    var prefix = resolutionText[visibleIndex()];

    // special case when showing high-res data, since the resolution differs by instrument
    if ("highres" === prefix) {
      if (seriesScheme === MAG_SCHEME) {
        prefix = highResText[0];
      } else if (seriesScheme === SOLAR_WIND_SCHEME) {
        prefix = highResText[1];
      } else {
        prefix = highResText[0] + " (mag)/" + highResText[1] + " (plasma)";
      }
    }

    // build the span@resolution text, Ex: 1 day@1 min
    var text = diff + " " + diffText + "@" + prefix;

    // add the SWFO daily report info
    var finalText = "";

    // rendering report in the header?
    if (isSwfo() && currentSpanHours == 24 && periodStart[0] !== undefined) {
//      log("rendering reports! currentSpanHours " + currentSpanHours);
      // make sure the 00 report is at the top
      var reportA = 0;
      var reportB = 1;
//      log("reportA " + periodStart[reportA] + " reportB " + periodStart[reportB]);
      if ('00:00' === periodStart[1].substring(0, 4)) {
        reportA = 1;
        reportB = 0;
      }

      // top line
      finalText += periodStart[reportA] +
          " Bt " + minBt[reportA] + " / " + maxBt[reportA] +
          " Bz " + minBz[reportA] + " / " + maxBz[reportA] +
          " Speed " + minSpeed[reportA] + " / " + meanSpeed[reportA] + " / " + maxSpeed[reportA];

      // update the display to show the resolution (ie., time per sample) with two spaces between
      finalText += '\u00A0\u00A0 ' + text;

      // bottom line
      reportBLabel = periodStart[reportB] +
          " Bt " + minBt[reportB] + " / " + maxBt[reportB] +
          " Bz " + minBz[reportB] + " / " + maxBz[reportB] +
          " Speed " + minSpeed[reportB] + " / " + meanSpeed[reportB] + " / " + maxSpeed[reportB];

    } else {
      // no report needed
      finalText = text;
      reportBLabel = '';
    }

    // update the display to show the zoom plot start/end dates
    startDateLabel = start.format(DATE_FORMAT_DISPLAY);
    endDateLabel = end.format(DATE_FORMAT_DISPLAY);
    resolutionLabel = finalText;
  }

  /**
   * Zoom in either by replotting (magnifying) or loading new files and then replotting.
   * @param {number} minimum - the minimum zoom level index desired (we'll start there and work our way up)
   */
  function zoomReplotOrReload(minimum) {
    var originalZoomIndex = zoomIndex;
    var start;
    var end;

      // should we attempt to zoom?
      if (minimum !== currentIndex) {
        // determine if the zoom requires a higher-resolution file
        var zoomParameters = computeZoomLevel(minimum);
        zoomIndex = zoomParameters.index;

        // get the starting Phase II file number (undefined if stepping out all the way to Phase I)
        start = zoomParameters.start;
        end = zoomParameters.end;
      }

    // simply magnify the currently loaded data?
    // TODO when incrementally stepping out, it's possible for the zoom index to be equal to the current index,
    // but still require a reload since the last files loaded were for the zoom index!
    if (originalZoomIndex === currentIndex) {
//      log("zoomReplotOrReload: no zoom, simple magnify");
      // magnify the normal plots
      replotData();
    } else {

      // load the appropriate Phase I or Phase II data file from the server
      if (zoomIndex === undefined || start === undefined) {
        // if keying off of start, need to set the zoomIndex to undefined as we're now unzoomed
        zoomIndex = undefined;

        // unzooming, so reload the original Phase I data set
        loadData();
      } else {
        timerStart();

        // zoom in to a higher-resolution Phase II data set, requires fetching new data from the server
        loadPlasMagDataUsingNumberD3(start, end, false);

        start = computeKpApFileNumber(files[zoomIndex], zoomStartMoment);
        end = computeKpApFileNumber(files[zoomIndex], zoomEndMoment);
//        log("zoomReplotOrReload: fetching new KpAp data for zoom, start " + start + " end " + end);
        loadKpApDataUsingNumberD3(start, end, false);

        // load fresh Recurrence data
        if (loadRecurrence()) {
//          log('zoomReplotOrReload: loading recurrence data');
          loadAllRecurrenceData();
        }
      }
    }

    updateDateLabels();
  }

// ***********************************************************************************************************
//  user action support functions
// ***********************************************************************************************************

  /**
   * Shade the plots to show the zoomed portion.
   * @param {number} x - the mouse x pixel offset from the left of the plot
   */
  function drawZoomBoxD3(x) {
    var i;
    var left;
    var right;
    var end;
    var temp;

    var plotList = getCurrentPlotList();

    for (i = 0; i < plotList.length; i++) {
      // show the zoomed area on each plot
      if (zoomStartPixel != undefined && isButtonDown) {
        // handle the end being earlier than the start
        left = (zoomStartPixel < zoomEndPixel) ? zoomStartPixel : zoomEndPixel;
        right = (zoomStartPixel < zoomEndPixel) ? zoomEndPixel : zoomStartPixel;

        // make the zoom rectangles visible
        dragbox.attr("display", null);

        // update the position and size
        for (i = 0; i < plotList.length; i++) {
          dragbox.selectAll("#dragbox_left_" + i)
              .attr("width", left);

          dragbox.selectAll("#dragbox_right_" + i)
              .attr("x", right)
              .attr("width", plt_width - right);
        }
      }
    }

    // show the zoomed area on each plot
    if (zoomStartPixel != undefined && isButtonDown) {
      // make the zoom rectangles visible
      zoomdragbox.attr("hidden", null);

      left = x_scale_timespan(zoomStartMoment);
      end = moment.utc(x_scale.invert(x));
      right = x_scale_timespan(end);

      // swap order if necessary
      if (left > right) {
        temp = left;
        left = right;
        right = temp;
      }

      zoomdragbox.selectAll("#zoomdragbox_left")
          .attr("width", left);

      zoomdragbox.selectAll("#zoomdragbox_right")
          .attr("x", right)
          .attr("width", plt_width - right);

      zoomdragbox.selectAll("#zoomdragbox_center")
          .attr("x", left)
          .attr("width", right - left);
    }
  }

  /**
   * Compute the index into the series data arrays corresponding to the given time.
   * @param {Object} time - the given time as a Moment
   * @param {number} plotNum - the plot number, used to determine if the resolution is mag or plasma
   * @returns {number} - the corresponding index into the series data
   */
  function computeIndexFromMomentByInstrument(time, plotNum) {
    var index = null;

    if (time != null) {
      // compute the time offset relative to the data array start time
      var deltaTimeMs = time.diff(dataStartMoment);

      // compute the index (time / resolution)
      index = Math.round(deltaTimeMs / (visibleResolutionByInstrument(plotNum) * 1000.0));
    }

    return index;
  }

  /**
   * Compute the index into the series data arrays corresponding to the given time, defaulting to the Mag resolution.
   * @param {Object} time - the given time as a Moment
   * @returns {number} - the corresponding index into the series data
   */
  function computeIndexFromMoment(time) {
    var index = null;

    if (time != null) {

      // compute the time offset relative to the data array start time
      var deltaTimeMs = time.diff(dataStartMoment);

      // compute the index (time / resolution)
      index = Math.round(deltaTimeMs / (visibleResolution() * 1000.0));
    }

    return index;
  }

  /**
   * Compute the pixel number (0 = left edge of the plot) corresponding to the given data array index.
   * @param {number} index - the index into the data array
   * @returns {number} - the pixel corresponding to the array index
   */
  function computePixel(index) {

    // get the number of possible data samples in the visible span
    var samples = Math.floor(visibleEnd().diff(visibleStart(), 'seconds') / visibleResolution());

    // compute the width of an index as a percentage of the visible span
    return Math.floor((index / samples) * getPlotWidth());
  }

  /**
   * Generate a formatted value string as appropriate based on the plot.
   * @param {number} plotNum - the plot number with which the value is associated
   * @param {number} value -  the numeric value to be formatted
   * @returns {string}
   */
  function formatValue(plotNum, value) {
    var valueString = '-';
    if (value != null) {
      valueString = READOUT_FORMAT[plotNum](value);
    }
    return valueString;
  }

  /**
   * Compute the start time of the file with the given file number.
   *
   * @param {number} index - the index into the file descriptor arrays
   * @param {number} number - the file number
   * @return {Object} - the start time of the given file number
   */
  function computeFileStartFromNumber(index, number) {

    // high-res data (1sec/3sec = high-res) is only supplied by DSCOVR
    var baseline = (isHighRes(index)) ? moment.utc(DSCOVR_START) : moment.utc(MISSION_START);

    // compute the file number range for this year (File 0 is the first file)
    return baseline.add(number * timespans[index], 'minutes');
  }

  /**
   * (d3-specific) Determine the zoom box date/time tick format based on the currently selected timespan.
   * @param {boolean} useZoomed - if true, determine the time tick format to use for the visible zoomed span, otherwise use the overall timespan
   */
  function determineTimeFormat(useZoomed) {
    var timeFormat;
    var unit;
    var count = 1;
    var minorUnit;
    var minorCount;
    var label = '';
    var span;
    var opt = -1;

    if (useZoomed) {
      span = visibleSpan();
//      log("determineTimeFormat: zoomed span " + sigFig(span));
      label = '('; //'UTC(';
    } else {
      span = currentSpanHours;
//      log("determineTimeFormat: overall span " + span);
    }

    // hand-tailor the major and minor ticks
    if (span <= 1 / 60) {
      // 1 minute (zoomed): 12:34:50
      timeFormat = '%H:%M:%S';
      unit = d3.time.seconds.utc;
      count = 10;
      label += 'hh:mm:ss';
      // 1 second minor tick
      minorUnit = d3.time.seconds.utc;
      minorCount = 1;
      opt = 1;
//    } else if (span <= 1/12) {
//      // 5 minute (zoomed): 12:34:30
//      timeFormat = '%H:%M:%S';
//      unit = d3.time.seconds.utc;
//      count = 30;
//      label += 'hh:mm:ss';
//      // 5 second minor tick
//      minorUnit = d3.time.seconds.utc;
//      minorCount = 1;
//      opt = 0.2;
    } else if (span <= 1 / 4) {
      // 15 minute (zoomed): 12:34
      timeFormat = '%H:%M';
      unit = d3.time.minutes.utc;
      count = 1;
      label += 'hh:mm';
      // 10 second minor tick
      minorUnit = d3.time.seconds.utc;
      minorCount = 10;
      opt = 2;
    } else if (span <= 1) {
      // 1 hour
      timeFormat = '%H:%M';
      unit = d3.time.minutes.utc;
      count = 5;
      label += 'hh:mm';
      // 1 hour: 5 minute minor tick
      minorUnit = d3.time.minutes.utc;
      minorCount = 1;
      opt = 3;
    } else if (span <= 4) {
      // 3 hours
      timeFormat = '%H:%M';
      unit = d3.time.minutes.utc;
      count = 30;
      label += 'hh:mm';
      // 3 hour: 15 minute minor tick
      minorUnit = d3.time.minutes.utc;
      minorCount = 5;
      opt = 4;
    } else if (span <= 8) {
      // 12 hours
      timeFormat = '%H:%M';
      unit = d3.time.hours.utc;
      count = 1;
      label += 'hh:mm';
      // 12 hour: 30 minute minor tick
      minorUnit = d3.time.minutes.utc;
      minorCount = 15;
      opt = 5;
    } else if (span <= 24) {
      // 1 day: 15
      timeFormat = '%H';
      unit = d3.time.hours.utc;
      count = 3;
      label += 'hh';
      // 12 hour: 30 minute minor tick
      minorUnit = d3.time.hours.utc;
      minorCount = 1;
      opt = 6;
    } else if (span <= 48) {
      // 2 days: 18
      timeFormat = '%H';
      unit = d3.time.hours.utc;
      count = 6;
      label += 'hh';
      // 1 hour minor tick
      minorUnit = d3.time.hours.utc;
      minorCount = 1;
      opt = 7;
    } else if (span <= 96) {
      // 4 days: 12
      timeFormat = '%H';
      unit = d3.time.hours.utc;
      count = 12;
      label += 'hh';
      // 1 hour minor tick
      minorUnit = d3.time.hours.utc;
      minorCount = 1;
      opt = 8;
    } else if (span <= 192) {
      // 8 days: Sep 25
      timeFormat = '%b %e';
      unit = d3.time.days.utc;
      count = 1;
      label += 'date';
      // 3 hour minor tick
      minorUnit = d3.time.hours.utc;
      minorCount = 3;
      opt = 9;
    } else if (span <= 360) {
      // 15 days: Sep 24
      timeFormat = '%b %e';
      unit = d3.time.days.utc;
      count = 2;
      label += 'date';
      // 6 hour minor tick
      minorUnit = d3.time.hours.utc;
      minorCount = 6;
      opt = 10;
    } else if (span <= 720) {
      // 30 days: Sep 21
      timeFormat = '%b %e';
      unit = d3.time.days.utc;
      count = 3;
      label += 'date';
      // 12 hour minor tick
      minorUnit = d3.time.hours.utc;
      minorCount = 12;
      opt = 11;
    } else if (span <= 1440) {
      // 54 days: Apr 3
      timeFormat = '%b %e';
      unit = d3.time.weeks.utc;
      count = 1;
      label += 'date';
      // 1 week minor tick
      minorUnit = d3.time.days.utc;
      minorCount = 1;
      opt = 12;
    } else if (span <= 8760) {
      // 1 year: Apr
      timeFormat = '%b';
      unit = d3.time.months.utc;
      count = 1;
      label += 'month';
      // 1 week minor tick
      minorUnit = d3.time.weeks.utc;
      minorCount = 1;
      opt = 13;
    } else if (span <= 17280) {
      // 2 years: Apr 2012
      timeFormat = '%b %Y';
      unit = d3.time.months.utc;
      count = 3;
      label += 'month';
      // 1 month minor tick
      minorUnit = d3.time.months.utc;
      minorCount = 1;
      opt = 14;
    } else if (span <= 25920) {
      // 3 years: Apr 2012
      timeFormat = '%b %Y';
      unit = d3.time.months.utc;
      count = 6;
      label += 'month';
      // 1 month minor tick
      minorUnit = d3.time.months.utc;
      minorCount = 1;
      opt = 15;
    } else if (span <= 43800) {
      // 5 years: 2012
      timeFormat = '%Y';
      unit = d3.time.years.utc;
      count = 1;
      label += 'year';
      // 3 month minor tick
      minorUnit = d3.time.months.utc;
      minorCount = 3;
      opt = 16;
    } else {
      // All: 2012
      timeFormat = '%Y';
      unit = d3.time.years.utc;
      count = 2;
      label += 'year';
      // 1 year minor tick
      minorUnit = d3.time.years.utc;
      minorCount = 1;
      opt = 17;
    }

    // display the date tick interval
    if (useZoomed) {
      label += ')';
      zoomIntervalSizeLabel = label;
    }

//    log("determineTimeFormat: opt " + opt + " format " + timeFormat + " count " + count);

    var result = {};
    result.format = timeFormat;
    result.unit = unit;
    result.count = count;
    result.minorUnit = minorUnit;
    result.minorCount = minorCount;
    result.opt = opt;
    return result;
  }

  /**
   * Update the data statistics since the last 12 and 24 hour boundaries. Used by SWFO for their daily reporting.
   */
  function getStats() {

    // only for swfo, and requires at least 24 hours of data
    if (isSwfo() && currentSpanHours === 24) {
      var i;
      var time;
      var value;
      var data;
      var period;
      var totalSpeed;
      var speedCount;

      var minimumBt;
      var maximumBt;
      var minimumBz;
      var maximumBz;
      var minimumSpeed;
      var averageSpeed;
      var maximumSpeed;

      // get the current time
      var now = moment.utc();

      var start = new Array(2);
      start[1] = roundToPeriodStart(now, 12 * 60 * 60);
      start[0] = moment.utc(start[1]).subtract(12 * 60 * 60 * 1000);

      for (period = 0; period < 2; period++) {
        periodStart[period] = start[period].format(DATE_FORMAT_STATS);

        // get the Bt and Bz min/max
        data = filteredMagData; //getData(BT_BZ_GRAPH, 0);
        minimumBt = Number.MAX_VALUE;
        maximumBt = -Number.MAX_VALUE;
        minimumBz = Number.MAX_VALUE;
        maximumBz = -Number.MAX_VALUE;

        for (i = 0; i < data.length; i++) {
          time = moment.utc(data[i].time_tag);

          if (time > start[period]) {
// mag is between

            value = getBt(i);

            if (value !== null) {
              minimumBt = (value < minimumBt) ? value : minimumBt;
              maximumBt = (value > maximumBt) ? value : maximumBt;

              value = getBz(i);
              minimumBz = (value < minimumBz) ? value : minimumBz;
              maximumBz = (value > maximumBz) ? value : maximumBz;
            }
          }
        }

        // get the wind speed min/max/avg
        data = filteredPlasmaData;
        minimumSpeed = Number.MAX_VALUE;
        averageSpeed = Number.MAX_VALUE;
        maximumSpeed = -Number.MAX_VALUE;
        totalSpeed = 0;
        speedCount = 0;

        for (i = 0; i < data.length; i++) {
          time = moment.utc(data[i].time_tag);
          if (time > start[period]) {
            // wind is between

            value = getSpeed(i);

            if (value !== null) {
              minimumSpeed = (value < minimumSpeed) ? value : minimumSpeed;
              maximumSpeed = (value > maximumSpeed) ? value : maximumSpeed;

              totalSpeed += value;
              averageSpeed = totalSpeed / ++speedCount;
            }
          }
        }

        // convert to formatted strings
        minBt[period] = (minimumBt !== Number.MAX_VALUE) ? minimumBt.toFixed(1) : '-';
        maxBt[period] = (maximumBt !== -Number.MAX_VALUE) ? maximumBt.toFixed(1) : '-';
        minBz[period] = (minimumBz !== Number.MAX_VALUE) ? minimumBz.toFixed(1) : '-';
        maxBz[period] = (maximumBz !== -Number.MAX_VALUE) ? maximumBz.toFixed(1) : '-';
        minSpeed[period] = (minimumSpeed !== Number.MAX_VALUE) ? Math.round(minimumSpeed) : '-';
        meanSpeed[period] = (averageSpeed !== Number.MAX_VALUE) ? Math.round(averageSpeed) : '-';
        maxSpeed[period] = (maximumSpeed !== -Number.MAX_VALUE) ? Math.round(maximumSpeed) : '-';
      }
    }
  }

// ***********************************************************************************************************
//  helper and convenience functions
// ***********************************************************************************************************

  /**
   * Get the visible width of one data sample in pixels.
   * @param {number} plotNum - the index into the plots array
   * @returns {number} - the visible width of a sample in pixels
   */
  function sampleWidth(plotNum) {
    var samples = ((visibleSpan() * 3600) / visibleResolutionByInstrument(plotNum));
    return plt_width / samples;
  }

  /**
   * Format a Date object as a string.
   * @param {Object} time - the time as a JavaScript Date object
   * @returns {string} - the time as a formatted string
   */
  function formatTimeTag(time) {
    return moment.utc(time).format(DATE_FORMAT_FILE);
  }

  /**
   * Round a number up to the nearest power of 10 (10,100,1000,etc).
   * @param {number} value - the value to round up
   * @returns {number} - the nearest power of 10
   */
  function roundToNearestPowerOf10(value) {

    // IE doesn't support log10(), but this will work on all browsers
    var exp = Math.ceil(Math.log(value) / Math.LN10);

    return Math.pow(10, exp);
  }

  /**
   * Determine if the y axis should use a logarithmic scale.
   * @param {number} plotNum - the index into the plots array
   * @returns {boolean} - true if should use log axis
   */
  function useLogAxis(plotNum) {
    var useLog = false;

    // temperature is always log
    if (plotNum === TEMP_GRAPH) {
      useLog = true;

    } else if (plotNum === DENS_GRAPH) {
      useLog = true;

      // density is log by default, only linear if swfo and max < threshold
      // SWFO uses a linear scale for low densities
      if (isSwfo() && getPlotExtent(plotNum).max <= DENS_THRESHOLD) {
        useLog = false;
      }
    }

    return useLog;
  }

  /**
   * Convert a Moment time value to its equivalent x pixel location on the plot (0 = left edge of plot).
   * Used for drawing the zoom box or placing the readout and vertical line on an unzoomed plot.
   * @param {Object} time - a time as a Moment object
   * @returns {number} - the pixel offset from the left edge of the plot corresponding to the time
   */
  function convertMomentToPixels(time) {
    return (isZoomed) ? convertMomentToPixelsZoomed(time) : convertMomentToPixelsOriginal(time);
  }

  /**
   * Convert the given Moment time value to its equivalent x pixel location on the plot (0 = left edge of plot).
   * Used for drawing the zoom box or placing the readout and vertical line on an unzoomed plot.
   * @param {Object} time - the time to convert as a Moment object
   * @returns {number} - the pixel offset from the left edge of the plot that corresponds to the given time
   */
  function convertMomentToPixelsOriginal(time) {
    var diffHours = time.diff(dataStartMoment, 'hours', true);
    var percentage = diffHours / visibleSpan();
    return Math.round(getPlotWidth() * percentage);
  }

  /**
   * Convert a Moment time value to its equivalent x pixel location on the zoomed plot (0 = left edge of plot).
   * Used for placing the readout and vertical line on a zoomed plot.
   * @param time - the time to convert as a Moment object
   * @returns {number} - the pixel offset from the left edge of the plot that corresponds to the given time
   */
  function convertMomentToPixelsZoomed(time) {
    var diffHours = time.diff(zoomStartMoment, 'hours', true);
    var percentage = diffHours / visibleSpan();
    var plotWidth = getPlotWidth();
    var pixel = Math.round(plotWidth * percentage);

    // keep it within the plot
    if (pixel < 0) {
      pixel = 0;
    } else if (pixel >= plotWidth) {
      pixel = plotWidth - 1;
    }
    return pixel;
  }

  /**
   * Get the width of the plots, in pixels
   * @returns {number} - the width of the plot in pixels
   */
  function getPlotWidth() {
    return plt_width;
  }

  /**
   * Get the height of the flag box, in pixels.
   * @returns {number} - the height of the flag box in pixels
   */
  function getFlagHeight() {
    return ('true' === flagScheme) ? FLAG_HEIGHT : 0;
  }

  /**
   * Get the plot background color based on the selected color scheme.
   * @returns {string} - the background color hex value
   */
  function getBackgroundColor() {
    return (colorScheme === WHITE_SCHEME) ? WHITE_BACKGROUND_COLOR : BLACK_BACKGROUND_COLOR;
  }

  /**
   * Get the plot background color based on the selected color scheme.
   * @returns {string} - the background color hex value
   */
  function getPlotBackgroundColor() {
    return (colorScheme === WHITE_SCHEME) ? WHITE : BLACK;
  }

  /**
   * The axis and tick mark line color.
   * @returns {string} - the line color hex value
   */
  function getLineColor() {
    return (colorScheme === WHITE_SCHEME) ? WHITE_BACKGROUND_LINE_COLOR : BLACK_BACKGROUND_LINE_COLOR;
  }

  /**
   * The date labels are drawn on a canvas, and so are controlled via a tick option rather than css.
   * @returns {string} - the label color hex value
   */
  function getLabelColor() {
    return (colorScheme === WHITE_SCHEME) ? WHITE_BACKGROUND_LABEL_COLOR : BLACK_BACKGROUND_LABEL_COLOR;
  }

  /**
   * Get the current plot border color.
   * @returns {string} - the border color hex value
   */
  function getBorderColor() {
    return (colorScheme === WHITE_SCHEME) ? WHITE_BACKGROUND_BORDER_COLOR : BLACK_BACKGROUND_BORDER_COLOR;
  }

  /**
   * Get whether to draw this plot as markers (dots) or lines.
   * @param {number} plotNum - the index into the plots array
   * @returns {boolean}
   */
  function getMarkerScheme(plotNum) {
    var marker;

    // Phi must only be plotted as markers, lines don't make sense
    if (plotNum === PHI_GRAPH) {
      marker = true;
    } else {
      // if hybrid scheme and effective plot time span > 6 hours, use markers, otherwise use line for widely separated points in short time span
      if (renderScheme === HYBRID_SCHEME) {

        // use markers if effective span is > 6 hours
//        marker = (visibleSpan() > 6);
        marker = (currentSpanHours > 6);
      } else {
        // either all markers or all lines
        marker = (renderScheme !== LINE_SCHEME);
      }
    }

    return marker;
  }

  /**
   * Return the appropriate marker diameter in pixels (range 1-3).
   * @param {number} plotNum - the index into the plots array
   * @returns {number} - the marker size in pixels
   */
  function getMarkerSize(plotNum) {
    var markerSize;

    // SWFO wants tiny dots since they're on a very small screen and want high density plots
    // 1 is too small, 2 is too big
    if (isSwfo()) {
      markerSize = 1.5;
    } else {
      // adjust the marker size based on the data density of this plot (2+ is a high density, want smaller points)
      var samples = (visibleSpan() * 3600.0) / visibleResolutionByInstrument(plotNum);
      var pointDensity = samples / plt_width;

      // take advantage of the fact that marker sizes can be fractional, and compute the optimal size
      markerSize = (pointDensity === Infinity) ? 1 : (-1.0 * pointDensity) + 3;

      // set a minimum marker size
      if (markerSize < 1) {
        markerSize = 1;
      }
    }

    return markerSize;
  }

  /**
   * Return the current visible span in fractional hours
   * @returns {number} - the visible span in fractional hours
   */
  function visibleSpan() {
    return (isZoomed) ? ((zoomEndMoment - zoomStartMoment) / 1000.0 / 3600.0) : (endMoment.diff(startMoment, 'hours'));
  }

  /**
   * Get the index into the file descriptor arrays of what's currently visible.
   * @returns {number} - the visible index
   */
  function visibleIndex() {
    return (zoomIndex !== undefined) ? zoomIndex : currentIndex;
  }

  /**
   * Get the start time of the visible span.
   * @returns {Object} - the visible start time as a Moment
   */
  function visibleStart() {
    return (isZoomed) ? zoomStartMoment : startMoment;
  }

  /**
   * Get the end time of the visible span.
   * @returns {Object} - the visible end time as a Moment
   */
  function visibleEnd() {
    return (isZoomed) ? zoomEndMoment : endMoment;
  }

  /**
   * Determine if min/max bands are used in the current plots. Min/max bands are used unless native resolution data is visible.
   * @returns {boolean} - true if bands are used
   */
  function useBands() {
    return (!isNativeResolutionVisible());
  }

  /**
   * Compute the elapsed seconds since the given time.
   * @param {Object} start - the start time of the period
   * @return {number} the elapsed time in integer seconds
   */
  function deltaSec(start) {
    return Math.round((100 * (moment.utc() - start)) / 1000) / 100;
  }

  /**
   * Round a floating point number to two sig figs, e.g., 23.279 -> 23.38
   * @param {number} value - the number to round
   * @return {number} - the value rounded to 2 digits
   */
  function sigFig(value) {
    return Math.round(100 * value) / 100;
  }

  /**
   * Get the series color array for this plot.
   * @param {number} plotNum - the index into the plots array
   * @returns {string[]} - array of series colors as hex values
   */
  function getColors(plotNum) {
    // make a copy of the array in order to treat the values as constants
    var colors = SERIES_COLORS[plotNum].slice(0);
    var i;

    // reverse black/white and purple/yellow for better contrast depending on the background color scheme, default is white scheme
    for (i = 0; i < colors.length; i++) {
      if (colorScheme === BLACK_SCHEME) {
        if (colors[i] === BLACK) {
          colors[i] = WHITE;
        }
        if (colors[i] === PURPLE) {
          colors[i] = YELLOW;
        }
      }
    }

    return colors;
  }

  /**
   * Adjust the Phi angle value to fit the desired display range of 45-405 degrees.
   * @param {number} value - the initial phi angle value (0-360 degrees)
   * @returns {number} - the adjusted value
   */
  function adjustPhiValue(value) {
    // leave nulls intact, otherwise bump up values in the range 0-45 degrees by 360
    return (value !== null && value < PHI_ADJUST) ? value + 360.0 : value;
  }

  /**
   * Revert a Phi value from 45-405 back to 0-360.
   * @param {string} name - the data type
   * @param {number} value - the value to potentially convert
   * @returns {number} - the converted value
   */
  function revertPhiValue(name, value) {
    var result = value;

    // override phi to convert from 45-405 back to 0-360
    if (name === 'lon_gsm' || name === 'lon_gsm_min' || name === 'lon_gsm_max') {
      result = (value > 360) ? value - 360 : value;
    }
    return result;
  }

  function getFirstNonNullDataMomentD3(useVisible) {
//    log("getFirstNonNullDataMomentD3");
    var mag = getFirstNonNullMagDataMomentD3(getPlotData(BT_BZ_GRAPH), useVisible);
    var plasma = getFirstNonNullPlasmaDataMomentD3(getPlotData(DENS_GRAPH), useVisible);
    return (mag < plasma) ? mag : plasma;
  }

  function getLastNonNullDataMomentD3(useVisible) {
//    log("getLastNonNullDataMomentD3");
    var mag = getLastNonNullMagDataMomentD3(getPlotData(BT_BZ_GRAPH), useVisible);
    var plasma = getLastNonNullPlasmaDataMomentD3(getPlotData(DENS_GRAPH), useVisible);
    return (mag > plasma) ? mag : plasma;
  }

  function getFirstNonNullMagDataMomentD3(dataset, useVisible) {
    var index = getFirstNonNullDataIndexD3(BT_BZ_GRAPH, dataset, useVisible);
//    if (dataset == undefined) {
//      log("getFirstNonNullMagDataMomentD3 dataset is undefined");
//    } else {
//      log("getFirstNonNullMagDataMomentD3 index " + index + " dataset length " + dataset.length + " filteredMagData length " + filteredMagData.length);
//    }
    return moment.utc(filteredMagData[index].time_tag);
  }

  function getLastNonNullMagDataMomentD3(dataset, useVisible) {
//    log("getLastNonNullMagDataMomentD3");
    var index = getLastNonNullDataIndexD3(BT_BZ_GRAPH, dataset, useVisible);
    return moment.utc(filteredMagData[index].time_tag);
  }

  function getFirstNonNullPlasmaDataMomentD3(dataset, useVisible) {
//    log("getFirstNonNullPlasmaDataMomentD3");
    var index = getFirstNonNullDataIndexD3(DENS_GRAPH, dataset, useVisible);
    return moment.utc(filteredPlasmaData[index].time_tag);
  }

  function getLastNonNullPlasmaDataMomentD3(dataset, useVisible) {
//    log("getLastNonNullPlasmaDataMomentD3");
    var index = getLastNonNullDataIndexD3(DENS_GRAPH, dataset, useVisible);
    return moment.utc(filteredPlasmaData[index].time_tag);
  }

  /**
   * Get the index of the first non-null element in the data array associated with this plot.
   * @param {number} plotNum - the index into the plots array
   * @param {*} dataSet - the data array to search
   * @param {boolean} useVisible - true if only the visible elements should be examined
   * @returns {number} - the array index
   */
    // TODO clean up args
  function getFirstNonNullDataIndexD3(plotNum, dataSet, useVisible) {
//    log("getFirstNonNullDataIndexD3: plotNum " + plotNum + " useVisible " + useVisible);
    var index = 0;
    var i;
    if (dataSet !== undefined) {

      // TODO change to just use 0, length-1
      var firstIndex = computeIndexFromMomentByInstrument(dataStartMoment, plotNum);
      var lastIndex = computeIndexFromMomentByInstrument(dataEndMoment, plotNum);

      // walk through all the data arrays until we find one that is not all nulls
      for (i = firstIndex; i < Math.min(lastIndex + 1, dataSet.length); i++) {
        if (dataSet[i] === undefined) {
//        log("getFirstNonNullDataIndexD3: dataSet[" + i + "] " + dataSet[i] + " firstIndex " + firstIndex + " lastIndex " + lastIndex);
        } else {
          //TODO replace with name-independent check, here and elsewhere
          if (dataSet[i].bt !== null || dataSet[i].speed !== null || dataSet[i].kp !== null) {
            index = i;
            break;
          }
        }
      }
    }

    return index;
  }

  /**
   * Get the index of the last non-null element in the data array associated with this plot.
   * @param {number} plotNum - the index into the plots array
   * @param {*} dataSet - the data array to search
   * @param {boolean} useVisible - true if only the visible elements should be examined
   * @returns {number} - the array index
   */
    // TODO clean up args
  function getLastNonNullDataIndexD3(plotNum, dataSet, useVisible) {
//    log("getLastNonNullDataIndexD3");
    var index = 0;
    var i;
    if (dataSet !== undefined) {
      index = dataSet.length - 1;

      var firstIndex = 0;
      var lastIndex = dataSet.length - 1;

      // walk backwards through each type of data array until we find one that is not all nulls
      for (i = lastIndex; i >= firstIndex; i--) {
        if (dataSet[i] === undefined) {
//        log("getLastNonNullDataIndexD3: dataSet[" + i + "] " + dataSet[i] + " firstIndex " + firstIndex + " lastIndex " + lastIndex);
        } else {
          //TODO replace with name-independent check, here and elsewhere
          if (dataSet[i].bt !== null || dataSet[i].speed !== null || dataSet[i].kp !== null) {
            index = i;
            break;
          }
        }
      }
    }

//    log("getLastNonNullDataIndexD3: plotNum " + plotNum + " useVisible " + useVisible + " last non null index " + index);

    return index;
  }

  /**
   * Reset all of the zoom-related attributes to their unzoomed state.
   */
  function resetZoomAttributes() {
//    log("resetZoomAttributes");
    // reset the zoom coordinates
    isZoomed = false;
    zoomIndex = undefined;
    zoomStartPixel = undefined;
    zoomEndPixel = undefined;
    saveFirstDataMoment = undefined;
    saveLastDataMoment = undefined;
    drilldown = false;
  }

  /**
   * Return the timestamp of the earliest data point. Since all mag values come together and all plasma values come together, we only need to check
   * one of each type.
   * @returns {Object} - the earliest time as a Moment object
   */
  function getFirstDataMomentD3() {
    // TODO just set a global in initialLoad and dataUpdate!
//    log("getFirstDataMomentD3: magData length " + magData.length + " [0] " + JSON.stringify(magData[0]));
    var firstMag = moment.utc(filteredMagData[0].time_tag);
    var firstPlasma = moment.utc(filteredPlasmaData[0].time_tag);
    return (firstMag.isBefore(firstPlasma)) ? firstMag : firstPlasma;
  }

  /**
   * (d3-compliant) Track the time of the most recently received data point.
   * @param {Object} time - the new time Moment
   */
  function updateLastDataMoment(time) {
    if (lastDataMoment === undefined || time > lastDataMoment) {
      lastDataMoment = time;
    }
  }

  /**
   * Return the CSS height in pixels of a DOM element.
   * @param {string} element - the dom element
   * @returns {number} - the height in pixels
   */
  function getCssHeight(element) {
    return getCssPixels(element, 'height');
  }

  /**
   * Return the CSS width in pixels of a DOM element.
   * @param {string} element - the dom element
   * @returns {number} - the width in pixels
   */
  function getCssWidth(element) {
    return getCssPixels(element, 'width');
  }

  /**
   * Get the CSS property pixel value. Returns 0 if not a px value.
   * @param {string} element - the DOM element ('#readout', '.option_button', etc.)
   * @param {string} property - the property of interest ('width', 'font-size', etc.)
   * @returns {number} - the pixel value
   */
  function getCssPixels(element, property) {
    var propertyString = $(element).css(property);
    if (propertyString !== undefined) {
      var value = parseInt(propertyString.substring(0, propertyString.indexOf('px')));
      if (isNaN(value)) {
        value = 0;
      }
    } else {
      value = 0;
    }

    return value;
  }

  /**
   * Create an axis tick mark.
   * @param {number} value - the axis value at this tick
   * @param {boolean} forceZero - true if the zero axis must be shown, which implies a gridline
   * @returns {Object} - the created tick
   */
    //TODO these still have jqplot-isms...
  function createTick(value, forceZero) {
    var tick = {};
    if (value === 0 && forceZero) {
      tick = {value: 0, showLabel: true, showMark: true, showGridline: true, isMinorTick: false};
    } else {
      tick = {value: value, showLabel: true, showMark: true, showGridline: true, isMinorTick: true};
    }
    return tick;
  }

  /**
   * Create a minor tick (no label or gridline).
   * @param {number} value - the y-axis value at this tick
   * @returns {{value: number, showLabel: boolean, showMark: boolean, showGridline: boolean}}
   */
  function minorTick(value) {
    return {value: value, showLabel: false, showMark: true, showGridline: false};
  }

  /**
   * Create a minor tick for a min or max value (no mark or gridline).
   * @param {number} value - the y-axis value at this tick
   * @returns {{value: number, showLabel: boolean, showMark: boolean, showGridline: boolean}}
   */
  function minMaxTick(value) {
    return {value: value, showLabel: true, showMark: false, showGridline: false};
  }

  /**
   * Update the overall timespan start timestamp display.
   */
  function updateTimespanStartDate() {
    var tokens = startMoment.format(DATE_FORMAT_DISPLAY).split(' ');
    timespanStartDateLabel = tokens[0];
    timespanStartTimeLabel = tokens[1];
  }

  /**
   * Is the page running in Firefox?
   * @returns {boolean} - true if browser is Firefox
   */
  function isFirefox() {
    return (navigator.userAgent.search("Firefox") >= 0);
    //  if (navigator.userAgent.search("Chrome") >= 0)
    //  if (navigator.userAgent.search("Safari") >= 0 && navigator.userAgent.search("Chrome") < 0)
    //  if (navigator.userAgent.search("Opera") >= 0)
  }

  /**
   * Is the page running in MSIE?
   * @returns {boolean} - true if browser is MSIE
   */
  function isMSIE() {
//    log("isMSIE userAgent " + navigator.userAgent);
    return (navigator.userAgent.search("Trident") >= 0 || navigator.userAgent.search("rv:11.0") >= 0);
  }

// ***********************************************************************************************************
//  helper and convenience functions for Phase II min/max/mean plotting and zooming
// ***********************************************************************************************************

  /**
   * Compute the file number for the given file type which contains the given time.
   *
   * @param {string} tag - the file name tag
   * @param {Object} time - the time to include in the file
   * @return {number} - the file number
   */
  function computeFileNumber(tag, time) {
    var index = getIndexForTag(tag);
    var number;

    if (isHighRes(index)) {
      // high-res data (1sec/3sec = high-res) is only supplied by DSCOVR

      // compute the file number containing the given time (File 0 is the start of the mission)
      number = computeDeltaPeriods(timespans[index] * 60, DSCOVR_START, time);

    } else {
      // all other data

      // compute the number of timespan periods between the mission start and the given time, and round down to get the file number
      number = computeDeltaPeriods(timespans[index] * 60, MISSION_START, time);
    }

    // compute the file number range for this year (File 0 is the start of the mission)
    return number;
  }

  /**
   * Compute the Kp-Ap Phase II JSON file number which contains the given time.
   *
   * @param {string} tag - the file name tag
   * @param {Object} time - the time to include in the file
   * @return {number} - the file number
   */
  function computeKpApFileNumber(tag, time) {
    var index = getIndexForTag(tag);

    // compute the number of timespan periods between the Kp-Ap data start and the given time, and round down to get the file number
    return computeDeltaPeriods(timespans[index] * 60, KPAP_START, time);
  }

  /**
   * Return the array index that corresponds to the given tag.
   *
   * @param {string} tag - tag the file name tag, e.g., mag-90-minute
   * @return {number} - the corresponding array index
   */
  function getIndexForTag(tag) {
    var index;

    // scan through the array using brute force, entries are unique by definition
    for (var k = 0; k < files.length; k++) {
      if (files[k] === tag) {
        index = k;
      }
    }

    return index;
  }

  /**
   * Compute the delta whole number of averaging periods of the given # of seconds between the two times.
   *
   * @param {number} periodLengthSeconds - the length of the averaging period in seconds
   * @param {Object} start               - the start moment
   * @param {Object} end                 - the end moment
   * @return {number} - the delta whole number of averaging periods
   */
  function computeDeltaPeriods(periodLengthSeconds, start, end) {
    var duration = moment.duration(end.diff(start)).asSeconds();
    return Math.floor(duration / periodLengthSeconds);
  }

  /**
   * Round the given time down to the nearest boundary at the given resolution. For example, 12:17:46 rounded to 60 seconds would be 12:17:00.
   *
   * @param {Object} time - the time to round as a Moment
   * @param {number} resolutionSeconds - the rounding period length in seconds
   * @return {Object} the rounded time as a Moment
   */
  function roundToPeriodStart(time, resolutionSeconds) {
    var roundedTime;
    var seconds;
    var periods;
    var periodDays;

    var timeAtStartOfDay = moment.utc(time).subtract(time.diff(moment.utc(time).startOf('day')));

    if (resolutionSeconds < ONE_DAY) {
      // compute the whole number of one-second periods that have elapsed since the start of the day using implicit truncation
      seconds = Math.floor(time.diff(moment.utc(time).startOf('day')) / 1000);

      // determine the number of whole periods which have elapsed so far today
      periods = Math.floor(seconds / resolutionSeconds);

      // return the time corresponding to the start of the period before the given time
      roundedTime = timeAtStartOfDay.add(periods * resolutionSeconds, 'seconds');
    } else {
      // determine how many days the period is
      periodDays = Math.floor(resolutionSeconds / ONE_DAY);

      // each period is more than one day
      // determine the number of whole periods which have elapsed the mission start to the start of today
      periods = Math.floor((timeAtStartOfDay.valueOf() - MISSION_START.valueOf()) / (periodDays * ONE_DAY_MS));

      // return the time corresponding to the start of the period before the given time
      roundedTime = moment.utc(MISSION_START).add(periods * periodDays, 'days');
    }

    return roundedTime;
  }

  /**
   * Return true if the currently selected timespan is the full mission.
   * @returns {boolean}
   */
  function isMission() {
    return (currentIndex === files.length - 1);
  }

  /**
   * Determine if the given plot is Plasma data.
   * @param {number} plotNum - the plot number
   * @returns {boolean} - true if this plot is Plasma data
   */
  function isPlasmaPlot(plotNum) {
    return (plotNum === DENS_GRAPH || plotNum === SPEED_GRAPH || plotNum === TEMP_GRAPH);
  }

  /**
   * Return the instrument-specific data resolution period (1-sec, 5-min, 1-day, etc) that is currently visible. The DSCOVR Faraday Cup high-res data is
   * at a 3-second resolution.
   * @returns {number} - the visible instrument-specific resolution in seconds
   */
  function visibleResolutionByInstrument(plotNum) {
    if (plotNum === KPAP_GRAPH) {
      return kpApResolutions[visibleIndex()];
    } else {
      return (isPlasmaPlot(plotNum) && isHighRes(visibleIndex())) ? THREE_SECOND : visibleResolution();
    }
  }

  /**
   * Return the data resolution period (1-sec, 5-min, 1-day, etc) that is currently visible.
   * @returns {number} - the visible resolution in seconds
   */
  function visibleResolution() {
    return resolutions[visibleIndex()];
  }

  /**
   * Is the currently visible plot using native resolution data? I.e., Mag 1-sec or 1-min, Plasma 3-sec or 1-min.
   * @returns {boolean} - true if native resolution data is being plotted
   */
  function isNativeResolutionVisible() {
    return (visibleResolution() <= ONE_MINUTE);
  }

  /**
   * Determine if the current index uses high-res data. This allows for multiple high-res indices rather than the single current one.
   * @param {number} index - the index into the file descriptor array
   * @returns {boolean} - true if this index uses high-res data
   */
  function isHighRes(index) {
    return (resolutions[index] < ONE_MINUTE);
  }

  /**
   * Return a limited minimum value.
   * @param {Number} value - the value to limit
   * @param {Number} limit - the lower limit
   * @returns {Number} - the limited value
   */
  function limitLow(value, limit) {
    return (value !== null && value < limit) ? limit : value;
  }

  /**
   * Apply the current source spacecraft and active settings to filter the plasmag data sets.
   */
  function applyFilters() {
    filteredMagData = filterData(magData);
    filteredPlasmaData = filterData(plasmaData);

    // TODO handle empty arrays

    // determine which spacecraft's data are visible under the current source scheme
    determineVisibleSource();
  }

  /**
   * Apply the current source spacecraft and active settings to filter the plasmag recurrence data sets.
   */
  function applyFiltersRecurrence() {
    filteredMagDataRecurrence = filterData(magDataRecurrence);
    filteredPlasmaDataRecurrence = filterData(plasmaDataRecurrence);
  }

  /**
   * Apply the current source spacecraft and active settings to filter the plasmag current-recurrence data sets.
   */
  function applyFiltersR() {
    filteredMdatar = filterData(mdatar);
    filteredPdatar = filterData(pdatar);
  }

  /**
   * Because of how D3 builds paths, need to filter the data down to just the elements of interest.
   * @returns {Array}
   */
  function filterData(data) {
    var tempData = [];
    if (data !== undefined) {
      for (var i = 0; i < data.length; i++) {
        // if (i < 100) {
        //   log("jjj filterData: data[" + i + "] " + JSON.stringify(data[i].time_tag + " " + data[i].source));
        // }

        // if (moment.utc(data[i].time_tag).isAfter(moment.utc('2018-11-09')) && moment.utc(data[i].time_tag).isBefore(moment.utc('2019-01-28'))) {
        //   // if (!useData[data.i]) {
        //     log("jj filterData:" + JSON.stringify(moment.utc(data[i].time_tag)) + " useData " + useData(data[i]));
        //   // }
        // }
        // is this an element of interest?
        if (useData(data[i])) {
          tempData.push(data[i]);
        // } else {
        //   log("jj filterData: ignoring " + JSON.stringify(moment.utc(data[i].time_tag)) + " useData " + useData(data[i]));
        }
      }
    }

    // if showing the Active spacecraft, defer to using SOURCE_MULTIPLE where present
    var filteredData = [];
    var time = null;

    for (i = 0; i < tempData.length - 1; i++) {

      // if (i < 100) {
      //   log("jjj filterData: tempData[" + i + "] " + JSON.stringify(tempData[i].time_tag + " " + tempData[i].source));
      // }

      // found a multiple spacecraft record
      if (time !== null) { //(tempData[i].source === SOURCE_MULTIPLE) {
        for (j = -3; j <= -1; j++) {
          // log("multiple filtered last " + (filteredData.length+j) + " index " + (filteredData.length+j) + " " +
          //     JSON.stringify(moment.utc(filteredData[filteredData.length+j].time_tag)) +
          //     " source " + filteredData[filteredData.length+j].source + " j " + j);
        }
        // remove the now-unnecessary ACE and DSCOVR entries that were just added
        for (j = 0; j < 2; j++) {
          if (filteredData[filteredData.length - 2].time_tag === time) {
            // log("jj removing filtered " + JSON.stringify(moment.utc(filteredData[filteredData.length-2].time_tag)) +
            //     " source " + filteredData[filteredData.length-2].source + " j " + j);
            filteredData.splice(filteredData.length-2, 1);


            // if (filteredData[filteredData.length-2].source === 2) {
            //   log("wtf " + JSON.stringify(moment.utc(filteredData[filteredData.length-1].time_tag)));
            // }
          }
        }

        for (j = -3; j <= -1; j++) {
          // log("after removal, multiple filtered last " + (filteredData.length+j) + " index " + (filteredData.length+j) + " " +
          //     JSON.stringify(moment.utc(filteredData[filteredData.length+j].time_tag)) +
          //     " source " + filteredData[filteredData.length+j].source + " j " + j);
        }
      }

      filteredData.push(tempData[i]);
      if (tempData[i].source === SOURCE_MULTIPLE) {
//        log("jj added multiple source " + JSON.stringify(moment.utc(tempData[i].time_tag)) + " source " + tempData[i].source);
        time = tempData[i].time_tag;
      } else {
        time = null;
      }
    }

    return filteredData;
  }

  /**
   * (D3-specific) D3 uses an optional key function to distinguish data array elements. The default algorithm is to use the array index. This is insufficient for our use.
   * This functions uses the minimum distinguishing attributes and returns a unique string.
   * @param {Object} d - the data element
   * @returns {string} - the unique key string for this element
   */
  function keyFunction(d) {
    // distinguishes each element by unique time tag. However, now we can have up to 3 elements with the same time tag
    return d.time_tag + ' ' + d.source + ' ' + d.active;
  }

  function keyFunctionRecurrence(d) {
    // distinguishes each element by unique time tag. However, now we can have up to 3 elements with the same time tag
    return 'r ' + d.time_tag + ' ' + d.source + ' ' + d.active;
  }

// ***********************************************************************************************************
//  data save to file methods
// ***********************************************************************************************************

  /**
   * Save the currently visible data to a text file on the client machine.
   */
  function saveDataToFile() {

    try {
      var text = [];
      var start = moment.utc(visibleStart()).format(DATE_FORMAT_FILENAME);
      var end = moment.utc(visibleStart()).format(DATE_FORMAT_FILENAME);

      // create the metadata
      text.push('RTSW web plot data - created ' + moment.utc().format(DATE_FORMAT_FILE) + '\n');
      text.push('More information is available from SWPC at http://www.swpc.noaa.gov/products/real-time-solar-wind\n');
      text.push('\n');
      text.push('Start: ' + start + '\n');
      text.push('End:   ' + end + '\n');
      text.push('Source: 0=ACE, 1=DSCOVR, 2=mixed ACE+DSCOVR\n');
      text.push('\n');
      text.push('Resolution: ' + resolutionText[visibleIndex()] + '\n');
      if (useBands()) {
        text.push('med=50th percentile (median), min=1st percentile, max=99th percentile\n');
      }
      text.push('Phi mean is the average angle, taking into account the wrapping at 0/360 degrees\n');
      text.push('\n');
      text.push('More data is available from the NCEI archive at https://www.ngdc.noaa.gov/dscovr\n');
      text.push('\n');

      // create the column header line
      text.push('Timestamp           Source');
      var columns;
      if (useBands()) {
        columns = ['Bt-med', 'Bt-min', 'Bt-max', 'Bx-med', 'Bx-min', 'Bx-max', 'By-med', 'By-min', 'By-max', 'Bz-med', 'Bz-min', 'Bz-max',
          'Phi-mean', 'Phi-min', 'Phi-max', 'Theta-med', 'Theta-min', 'Theta-max',
          'Dens-med', 'Dens-min', 'Dens-max', 'Speed-med', 'Speed-min', 'Speed-max', 'Temp-med', 'Temp-min', 'Temp-max'];
      } else {
        columns = ['Bt', 'Bx', 'By', 'Bz', 'Phi', 'Theta', 'Dens', 'Speed', 'Temp'];
      }
      for (var k = 0; k < columns.length; k++) {
        text.push(formatString(columns[k], TEXT_WIDTH + 1));
      }
      text.push('\n');

      // convert the the visible data to text
      text = convertDataToText(text);

      // save the output lines to the client machine as a text file using FileSaver.js
      var blob = new Blob(text, {type: "text/plain;charset=utf-8"});
      saveAs(blob, 'rtsw_plot_data_' + start + '.txt');
    } catch (e) {
      log("error saving data to text file " + JSON.stringify(e));
    }
  }

  /**
   * Convert the visible plasmag data to text, with each record on one line.
   * @param {Array} text - the text to write to the file
   * @returns {Array} - the text updated with the data records
   */
  function convertDataToText(text) {
    var magElement = 0;
    var plasmaElement = 0;
    var magTime;
    var plasmaTime;
    var line;
    var magStart;
    var magEnd;
    var plasmaStart;
    var plasmaEnd;
    var magDataset = getPlotData(BT_BZ_GRAPH);
    var plasmaDataset = getPlotData(DENS_GRAPH);

//    log("length mag " + magDataset.length + " plasma " + plasmaDataset.length);
//    for (var i = 0; i < magDataset.length; i++) {
//      log("mag " + i + " " + formatTimeTag(magDataset[i].time_tag));
//    }

    if (isZoomed) {
      // identify the zoomed element range
      magStart = bisectDate(magDataset, visibleStart().valueOf()) - 1;
      magEnd = bisectDate(magDataset, visibleEnd().valueOf()) - 1;
      plasmaStart = bisectDate(plasmaDataset, visibleStart().valueOf()) - 1;
      plasmaEnd = bisectDate(plasmaDataset, visibleEnd().valueOf()) - 1;
    } else {
      // use the whole array
      magStart = 0;
      magEnd = magDataset.length - 1;
      plasmaStart = 0;
      plasmaEnd = plasmaDataset.length - 1;
    }

    var recordTime = (plasmaDataset[plasmaStart].time_tag > magDataset[magStart].time_tag) ? magDataset[magStart].time_tag : plasmaDataset[plasmaStart].time_tag;
    var endTime = (plasmaDataset[plasmaEnd].time_tag > magDataset[magEnd].time_tag) ? magDataset[magEnd].time_tag : plasmaDataset[plasmaEnd].time_tag;
    var resolutionSeconds = visibleResolution();

//    log("magTime    " + formatTimeTag(magDataset[magElement].time_tag) + " getTime " + magDataset[magStart].time_tag.getTime());
//    log("plasmaTime " + formatTimeTag(plasmaDataset[plasmaElement].time_tag) + " getTime " + plasmaDataset[plasmaStart].time_tag.getTime());
//    log("recordTime " + formatTimeTag(recordTime) + " getTime " + recordTime.getTime());

    while (recordTime.valueOf() <= endTime.valueOf()) {
      line = "";
//      log(" ");
//      log("magElement " + magElement + " " + formatTimeTag(magDataset[magElement].time_tag) + " bt " + magDataset[magElement].bt +
//          " plasmaElement " + plasmaElement + " " + formatTimeTag(plasmaDataset[plasmaElement].time_tag) + " speed " + plasmaDataset[plasmaElement].speed);

      magTime = magDataset[magElement].time_tag;
      plasmaTime = plasmaDataset[plasmaElement].time_tag;

//      log("magTime    " + formatTimeTag(magDataset[magElement].time_tag) + " getTime " + magDataset[magElement].time_tag.getTime() +
//          " source " + magDataset[magElement].source + " active " + magDataset[magElement].active + " magElement " + magElement);
//      log("plasmaTime " + formatTimeTag(plasmaDataset[plasmaElement].time_tag) + " getTime " + plasmaDataset[plasmaElement].time_tag.getTime() +
//          " source " + plasmaDataset[plasmaElement].source + " active " + plasmaDataset[magElement].active + " plasmaElement " + plasmaElement);
//      log("recordTime " + formatTimeTag(recordTime) + " getTime " + recordTime.getTime());

      if (magTime.valueOf() === recordTime.valueOf() || plasmaTime.valueOf() === recordTime.valueOf()) {
//        log("either mag or plasma matches");

        if (magTime.valueOf() === plasmaTime.valueOf()) {
//          log("times match, using both");
          // use both mag and plasma
          line = formatTimeTag(recordTime) + outputSource(magElement) + outputLineMag(magElement++) + outputLinePlasma(plasmaElement++);
        } else if (plasmaTime.valueOf() > magTime.valueOf()) {
//          log("plasma is later, use only mag");
          // use only mag
          line = formatTimeTag(recordTime) + outputSource(magElement) + outputLineMag(magElement++) + outputNullLinePlasma();
        } else if (plasmaTime.valueOf() < magTime.valueOf()) {
//          log("plasma is earlier, use only plasma");
          // use only plasma
          line = formatTimeTag(recordTime) + outputSource(plasmaElement) + ' ' + outputNullLineMag() + outputLinePlasma(plasmaElement++);
//        } else {
//          log("********* unknown time comparison");
        }

//        log("incrementing recordTime");
        recordTime = moment.utc(recordTime).add(resolutionSeconds, 'seconds').toDate();
        //      log("recordTime " + recordTime.valueOf() + " magTime " + magTime.valueOf() + " plasmaTime " + plasmaTime.valueOf());
      } else {
//        log("times don't match");
        // insert null records
        while (recordTime.valueOf() < magTime.valueOf() && recordTime.valueOf() < plasmaTime.valueOf()) {
          line = formatTimeTag(recordTime) + format(-1, 7, 0) + ' ' + outputNullLineMag() + outputNullLinePlasma();
//          log("adding null " + line + " and incrementing recordTime");
          recordTime = moment.utc(recordTime).add(resolutionSeconds, 'seconds').toDate();
        }
      }

//      log("final " + line);

      line += '\n';
      text.push(line);
    }

    return text;
  }

  /**
   * (d3-specific) Save the currently displayed plots to a .png image file on the client machine.
   */
  function saveDataToImage() {
    // define the SVG XML header
    var doctype = '<?xml version="1.0" standalone="no"?>'
        + '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">';

    // select all of the hover_readout elements
    var readouts = $('.hover_readout');

    // temporarily hide the hover readouts
    readouts.hide();

    // serialize the SVG to an XML string
    var source = (new XMLSerializer()).serializeToString(d3.select('svg').node());

    // create a file blob of the SVG
    var blob = new Blob([doctype + source], { type: 'image/svg+xml;charset=utf-8' });

    // show the hover readouts
    readouts.show();

    // cross-browser URL handling
    window.URL = window.URL || window.webkitURL;
    var url = window.URL.createObjectURL(blob);

    // put the svg into an image tag so that the canvas element can read it in
    var img = d3.select('body').append('img')
        .attr('width', full_width)
        .attr('height', full_height)
        .node();

    // define the image onload function inline
    img.onload = function () {

      // now that the image has loaded, draw the image onto a canvas element
      var canvas = d3.select('body').append('canvas').node();
      canvas.width = full_width;
      canvas.height = full_height;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      // TODO add date to the filename, talk to Doug
//      var start = moment.utc(visibleStart()).format(DATE_FORMAT_FILENAME);

      // write the final rendered canvas element to a PNG file
      canvas.toBlob(function (blob) {
        log("saveDataToImage: about to call saveAs with blob");
//        saveAs(blob, 'rtsw_plot_' + start + '.png');
        saveAs(blob, 'plot_image_.png');
      });

      // clean up, otherwise the canvas will be displayed at the bottom of the page
      canvas.remove();
    };

    // start loading the image to invoke the onload()
    img.src = url;

    // clean up, otherwise the image will be displayed at the bottom of the page
    img.remove();
  }

  /**
   * Create a formatted text string for the given mag sample.
   * @param {number} element - the mag data array index
   * @returns {string} - the mag data formatted as a string
   */
  function outputSource(element) {
    var sample = getPlotData(BT_BX_BY_GRAPH)[element];
    if (sample === undefined) {
      sample = getPlotData(DENS_GRAPH)[element];
    }
    return formatString(sample.source.toString(), 7);
  }

  /**
   * Create a formatted text string for the given mag sample.
   * @param {number} element - the mag data array index
   * @returns {string} - the mag data formatted as a string
   */
  function outputLineMag(element) {
    var text = ' ';
    var names;

    if (useBands()) {
      names = ['bt', 'bt_min', 'bt_max', 'bx_gsm', 'bx_gsm_min', 'bx_gsm_max', 'by_gsm', 'by_gsm_min', 'by_gsm_max', 'bz_gsm', 'bz_gsm_min', 'bz_gsm_max',
        'lon_gsm', 'lon_gsm_min', 'lon_gsm_max', 'lat_gsm', 'lat_gsm_min', 'lat_gsm_max'];
    } else {
      names = ['bt', 'bx_gsm', 'by_gsm', 'bz_gsm', 'lon_gsm', 'lat_gsm'];
    }

    for (var i = 0; i < names.length; i++) {
      text += getFormattedSeries(names[i], element) + SPACE;
    }
    return text;
  }

  /**
   * Create a formatted text string for the given plasma sample.
   * @param {number} element - the plasma data array index
   * @returns {string} - the plasma data formatted as a string
   */
  function outputLinePlasma(element) {
    var text = '';
    var names;

    if (useBands()) {
      names = ['density', 'density_min', 'density_max', 'speed', 'speed_min', 'speed_max', 'temperature', 'temperature_min', 'temperature_max'];
    } else {
      names = ['density', 'speed', 'temperature'];
    }

    for (var i = 0; i < names.length; i++) {
      text += getFormattedSeries(names[i], element) + SPACE;
    }
    return text;
  }

  function outputNullLineMag() {
    return outputNullLine(18, 6);
  }

  function outputNullLinePlasma() {
    return outputNullLine(9, 3);
  }

  function outputNullLine(bandCount, nativeCount) {
    var text = "";
    var count = (useBands()) ? bandCount : nativeCount;
    for (var k = 0; k < count; k++) {
      text += format(null, 9, 0);
      text += " ";
    }
    return text;
  }

  /**
   * Format a numeric value as a string using the given parameters.
   * @param {number} value - value to format
   * @param {number} width - the total width of the field including left padding spaces
   * @param {number} digits - the number of digits after the decimal point
   * @returns {string} - the formatted value
   */
  function format(value, width, digits) {
    var val;
    if (value === null) {
      val = "-99999";
    } else {
      // change to N decimal places
      val = value.toFixed(digits);
    }

    // prep the padding
    var text = "";
    for (var i = 0; i < width; i++) {
      text += " "
    }

    // left pad to N spaces
    return (text + val).slice(-width);
  }

  /**
   * Format a string value with left padding.
   * @param {string} value - text to format
   * @param {number} width - the total width of the field including left padding spaces
   * @returns {string} - the formatted value
   */
  function formatString(value, width) {

    // prep the padding
    var text = "";
    for (var i = 0; i < width; i++) {
      text += " "
    }

    // left pad to N spaces
    return (text + value).slice(-width);
  }

//
// convenience functions for extracting data elements from the jqplot objects
//
  /**
   * Get the Magnetometer data record timestamp.
   * @param {number} element - the element in the series data array
   * @returns {string} - the timestamp as a string, e.g., 2016-01-19 22:09:00
   */
  function getMagTimestamp(element) {
    return moment.utc(filteredMagData[element].time_tag).format(DATE_FORMAT_DISPLAY);
  }

  /**
   *
   * @param {number} element
   * @returns {number} - the Bt value
   */
  function getBt(element) {
    return filteredMagData[element].bt;
  }

  function getBz(element) {
    return filteredMagData[element].bz_gsm;
  }

  function getSpeed(element) {
    return filteredPlasmaData[element].speed;
  }

  function getSourceF(element) {
  }

//
// formatted string results
//

  function getFormattedSeries(name, element) {
    var dataSet;
    var formattedValue;
    var i;

    var start = name.indexOf('_min');
    var prefix;
    if (start > -1) {
      prefix = name.substring(0, start);
    } else {
      start = name.indexOf('_max');
      if (start > -1) {
        prefix = name.substring(0, start);
      } else {
        prefix = name;
      }
    }

    for (i = 0; i < SERIES_NAMES.length; i++) {
      if (prefix === SERIES_NAMES[i]) {
        break;
      }
    }

    dataSet = DATA_SET_SERIES[i];

    var sample;
    if (dataSet === USE_MAG) {
      sample = getPlotData(BT_BX_BY_GRAPH)[element];

      if (sample.lon_gsm > 360 || sample.lon_gsm_max > 360 || sample.lon_gsm_min > 360) {
        var x = 2;
      }
      // No, not needed
      // sample.lon_gsm = (sample.lon_gsm > 360) ? sample.lon_gsm -= PHI_ADJUST : sample.lon_gsm;
      // sample.lon_gsm_min = (sample.lon_gsm_min > 360) ? sample.lon_gsm_min -= PHI_ADJUST : sample.lon_gsm_min;
      // sample.lon_gsm_max = (sample.lon_gsm_max > 360) ? sample.lon_gsm_max -= PHI_ADJUST : sample.lon_gsm_max;
    } else if (dataSet === USE_PLASMA) {
      sample = getPlotData(DENS_GRAPH)[element];
    }

    formattedValue = (sample === undefined) ? "-99999" : format(sample[name], TEXT_WIDTH, TEXT_FORMAT_SERIES[i]);

    return formattedValue;
  }

  /**
   * Update the current data status indicator which shows whether we're continuing to receive data regularly.
   */
  function updateCurrentDataIndicator() {
//    log("updateCurrentDataIndicator: lastSuccess " + lastSuccess.format(DATE_FORMAT_DISPLAY));
    // only used by SWFO
    if (isSwfo()) {
      // has it been more than a few minutes since the last successful query (even if no data returned)?
//      log("delta sec " + deltaSec(lastSuccess));
      if (deltaSec(lastSuccess) > CURRENT_DATA_THRESHOLD_SECONDS) {
        // turn the background (and the little sliver of the main_div) red
        log("stale ");
        main_graphic.selectAll('.page_background').attr('fill', 'red');
        $('#main_div').css('background-color', 'red');
      } else {
        // turn the background (and the little sliver of the main_div) to the normal background color
//       log("current ");
        main_graphic.selectAll('.page_background').attr('fill', getBackgroundColor());
        $('#main_div').css('background-color', getBackgroundColor());
      }
    }
  }

  function loader(config) {
    return function () {
      var radius = Math.min(config.width, config.height) / 2;
      var tau = 2 * Math.PI;

      var arc = d3.svg.arc()
          .innerRadius(radius * 0.5)
          .outerRadius(radius * 0.9)
          .startAngle(0);

      var svg = d3.select(config.container).append("svg")
          .attr("id", config.id)
          .attr("width", config.width)
          .attr("height", config.height)
          .append("g")
          .attr("transform", "translate(" + config.width / 2 + "," + config.height / 2 + ")");

      var background = svg.append("path")
          .datum({endAngle: 0.33 * tau})
          .style("fill", "#4D4D4D")
          .attr("d", arc)
          .call(spin, 500);

      function spin(selection, duration) {
        selection.transition()
            .ease("linear")
            .duration(duration)
            .attrTween("transform", function () {
              return d3.interpolateString("rotate(0)", "rotate(360)");
            });

        //  d3.timer(function() { spin(selection, duration); }, duration);
        setTimeout(function () {
          spin(selection, duration);
        }, duration);
      }

      function transitionFunction(path) {
        path.transition()
            .duration(7500)
            .attrTween("stroke-dasharray", tweenDash)
            .each("end", function () {
              d3.select(this).call(transition);
            });
      }
    };
  }

  /**
   * Force a pause. HACK - USE FOR TESTING ONLY!
   * @param ms
   */
  function wait(ms) {
    var start = new Date().getTime();
    var end = start;
    while (end < start + ms) {
      end = new Date().getTime();
    }
  }

  /**
   * Override the JSON routine for formatting a JavaScript (not JSON) object as a string.
   * @param obj
   * @param replacer
   * @param indent
   * @returns {string}
   */
  JSON.stringifyOnce = function (obj, replacer, indent) {
    var printedObjects = [];
    var printedObjectKeys = [];

    function printOnceReplacer(key, value) {
      if (printedObjects.length > 2000) { // browsers will not print more than 20K, I don't see the point to allow 2K.. algorithm will not be fast anyway if we have too many objects
        return 'object too long';
      }
      var printedObjIndex = false;
      printedObjects.forEach(function (obj, index) {
        if (obj === value) {
          printedObjIndex = index;
        }
      });

      if (key == '') { //root element
        printedObjects.push(obj);
        printedObjectKeys.push("root");
        return value;
      }

      else if (printedObjIndex + "" != "false" && typeof(value) == "object") {
        if (printedObjectKeys[printedObjIndex] == "root") {
          return "(pointer to root)";
        } else {
          return "(see " + ((!!value && !!value.constructor) ? value.constructor.name.toLowerCase() : typeof(value)) + " with key " + printedObjectKeys[printedObjIndex] + ")";
        }
      } else {

        var qualifiedKey = key || "(empty key)";
        printedObjects.push(value);
        printedObjectKeys.push(qualifiedKey);
        if (replacer) {
          return replacer(key, value);
        } else {
          return value;
        }
      }
    }

    return JSON.stringify(obj, printOnceReplacer, indent);
  };

// ***********************************************************************************************************
//  logging
// ***********************************************************************************************************

  // set up the console for IE
  if (!window.console) console = {
    log: function (e) {
    }
  };

  /**
   * Convenience method for logging messages.
   * @param {string} msg - the message string
   */
  function log(msg) {
    // ************ REMOVE for WOC - begin ************
    // get the elapsed milliseconds since launch
    var ms = moment.utc() - appStartMoment;

    // convert to x.xx seconds
    console.log(sigFig(ms / 1000.0) + ' - ' + msg);
    // ************ REMOVE for WOC - end ************
  }

  /**
   * Convenience method for displaying debug messages to the developer.
   * @param {string} msg - the message string
   */
  function debug(msg) {
    log(msg);
//        $('#debug').text(msg);
  }

  /**
   * Convenience method for displaying feedback to the user during long operations.
   * @param {string} msg - the message string
   */
  function feedback(msg) {
    log(msg);
    //       $('#feedback').text(msg);
  }

// get the start time of the page, used to measure performance
  var timer = moment.utc();

  /**
   * Reset the timer.
   */
  function timerStart() {
    timer = moment.utc();
  }

  /**
   * Return the elapsed time in millis.
   * @returns {*}
   */
  function timerRead() {
    return moment.utc().diff(timer);
  }

// ***********************************************************************************************************
// classes
// ***********************************************************************************************************

//  // module
//  var DataModel = function () {
//    // private members
//    var data,
//        count = 0,
//
//        read = function (value) {
//          count += value;
//          log('read value ' + value + ' count ' + count);
//        },
//
//        write = function (value) {
//          count -= value;
//          log('write value ' + value + ' count ' + count);
//        };
//
//    return {
//      doRead: read,
//      doWrite: write
//    };
//  };
//
//  // prototype
//  var Car = function () {
//    // public members
//    this.numWheels = 4;
//    this.manufacturer = 'Tesla';
//    this.make = 'Model S';
//
////    // private members
////    var color = 'blue';
//  };
//
//  Car.prototype = function () {
//    var go = function () {
//      log('going');
////      log('going, color ' + color);
//    };
//
//    var stop = function () {
//      log('stopping');
//    };
//
//    return {
//      doStop: stop,
//      doGo: go
//    }
//  }();
//
//
//
//  // constructor
//  function Container(param) {
//
//    // private method
//    function dec() {
//      if (secret > 0) {
//        secret -= 1;
//        return true;
//      } else {
//        return false;
//      }
//    }
//
//    // public members
//    this.member = param;
//
//    // private members
//    var secret = 3;
//    var that = this;
//
//    // privileged method
//    this.service = function () {
//      return dec() ? that.member : null;
//    };
//  }
//
//  // public method
//  Container.prototype.stamp = function (string) {
//    log("service " + this.service());
//    return this.member + string;
//  }

}(jQuery));
