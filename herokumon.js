  var f = function(value) {return Math.floor(value);};
  var r = function(max) { return Math.random()*max; };
  var s = function(value) {return Math.sqrt(value);};


var app = {
  WIDTH: 1400,
  HEIGHT: 400,
  NUMBER_OF_REQUESTS_TO_SHOW: 200,
  requests: [],

  drawSVG: function () {
    if (!app.svg) {
      app.svg = d3.select("#container")
                        .append("svg")
                        .attr("width", app.WIDTH)
                        .attr("height", app.HEIGHT);
    }
    return app.svg;
  },

  onRequest: function(request) {
    this.requests.push(request);
    if (this.requests.length > this.NUMBER_OF_REQUESTS_TO_SHOW) {
      this.requests.shift();
    };
    // bars.rects();
  }
};

var bars = {
  MAX_REQUEST_TIME: 2000,
  MAX_BAR_HEIGHT: 80,
  

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
    var bar_width = app.WIDTH/app.NUMBER_OF_REQUESTS_TO_SHOW;
    var svg = app.drawSVG();
    var selection = svg.selectAll('rect').data(app.requests);

    selection.enter()
      .append('rect')
        .attr("x", function (d, i) { return bar_width*i }) 
        .attr("width", bar_width);

    selection.exit()
      .remove();

    // debugger;
    selection 
      .attr("height", function(d) { return bars.heightScale()(d.service + d.connect); })
      .attr("y", function(d) { return bars.MAX_BAR_HEIGHT - bars.heightScale()(d.service + d.connect); })
      .attr("fill", function(d) { return "rgb(" + Math.floor(bars.colourScale()(d.service + d.connect)) + ", 149, 228)" })

  }
};

// var pies = {
//   dynos: [],
//   outer_r: 80,
//   innter_r: 15,
//   padding: 60,
//   top: 200,

//   circles: function() {
//     var svg = app.drawSVG();
//     var selection = svg.selectAll('circle').data(this.dynos);
//     var pie_space = app.WIDTH/pies.dynos.length;

//     selection.enter()
//       .append('circle')
//         .attr('cy', pies.top)
//         .attr('r', pies.outer_r)
//         .attr('fill', 'yellow');

//     selection.exit()
//       .remove();

//     selection
//       .attr("cx", function(d,i) {
//         var padding = pie_space/2;
//         return padding + i*pie_space;
//       });
//   },
//   onRequest: function(request) {
//     this.dynos.push(request.dyno);
//     this.dynos = _.uniq(this.dynos)
//     this.circles();
//   }
// };

// var dynos = {
//   dynos: {},
//   getChart: function() {
//     if(!this.chart) {
//       this.chart = c3.generate({
//         bindto: '.donut',
//         data: {
//             columns: [
//                 ['200s/300s', 0],
//                 ['400s', 0],
//                 ['500s', 0]
//             ],
//             type : 'donut'
//         },
//         donut: {
//             title: "Requests"
//         }
//       });
//     }
//     return this.chart;
//   },
//   draw: function() {
//     var rOk   = this.status.filter(function(status){ return status >= 200 && status < 400 }).length;
//     var r400s = this.status.filter(function(status){ return status >= 400 && status < 500 }).length;
//     var r500s = this.status.filter(function(status){ return status >= 500 && status < 600 }).length;

//     this.getChart().load({
//         columns: [
//             ['200s/300s', rOk],
//             ['400s', r400s],
//             ['500s', r500s]
//         ]
//     });
//   },
//   onRequest: function(request) {
//     // debugger;
//     var dyno = dynos[request.dyno];
//     if (!dyno) {
//       dyno = [];
//       request.status.push(dyno);
//     } else {
//       request.status.push(dyno);
//     };
//     if (this.status.length > bars.NUMBER_OF_REQUESTS_TO_SHOW) {
//       this.status.shift();
//     };
//     this.draw();
//   }
// };

var onRequestFunction = function(data) {
  data.dyno = 'fake.' + f(r(5));
  app.onRequest(data);
  // pies.onRequest(data);
  // dynos.onRequest(data);
};

window.onload = function () {
  var socket = io('https://Herokumon.herokuapp.com');
  socket.on('request', onRequestFunction);
};