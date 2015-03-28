var Herokumon = {
  requests: [],
  w: 1400,
  h: 700,
  padding: 100,
  top: 200,
  MAX_REQUEST_TIME: 2000,
  NUMBER_OF_REQUESTS_TO_SHOW: 200,
  xScale: function () { 
    return d3.scale.linear()
             .domain([0, Herokumon.NUMBER_OF_REQUESTS_TO_SHOW])
             .range([Herokumon.padding, Herokumon.w - Herokumon.padding * 2]); 
  },

  heightScale: function () { 
    return d3.scale.pow().exponent(.25)
             .domain([0, Herokumon.MAX_REQUEST_TIME])
             .range([0, 40]);
  },

  colourScale: function() {
    return d3.scale.pow().exponent(.25)
             .domain([0, Herokumon.MAX_REQUEST_TIME])
             .range([0, 255]);
  },

  drawSVG: function () {
    if (!Herokumon.svg) {
      console.log("Creating new SVG");
      Herokumon.svg = d3.select("#container")
                        .append("svg")
                        .attr("width", Herokumon.w)
                        .attr("height", Herokumon.h);
    }
    return Herokumon.svg;
  },
  rects: function () {
    var range = (Herokumon.w - Herokumon.padding * 2)/Herokumon.NUMBER_OF_REQUESTS_TO_SHOW;
    var svg = this.drawSVG();
    var selection = svg.selectAll('rect').data(this.requests);

    selection.enter()
      .append('rect')
        .attr("x", function (d, i) { return Herokumon.xScale()(i*1) }) 
        .attr("width", Herokumon.xScale()(1)-Herokumon.padding);

    selection.exit()
      .remove();

    selection
      .attr("height", function(d) { return Herokumon.heightScale()(d.service + d.connect); })
      .attr("y", function(d) { return Herokumon.top - Herokumon.heightScale()(d.service + d.connect); })
      .attr("fill", function(d) { return "rgb(" + Math.floor(Herokumon.colourScale()(d.service + d.connect)) + ", 149, 228)" })

  },

  onRequest: function(request) {
    this.requests.push(request);
    if (this.requests.length > Herokumon.NUMBER_OF_REQUESTS_TO_SHOW) {
      this.requests.shift();
    };
    this.rects();
  }
};

window.onload = function () {
  var socket = io('https://herokumon.herokuapp.com');
  socket.on('request', function(data) {
    console.log("Request time " + (data.service + data.connect));
    Herokumon.onRequest(data);
  });
};