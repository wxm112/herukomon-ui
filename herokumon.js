  var f = function(value) {return Math.floor(value);};
  var r = function(max) { return Math.random()*max; };
  var s = function(value) {return Math.sqrt(value);};

var app = {
  requestsReceived: 0,
  WIDTH: 1400,
  HEIGHT: 100,
  NUMBER_OF_REQUESTS_TO_SHOW: 200,
  requests: [],
  dynos: {},

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
    var shiftedRequest = null;
    this.requests.push(request);
    if (this.requests.length > this.NUMBER_OF_REQUESTS_TO_SHOW) {
      shiftedRequest = this.requests.shift();
    };
    this.updateDynoStatus(request, 1);
    if(shiftedRequest) {
      this.updateDynoStatus(shiftedRequest, -1);
    };
    
    // bars.draw();
  },

  updateDynoStatus: function(request,n) {
    if (!this.dynos[request.dyno]) {
       this.dynos[request.dyno] = {'200s/300s': 0, '400s': 0, '500s': 0};
    }
    if (request.status >= 200 && request.status < 400) {
      this.dynos[request.dyno]['200s/300s'] += n;
    } else if (request.status >= 400 && request.status < 500) {
     this.dynos[request.dyno]['400s'] += n;
    } else if (request.status >= 500 && request.status < 600) {
     this.dynos[request.dyno]['500s'] += n;
    }
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

  
  draw: function () {
    var bar_width = app.WIDTH/app.NUMBER_OF_REQUESTS_TO_SHOW;
    var svg = app.drawSVG();
    var selection = app.svg.selectAll('rect').data(app.requests);

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

  }
};

var dynos = {
  charts: {},
  getChart: function(key) {
    var id = key.match(/\d+?/);

    donutElement = $('#donut-'+id);
    if(donutElement.length == 0) { // If this dyno div does not yet exist
      $('<div>').attr('id', 'donut-' + id).addClass('donut').appendTo($('#container'));

      this.charts[id] = c3.generate({
        bindto: '#donut-'+id, 
        transition: {duration: 0},
        data: {
            columns: [
                ['200s/300s', 0],
                ['400s', 0],
                ['500s', 0]
            ],
            type : 'donut'
        },
        donut: {
            title: key
        }
      });
    }
    return this.charts[id];
  },

  draw: function(key) {
    var dyno = app.dynos[key];
    var cols = Object.keys(dyno).map(function(k){ return [k, dyno[k]]; });
    this.getChart(key).load({
        columns: cols,
    });
    var width = app.WIDTH/Object.keys(app.dynos).length;
    $('.donut').css('width', width);
  },

  drawDynos: function () {
    Object.keys(app.dynos).forEach(function(key){ dynos.draw(key); });
  }
};

var onRequestFunction = function(data) {
  data.dyno = 'web.' + f(r(4));
  app.onRequest(data);
  bars.draw();
  dynos.drawDynos();
  
};

window.onload = function () {
  var socket = io('https://Herokumon.herokuapp.com');
  socket.on('request', onRequestFunction);
};

//   onRequest: function(request) {
//     this.dynos.push(request.dyno);
//     this.dynos = _.uniq(this.dynos)
//     this.circles();
//   }
// };