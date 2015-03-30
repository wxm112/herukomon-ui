  var f = function(value) {return Math.floor(value);};
  var r = function(max) { return Math.random()*max; };
  var s = function(value) {return Math.sqrt(value);};

var app = {
  requestsReceived: 0,
  NUMBER_OF_REQUESTS_TO_SHOW: 200,
  requests: [],
  dynos: {},

  createSVG: function (selector, width, height) {
    return d3.select(selector).
      append('svg').
        attr("width", width).
        attr("height", height);
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
  WIDTH: 700,
  HEIGHT: 80,
  svg: null,

  getSVG: function() {
    if(!this.svg) {
      this.svg = app.createSVG('.bars', this.WIDTH, this.HEIGHT);
    }
    return this.svg;
  },

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
    var bar_width = this.WIDTH/app.NUMBER_OF_REQUESTS_TO_SHOW;
    var selection = this.getSVG().selectAll('rect').data(app.requests);

    selection.enter()
      .append('rect')
        .attr("x", function (d, i) { return bar_width*i }) 
        .attr("width", bar_width);

    selection.exit()
      .remove();

    selection 
      .attr("height", function(d) { return bars.heightScale()(d.service + d.connect); })
      .attr("y", function(d) { return bars.HEIGHT - bars.heightScale()(d.service + d.connect); })
      .attr("fill", function(d) { return "rgb(" + Math.floor(bars.colourScale()(d.service + d.connect)) + ", 127, 14)" })

  }
};

var dynos = {
  charts: {},
  getChart: function(key) {
    var id = key.match(/\d+?/);

    donutElement = $('#donut-'+id);
    if(donutElement.length == 0) { // If this dyno div does not yet exist
      $('<div>').attr('id', 'donut-' + id).addClass('donut').appendTo($('.dynos'));

      this.charts[id] = c3.generate({
        bindto: '#donut-'+id, 
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
    var width = (window.innerWidth)/Object.keys(app.dynos).length;
    $('.donut').css('width', width);
  },

  drawDynos: function () {
    Object.keys(app.dynos).forEach(function(key){ dynos.draw(key); });
  }
};

var lines = {
  WIDTH: 1000,
  HEIGHT: 200,
  svg: null,
  totalDynos: function(){
    return Object.keys(app.dynos);
  },
  strokeScale: function () { 
    return d3.scale.linear()
             .domain([0, 200])
             .range([0, 20]);
  },
  x: function(){
    return ($(document).width()/this.totalDynos().length+1)/2;
  },

  getSVG: function() {
    if(!this.svg) {
      this.svg = app.createSVG('.lines', this.WIDTH, this.HEIGHT);
    }
    return this.svg;
  },

  draw: function(){
    var selection = this.getSVG().selectAll('line').data(this.totalDynos());
      selection.enter()
                .append('line');
                

      selection.exit()
      .remove();

      selection.attr('x1', function() {
                            return $(document).width()/2;
                    })
                .attr('y1', 3)
                .attr('x2', function(d,i) {
                            if (i === 0){
                              return lines.x();
                            } else {
                              return lines.x() + i * lines.x()*2;
                            } 
                    })
                .attr('y2', lines.HEIGHT)
                .attr('stroke-width', function(d){
                  var num = app.dynos[d]['200s/300s']+ app.dynos[d]['400s']+app.dynos[d]['500s'];
                  return lines.strokeScale()(num);
                })
                .attr('stroke', '#FF9800');
    
  },
};

var onRequestFunction = function(data) {
  data.dyno = 'web.'+ f(r(5));
  app.onRequest(data);
  bars.draw();
  dynos.drawDynos();
  lines.draw();
};

window.onload = function () {
  $('.logo').addClass('invisible');
  var socket = io('https://Herokumon.herokuapp.com');
  socket.on('request', onRequestFunction);
};
