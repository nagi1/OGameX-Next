

OGameLineChart.prototype.crossProduct = function (a, b, c) {
  return (c.y - a.y) * (b.x - a.x) - (c.x - a.x) * (b.y - a.y);
};

OGameLineChart.prototype.dotProduct = function (a, b) {
  return a.x * b.x + a.y * b.y;
};

OGameLineChart.prototype.addVector2 = function (a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  };
};

OGameLineChart.prototype.subVector2 = function (a, b) {
  return {
    x: a.x - b.x,
    y: a.y - b.y
  };
};

OGameLineChart.prototype.scaleVector2 = function (v, s) {
  return {
    x: v.x * s,
    y: v.y * s
  };
};

OGameLineChart.prototype.distance = function (a, b) {
  let delta = this.subVector2(a, b);
  return Math.sqrt(this.dotProduct(delta, delta));
};

OGameLineChart.prototype.projectOntoLineSegment = function (p, a, b) {
  let ap = this.subVector2(p, a);
  let ab = this.subVector2(b, a);
  let c = this.dotProduct(ap, ab) / this.dotProduct(ab, ab);

  if (c < 0 || c > 1) {
    return null;
  }

  return this.addVector2(a, this.scaleVector2(ab, c));
};

OGameLineChart.prototype.orthogonalDistanceFromLineSegment = function (p, a, b) {
  let c = this.projectOntoLineSegment(p, a, b);

  if (c === null) {
    return null;
  }

  let cp = this.subVector2(p, c);
  let sq = this.dotProduct(cp, cp);
  return Math.sqrt(sq);
};

(function ($) {
  $.fn.ogameLineChart = function (data) {
    if (this.length > 0) {
      let that = $(this[0]);
      let lineChart = that.data('ogameLineChart');

      if (lineChart == null) {
        lineChart = new OGameLineChart(that, data);
        $(this).data('ogameLineChart', lineChart);
        lineChart.init();
        lineChart.render();
      }

      return lineChart;
    }

    return null;
  };
})(jQuery);
var LazyLoader;

(function ($) {
  LazyLoader = {
    "pendingCssFiles": [],
    "loadedCssFiles": [],
    "pendingJsFiles": [],
    "loadedJsFiles": [],
    "_downloadCompleteHandler": function (type, path) {
      switch (type) {
        case "css":
          LazyLoader.pendingCssFiles = $.grep(LazyLoader.pendingCssFiles, function (value) {
            return value != path;
          });
          LazyLoader.loadedCssFiles.push(path);

          if (LazyLoader.pendingCssFiles.length === 0) {
            $(document).trigger("cssComplete");
          }

          break;

        case "js":
          LazyLoader.pendingJsFiles = $.grep(LazyLoader.pendingJsFiles, function (value) {
            return value != path;
          });
          LazyLoader.loadedJsFiles.push(path);

          if (LazyLoader.pendingJsFiles.length === 0) {
            $(document).trigger("jsComplete");
          }

          break;
      }

      if (LazyLoader.pendingCssFiles.length === 0 && LazyLoader.pendingJsFiles.length === 0) {
        $(document).trigger("allComplete");
      }
    },
    "_loadCssFiles": function (cssFiles) {
      var linkTags = [];
      $.each(cssFiles, function (key, value) {
        if ($.inArray(value, LazyLoader.pendingCssFiles) > -1 || $.inArray(value, LazyLoader.loadedCssFiles) > -1) {
          return true;
        }

        LazyLoader.pendingCssFiles.push(value);
        linkTags.push($("<link />").attr("href", value).attr("rel", "stylesheet").on("load", {
          "path": value
        }, function (event) {
          LazyLoader._downloadCompleteHandler("css", event.data.path);
        }));
      });

      if (linkTags.length === 0) {
        return {
          "status": "done"
        };
      }

      $(linkTags).map($.fn.toArray).appendTo("head");
      return {
        "status": "queued"
      };
    },
    "_loadJsFiles": function (jsFiles) {
      var newScripts = false;
      $.each(jsFiles, function (key, value) {
        if ($.inArray(value, LazyLoader.pendingJsFiles) > -1 || $.inArray(value, LazyLoader.loadedJsFiles) > -1) {
          return true;
        }

        newScripts = true;
        LazyLoader.pendingJsFiles.push(value);
        $.ajax({
          "cache": true,
          "url": value,
          "dataType": "script"
        }).success(function () {
          LazyLoader._downloadCompleteHandler("js", value);
        });
      });

      if (!newScripts) {
        return {
          "status": "done"
        };
      }

      return {
        "status": "queued"
      };
    },
    "loadFiles": function (cssFiles, jsFiles) {
      var loadCssFiles = LazyLoader._loadCssFiles(cssFiles);

      var loadJsFiles = LazyLoader._loadJsFiles(jsFiles);

      if (loadCssFiles.status === "done" && loadJsFiles.status === "done") {
        $(document).trigger("allComplete");
      }
    }
  };