// For creating dummy data.

var f = function(value) {
  return Math.floor(value);
};
var r = function(max) {
  return Math.random() * max;
};
var s = function(value) {
  return Math.sqrt(value);
};

// App object is used to sort through the raw data.
var app = {
  NUMBER_OF_REQUESTS_TO_SHOW: 200,
  requestsReceived: 0,
  requests: [],
  colours: {
    '200s/300s': '#8BC34A',
    '400s': '#FFC107',
    '500s': 'rgb(236, 85, 85)'
  },

  dynos: {},

  createSVG: function(selector, width, height) {
    return d3.select(selector).
    append('svg').
    attr("width", width).
    attr("height", height);
  },

  // Pushes requests data to the requests array. When the number of requests is greater 
  // than NUMBER_OF_REQUESTS_TO_SHOW, shifts the old requests out of the array. 
  onRequest: function(request) {
    var shiftedRequest = null;
    this.requests.push(request);
    if (this.requests.length > this.NUMBER_OF_REQUESTS_TO_SHOW) {
      shiftedRequest = this.requests.shift();
    };
    this.updateDynoStatus(request, 1);
    if (shiftedRequest) {
      this.updateDynoStatus(shiftedRequest, -1);
    };
  },

  // Groups the requests by dynos and type of status, calculates the number of requests for 
  // each status per dyno, which is saved to the dynos hash. 
  updateDynoStatus: function(request, n) {
    if (!this.dynos[request.dyno]) {
      this.dynos[request.dyno] = {
        '200s/300s': 0,
        '400s': 0,
        '500s': 0,
      };
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

// Bars object is used to draw the bar chart.
var bars = {
  MAX_REQUEST_TIME: 2000,
  MAX_BAR_HEIGHT: 80,
  WIDTH: 700,
  HEIGHT: 80,
  svg: null,

  getSVG: function() {
    if (!this.svg) {
      this.svg = app.createSVG('.bars', this.WIDTH, this.HEIGHT);
    }
    return this.svg;
  },

  heightScale: function() {
    return d3.scale.pow().exponent(.5)
      .domain([0, bars.MAX_REQUEST_TIME])
      .range([0, bars.MAX_BAR_HEIGHT]);
  },

  draw: function() {
    var bar_width = this.WIDTH / app.NUMBER_OF_REQUESTS_TO_SHOW;
    var selection = this.getSVG().selectAll('rect').data(app.requests);

    selection.enter()
      .append('rect')
      .attr("x", function(d, i) {
        return bar_width * i
      })
      .attr("width", bar_width);

    selection.exit()
      .remove();

    selection
    // Sets up the height for every bar in the bar chart. Height correlates to
    // request time = service + connect time of the corresponding request.
      .attr("height", function(d) {
        return bars.heightScale()(d.service + d.connect);
      })
      .attr("y", function(d) {
        return bars.HEIGHT - bars.heightScale()(d.service + d.connect);
      })
      .attr("fill", function(d) {
        if (d.status >= 200 && d.status < 400) {
          return app.colours['200s/300s'];
        } else if (d.status >= 400 && d.status < 500) {
          return app.colours['400s'];
        } else
          return app.colours['500s'];
      });
  }
};

// Dynos object is used to draw the donut charts.
var dynos = {
  charts: {},
  getChart: function(key) {
    var id = key.match(/\d+?/);

    // If there is no donut element for this particular dyno, creates a new one
    // and saves that to the charts hash. The element is given an ID on the form
    // "#donut-NN"
    donutElement = $('#donut-' + id);
    if (donutElement.length == 0) { // If this dyno div does not yet exist
      $('<div>').attr('id', 'donut-' + id).addClass('donut').appendTo($('.dynos'));

      // Create the donut chart template by using c3 liabrary. 
      this.charts[id] = c3.generate({
        bindto: '#donut-' + id,
        data: {
          columns: [
            ['200s/300s', 0],
            ['400s', 0],
            ['500s', 0]
          ],
          type: 'donut',
          colors: app.colours,
        },
        donut: {
          title: key
        }
      });
    }
    return this.charts[id];
  },

  // Matches a single dyno's data to the donut chart.
  draw: function(key) {
    var dyno = app.dynos[key];
    var cols = Object.keys(dyno).map(function(k) {
      return [k, dyno[k]];
    });
    this.getChart(key).load({
      columns: cols,
    });
    var width = (window.innerWidth) / Object.keys(app.dynos).length;
    $('.donut').css('width', width);
  },

  // Draws a donut chart for each dyno.
  drawDynos: function() {
    Object.keys(app.dynos).forEach(function(key) {
      dynos.draw(key);
    });
  }
};

// Lines object is used to draw the line between the bar and donut charts.
var lines = {
  WIDTH: 1000,
  HEIGHT: 200,
  svg: null,

  // Calculates how many dynos there are.
  totalDynos: function() {
    return Object.keys(app.dynos);
  },

  strokeScale: function() {
    return d3.scale.linear()
      .domain([0, app.NUMBER_OF_REQUESTS_TO_SHOW])
      .range([0, 30]);
  },

  // Calculates the x1 coordinate for the lines.
  x: function() {
    return ($(document).width() / this.totalDynos().length + 1) / 2;
  },

  getSVG: function() {
    if (!this.svg) {
      this.svg = app.createSVG('.lines', this.WIDTH, this.HEIGHT);
    }
    return this.svg;
  },

  draw: function() { 
    var selection = this.getSVG().selectAll('line').data(this.totalDynos());

    selection.enter()
      .append('line')
      .append("svg:title");

    selection.exit()
      .remove();

    selection.attr('x1', function() {
        return $(document).width() / 2;
      })
      .attr('y1', 3)
      .attr('x2', function(d, i) {
        if (i === 0) {
          return lines.x();
        } else {
          return lines.x() + i * lines.x() * 2;
        }
      })
      .attr('y2', lines.HEIGHT)
      // Changes the thickness of the line according to the number of received requests for 
      // each dyno.
      .attr('stroke-width', function(d) {
        var num = app.dynos[d]['200s/300s'] + app.dynos[d]['400s'] + app.dynos[d]['500s'];
        return lines.strokeScale()(num);
      })
      .attr('stroke', '#888')
      .on("mouseover", function(d) {
        d3.select(this).attr('stroke', '#FFC107');
      })
      .on("mouseout", function(d) {
        d3.select(this).attr('stroke', '#888');
      });
    // Shows the requests number when hovering over to a line.
    this.getSVG().selectAll('line title').data(this.totalDynos())
      .text(function(d) {
        var num = app.dynos[d]['200s/300s'] + app.dynos[d]['400s'] + app.dynos[d]['500s'];
        return num + " Requests";
      });
  }
};

var onRequestFunction = function(data) {
  app.onRequest(data);

  var doRedraw = function() {
    bars.draw();
    dynos.drawDynos();
    lines.draw();
    app.futureTimeout = null;
  };

  // Redraw only this often
  if (!app.futureTimeout) {
    app.futureTimeout = setTimeout(doRedraw, 500);
  }

};

window.onload = function() {

  // Sets up a time for the animation (disappearance) of the logo.
  setTimeout(function() {
    $('.logo').addClass('invisible');
  }, 2000);

  // DummyData generator
  app.createDummyData = function() {
    var data = {date: '2015-03-26T09:48:54.276127+00:00',
                dyno: 'web.1',
                status: 200,
                client: '188.226.184.152',
                connect: 1,
                service: 21,
                bytes: 3159};

    data.dyno = 'web.' + f(r(3));
    data.status = 200;
    if(r(100)<5) {
      if(r(100)<70) {
        data.status = 400;
      } else {
        data.status = 500;
      }
    }
    data.service = f(r(1000));

    onRequestFunction(data);
    setTimeout(app.createDummyData, r(1000));
  };
  app.createDummyData();

  // Receives the raw data from the service and passes it to the onRequestFunction.
  var socket = io('https://herokumon.herokuapp.com');
  socket.on('request', onRequestFunction);
};
