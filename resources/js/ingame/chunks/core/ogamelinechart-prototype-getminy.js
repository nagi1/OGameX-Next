

OGameLineChart.prototype.getMinY = function () {
  let value = null;

  for (let k in this.dataPoints) {
    let points = this.dataPoints[k];

    for (let i = 0; i < points.length; ++i) {
      if (value === null || value > points[i].y) {
        value = points[i].y;
      }
    }
  }

  if (value === null) {
    return 0;
  }

  return value - 1;
};

OGameLineChart.prototype.getMaxY = function () {
  let value = null;

  for (let k in this.dataPoints) {
    let points = this.dataPoints[k];

    for (let i = 0; i < points.length; ++i) {
      if (value === null || value < points[i].y) {
        value = points[i].y;
      }
    }
  }

  if (value === null) {
    return 4;
  }

  return value + 1;
};

OGameLineChart.prototype.getDataKeys = function () {
  let keys = [];

  for (let k in this.dataPoints) {
    keys.push(k);
  }

  return keys;
};

OGameLineChart.prototype.getDataPoints = function (key) {
  if (this.dataPoints[key] !== undefined) {
    return this.dataPoints[key];
  }

  return [];
};

OGameLineChart.prototype.getNumDataPoints = function () {
  let numDataPoints = 0;

  for (let k in this.dataPoints) {
    if (numDataPoints < this.dataPoints[k].length) {
      numDataPoints = this.dataPoints[k].length;
    }
  }

  return numDataPoints;
};

OGameLineChart.prototype.setHighlight = function (key) {
  this.dataKeyHighlight = key;
};

OGameLineChart.prototype.setDataSetVisible = function (key, visible) {
  this.visibility[key] = visible === true;
};

OGameLineChart.prototype.isDataSetVisible = function (key) {
  if (this.visibility[key] !== undefined) {
    return this.visibility[key];
  }

  return true;
};

OGameLineChart.prototype.getLineStyle = function (key) {
  if (key === this.dataKeyHighlight) {
    return this.lineStyleHighlight;
  }

  return this.lineStyles[key] || '#ffffff';
};

OGameLineChart.prototype.getLineWidth = function (key) {
  if (key === this.dataKeyHighlight) {
    return this.lineWidthHighlight;
  }

  return this.lineWidths[key] || 1;
};