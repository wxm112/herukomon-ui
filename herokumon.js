var app = {
  WIDTH: 1400,
  HEIGHT: 700,

  drawSVG: function () {
    if (!app.svg) {
      app.svg = d3.select("#container")
                        .append("svg")
                        .attr("width", app.WIDTH)
                        .attr("height", app.HEIGHT);
    }
    return app.svg;
  }
};

var bars = {
  requests: [],
  MAX_REQUEST_TIME: 2000,
  NUMBER_OF_REQUESTS_TO_SHOW: 200,
  MAX_BAR_HEIGHT: 40,
  

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

  
  rects: function () {
    var bar_width = app.WIDTH/bars.NUMBER_OF_REQUESTS_TO_SHOW;
    var svg = app.drawSVG();
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

var pies = {
  dynos: [],
  outer_r: 50,
  innter_r: 15,
  padding: 60,
  top: 200,

  circles: function() {
    var svg = app.drawSVG();
    var selection = svg.selectAll('circle').data(this.dynos);
    var pie_space = app.WIDTH/pies.dynos.length;

    selection.enter()
      .append('circle')
        .attr('cy', pies.top)
        .attr('r', pies.outer_r)
        .attr('fill', 'yellow');

    selection.exit()
      .remove();

    selection
      .attr("cx", function(d,i) {
        var padding = pie_space/2;
        return padding + i*pie_space;
      });

    
  },

  onRequest: function(request) {
    this.dynos.push(request.dyno);
    this.dynos = _.uniq(this.dynos)
    this.circles();
  }
};

window.onload = function () {
  var socket = io('https://Herokumon.herokuapp.com');
  socket.on('request', function(data) {
    bars.onRequest(data);
    pies.onRequest(data);
  });
};