

OGameLineChart.prototype.updateTooltip = function (p) {
  let pnt = this.getClosestDataPoint(p, this.lineThresholdHighlight);

  if (pnt === null) {
    this.hideTooltip();
  } else {
    let a = this.transformDataPointToCanvas(pnt.index, pnt.dataPoint.y);
    let tooltipText = (this.tooltips[pnt.key] || '') + ':' + pnt.dataPoint.y.toFixed(2);
    this.tooltip.html(tooltipText);
    this.tooltip.css({
      left: a.x - 20,
      top: a.y
    });
    this.showTooltip();
  } //let dataPoints = this.getClosestDataPoint(p,key)

};

OGameLineChart.prototype.showTooltip = function () {
  this.tooltip.show();
};

OGameLineChart.prototype.hideTooltip = function () {
  this.tooltip.hide();
};

OGameLineChart.prototype.getClosestLine = function (p, threshold) {
  let currentKey = null;
  let currentDistance = null;
  let currentIndex = null;

  for (let key in this.dataPoints) {
    let dataPoints = this.dataPoints[key];

    for (let i = 0; i < dataPoints.length - 1; ++i) {
      let a = this.transformDataPointToCanvas(i, dataPoints[i].y);
      let b = this.transformDataPointToCanvas(i + 1, dataPoints[i + 1].y);
      let d = this.orthogonalDistanceFromLineSegment(p, a, b);

      if (d === null || d > threshold) {
        continue;
      }

      if (currentDistance === null || currentDistance > d) {
        currentKey = key;
        currentDistance = d;
        currentIndex = i;
      }
    }
  }

  if (currentKey !== null) {
    return {
      key: currentKey,
      distance: currentDistance,
      index: currentIndex
    };
  }

  return null;
};

OGameLineChart.prototype.getClosestDataPoint = function (p, threshold) {
  let line = this.getClosestLine(p, threshold);

  if (line === null) {
    return null;
  }

  let currentDistance = null;
  let currentDataPoint = null;
  let currentIndex = null;
  let dataPoints = this.getDataPoints(line.key);

  if (dataPoints) {
    for (let i = 0; i < dataPoints.length; ++i) {
      let a = this.transformDataPointToCanvas(i, dataPoints[i].y);
      let d = this.distance(a, p);

      if (d > threshold) {
        continue;
      }

      if (currentDistance === null || currentDistance > d) {
        currentDataPoint = dataPoints[i];
        currentDistance = d;
        currentIndex = i;
      }
    }
  }

  if (currentDataPoint !== null) {
    return {
      key: line.key,
      index: currentIndex,
      dataPoint: currentDataPoint
    };
  }

  return null;
};