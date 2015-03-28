
var bars = {
  requests: [],
  WIDTH: 1400,
  HEIGHT: 700,
  MAX_REQUEST_TIME: 2000,
  NUMBER_OF_REQUESTS_TO_SHOW: 200,
  MAX_BAR_HEIGHT: 40,
  // xScale: function () { 
  //   return d3.scale.linear()
  //            .domain([0, bars.NUMBER_OF_REQUESTS_TO_SHOW])
  //            .range([bars.padding, bars.w - bars.padding * 2]); 
  // },

  heightScale: function () { 
    return d3.scale.pow().exponent(.25)
             .domain([0, bars.MAX_REQUEST_TIME])
             .range([0, bars.MAX_BAR_HEIGHT]);
  },

  colourScale: function() {
    return d3.scale.pow().exponent(.25)
             .domain([0, bars.MAX_REQUEST_TIME])
             .range([0, 255]);
  },

  drawSVG: function () {
    if (!bars.svg) {
      bars.svg = d3.select("#container")
                        .append("svg")
                        .attr("width", bars.WIDTH)
                        .attr("height", bars.HEIGHT);
    }
    return bars.svg;
  },
  rects: function () {
    var bar_width = bars.WIDTH/bars.NUMBER_OF_REQUESTS_TO_SHOW;
    var svg = this.drawSVG();
    var selection = svg.selectAll('rect').data(this.requests);

    selection.enter()
      .append('rect')
        .attr("x", function (d, i) { return bar_width*i }) 
        .attr("width", bar_width);

    selection.exit()
      .remove();

    selection
      .attr("height", function(d) { return bars.heightScale()(d.service + d.connect); })
      .attr("y", function(d) { return bars.MAX_BAR_HEIGHT - bars.heightScale()(d.service + d.connect); })
      .attr("fill", function(d) { return "rgb(" + Math.floor(bars.colourScale()(d.service + d.connect)) + ", 149, 228)" })

  },

  onRequest: function(request) {
    this.requests.push(request);
    if (this.requests.length > bars.NUMBER_OF_REQUESTS_TO_SHOW) {
      this.requests.shift();
    };
    this.rects();
  }
};

window.onload = function () {
  var socket = io('https://Herokumon.herokuapp.com');
  socket.on('request', function(data) {
    bars.onRequest(data);
  });
};