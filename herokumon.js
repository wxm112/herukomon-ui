var Herokumon = {
  socket: io('https://herokumon.herokuapp.com'),
  requests: [],
  w: 1500,
  h: 1000,
  padding: 100,
  top: 200,
  xScale: function () { 
    return d3.scale.linear()
             .domain([0, 1000])
             .range([Herokumon.padding, Herokumon.w - Herokumon.padding * 2]); 
  },

  yScale: function () { 
    return d3.scale.linear()
             .domain([0, 40])
             .range([Herokumon.top, Herokumon.top + 40]); 
  },

  drawSVG: function (d, i) {
    if (!Herokumon.svg) {
      Herokumon.svg = d3.select("#container")
                        .append("svg")
                        .attr("width", Herokumon.w)
                        .attr("height", Herokumon.h);
    }
    return Herokumon.svg;
  },
  rects: function () {
    var range = (Herokumon.w - Herokumon.padding * 2)/1000
    this.drawSVG()
        .selectAll('rect')
        .data(this.requests)
        .enter()
        .append('rect')
        .attr("x", function (d, i) { return Herokumon.xScale()(i*1) }) 
        .attr("y", Herokumon.yScale()(0))
        .attr("width", Herokumon.xScale()(1)-Herokumon.padding)
        .attr("height", Herokumon.yScale()(40) - Herokumon.top)
        .attr("fill",'rgb(181, 149, 228)') 
  },

  onRequest: function(request) {
    this.requests.push(request.dyno);
    if (Herokumon.requests.length > 1000) {
      Herokumon.requests.shift();
    };
  }
};

window.onload = function () {
  Herokumon.socket.on('request', function(data) {
    Herokumon.onRequest(data);
    Herokumon.rects();
  });
};