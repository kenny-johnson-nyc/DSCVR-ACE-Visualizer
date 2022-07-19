<!DOCTYPE html>

<%-- ************ REMOVE for delivery - begin ************ --%>
<%@ page contentType="text/html;charset=UTF-8" language="java" %>
<%@ taglib prefix="form" uri="http://www.springframework.org/tags/form" %>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags" %>
<%-- ************ REMOVE for delivery - end ************ --%>

<%--required to override IE's "use Compatibility mode for intranet sites" setting--%>
<meta http-equiv="X-UA-Compatible" content="IE=edge">

<%-- hammer.js recommended settings. this helps greatly with readability and line/border/legend/button sizing, but makes the plot rectangle very small --%>
<meta name="viewport" content="user-scalable=no, width=device-width, initial-scale=1, maximum-scale=1">

<html>
<head>
  <title>DSCOVR Faraday Cup L1 Cycle</title>
  <%--<script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>--%>
  <%--<script src="https://code.highcharts.com/highcharts.js"></script>--%>
  <!-- <script src="https://code.highcharts.com/stock/highstock.js"></script> -->

  <script type="text/javascript"
          src="<spring:url value="/resources/js/jquery-3.1.1.min.js" />"></script>
  <script type="text/javascript"
          src="<spring:url value="/resources/js/highcharts-styled.js" />"></script>
  <%--src="<spring:url value="/resources/js/highcharts.js" />"></script>--%>

  <link rel="stylesheet" type="text/css"
        href="<spring:url value="/resources/js/highcharts.css" />"/>

  <script type="text/javascript"
          src="<spring:url value="/resources/js/swx_dscovrfc.js" />"></script>
  <link rel="stylesheet" type="text/css"
        href="<spring:url value="/resources/js/swx_dscovrfc.css?t=<?= time(); ?" />"/>


  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/d3.v3.min.js" />"></script>--%>
  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/d3-collection.v0.1.min.js" />"></script>--%>
  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/d3-dispatch.v0.4.min.js" />"></script>--%>
  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/d3-dsv.v0.3.min.js" />"></script>--%>
  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/d3-request.v0.4.min.js" />"></script>--%>
  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/d3-queue.v2.min.js" />"></script>--%>

  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/plugins/Blob.js" />"></script>--%>
  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/plugins/canvas-toBlob.js" />"></script>--%>
  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/plugins/FileSaver.js" />"></script>--%>
  <%--<script type="text/javascript"--%>
  <%--src="<spring:url value="/resources/js/plugins/html2canvas.js" />"></script>--%>
</head>

<body>
<div class="main">
  <div id="button_container">
    <button id="black-white-button">White</button>
    <button id="range_button">Range</button>
    <button id="restart-button">&#8634</button>
    <button id="pause_button">II</button>
    <button id="slower_button">&#8744</button>
    <button id="faster_button">&#8743</button>
    <p id="replay_speed">5x</p>
  </div>

  <div>
    <div id="container" class="Row"></div>
    <div id="intervals" class="Row"></div>
  </div>
</div>

<div id="lower" class="Row">
  <div id="auxiliary" class="Column"></div>
  <div id="total_current" class="Column"></div>
  <div id="flowAngle" class="Column"></div>
</div>

<div id="plate">B</div>

<div id="stats">
  <div id="madvalue" class="label">0</div>
  <div id="mv" class="label">0</div>
  <div id="interval" class="label">0</div>
  <br>

  <div id="density" class="label">0</div>
  <div id="speed" class="label">0</div>
  <div id="temp" class="label">0</div>
</div>

</body>
</html>
