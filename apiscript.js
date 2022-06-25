
 let rate=168;
 let sampleCount = 30;


 function requestData() {

    // disable rapid, repeated requests
    $("#requestButton").prop("disabled", true);

    /* the following looses the case of the XML elements
      let req = document.createDocumentFragment();
      let graphReq = req.appendChild(document.createElement("GraphRequest"));
      graphReq.setAttribute("xmlns", "http://sscweb.gsfc.nasa.gov/schema");
      let timeInterval = document.createElement("TimeInterval");
      ...
      so the xml request is created with strings
    */

    let selectedSats = $('#satSel option:selected').map(
        function() {
            return this.value
        }).get();

    if (selectedSats.length == 0) {

        alert('You must select at least one satellite');
        $("#requestButton").prop("disabled", false);
        return;
    }

 
    $.ajax({
        type: 'POST',
        url: sscUrl + '/locations',
        data: request,
        dataType: 'xml',
        contentType: 'application/xml',
        processData: false,
        success: displayData,
        error: dataError
    });

}

// $.getJSON('http://' + HOST + ':8080/rtsw/json/fc.json')
// .done(function (data) {


    const endTime = new Date();
    let startTime;
    function defineEndTime() {
     let end = endTime.getTime();
     let offset = sampleCount*60*60*1000;  //convert hours to milliseconds. hours back in time.
    //  console.log("sampleCount apiscript " + sampleCount);
     let start = end-offset;
     startTime = new Date(start);
    //  console.log(end + " "+ offset + " " + start + " " + startTime)
    }
    
    
      
    
    
    /**
     * Called when the browser finished construction the DOM.  It makes an
     * SSC web service call to get the available observatories.  The
     * displayObservatories function is registered to handle the results
     * of web service call.
     */
     $(document).ready(function() {
        defineEndTime();
         const start = convertTime(startTime);
         const end = convertTime(endTime);
          //console.log(start);
          $('#dataTableVisibility').click(function() {
              $('#data').toggle();
          });
          let sscUrl='https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/'+start+','+end+'/';
          $.get(sscUrl, displayObservatories, 'json');
        //console.log("start "+startTime + " end "+endTime + " " + sscUrl ); ///
      });
      
      function displayObservatories(params) {
            // console.log(params);
            // for (const element of params.Result) {
            //     console.log(JSON.stringify(element));
            // }
      }
      
      function convertTime(time) {
       return time.getUTCFullYear() + zeroPad(time.getUTCMonth()+1) + zeroPad(time.getUTCDate()) + "T" + zeroPad(time.getUTCHours()) + zeroPad(time.getUTCMinutes()) + zeroPad(time.getUTCSeconds()) + "Z"; 
      }   




//Zero Pad

function zeroPad(num){
    return (num > 0 && num < 10) ? "0" + num : num; //between 0 and 10 add to num
    }

// function zeroPadTwo(num) {
//     let result;
//     if (num > 0 && num < 10){
//         result = "0" + num;
//     }else {
//         result = num;
//     }
//     return result;
// }


//https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/NaNTNaNNaNNaNZ,2052T15626Z/

//https://sscweb.gsfc.nasa.gov/WS/sscr/2/locations/ace,dscovr/NaNTNaNNaNNaNZ,2052T15626Z/