

OGameLineChart.prototype.render = function () {
  this.height = $(this.canvas).outerHeight();
  this.width = $(this.canvas).outerWidth();
  this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.renderTitle();
  this.renderLabels();
  this.renderData();
};

OGameLineChart.prototype.renderTitle = function () {
  this.context.save();
  this.context.font = this.titleFont;
  this.context.fillStyle = this.titleColor;
  this.context.textBaseline = this.titleBaseline;
  let px = this.marginLeft;
  let py = Math.floor(this.marginTop / 2);
  this.context.fillText(this.title, px, py);
  this.context.restore();
};

OGameLineChart.prototype.renderLabels = function () {
  this.renderAxis();
  this.renderVerticalLabels();
  this.renderHorizontalLabels();
};

OGameLineChart.prototype.renderAxis = function () {
  let sx = this.marginLeft;
  let sy = this.marginTop;
  let ex = this.marginLeft;
  let ey = this.height - this.marginBottom;
  this.context.save();
  this.context.strokeStyle = this.guidesStyle;
  this.context.beginPath();
  this.context.moveTo(sx, sy);
  this.context.lineTo(ex, ey);
  this.context.stroke();
  this.context.closePath();
  sx = ex;
  sy = ey;
  ex = this.width - this.marginRight;
  ey = this.height - this.marginBottom;
  this.context.beginPath();
  this.context.moveTo(sx, sy);
  this.context.lineTo(ex, ey);
  this.context.stroke();
  this.context.closePath();
  this.context.restore();
};

OGameLineChart.prototype.renderVerticalLabels = function () {
  let drawMinY = this.marginTop;
  let drawMaxY = this.height - this.marginBottom;
  let numLabels = Math.floor((drawMaxY - drawMinY) / (this.labelLineHeightY + this.labelSpacingY)) + 1;
  let drawDeltaY = Math.floor((drawMaxY - drawMinY) / (numLabels - 1));
  let minY = Math.floor(this.getMinY() / this.deltaY);
  let maxY = Math.ceil(this.getMaxY() / this.deltaY);
  let deltaY = Math.floor((maxY - minY) / (numLabels - 1));
  let px = 0;
  let py = drawMaxY;
  this.context.save();
  this.context.font = this.labelFontY;
  this.context.fillStyle = this.labelColorY;
  this.context.textBaseline = this.labelBaselineY;

  for (let i = 0; i < numLabels; ++i) {
    let y = minY + deltaY * i;
    let label = tsdpkt(y.toFixed(this.digitsY));
    let labelWidth = this.context.measureText(label).width;
    let dx = Math.floor(this.marginLeft / 2 - labelWidth / 2);
    let py = drawMaxY - drawDeltaY * i;
    this.context.fillText(label, px + dx, py);
  }

  this.context.restore();
};

OGameLineChart.prototype.renderHorizontalLabels = function () {
  let keys = this.getDataKeys();

  if (keys.length === 0) {
    return;
  }

  let key = keys[0];
  let dataPoints = this.getDataPoints(key);

  if (dataPoints.length < 2) {
    return;
  }

  let drawMinX = this.marginLeft;
  let drawMaxX = this.width - this.marginRight;
  let drawDeltaX = Math.floor((drawMaxX - drawMinX) / (dataPoints.length - 1));
  let px = this.marginLeft;
  let py = this.height - this.marginBottom + this.labelHeightY;
  this.context.save();
  this.context.font = this.labelFontX;
  this.context.fillStyle = this.labelColorX;
  this.context.textBaseline = this.labelBaselineX;

  for (let i = 0; i < dataPoints.length; ++i) {
    let label = dataPoints[i].x.toString();
    let labelWidth = this.context.measureText(label).width;
    let dx = Math.floor(labelWidth / 2); // draw rotated text

    this.context.save();
    this.context.translate(px, py);
    this.context.rotate(Math.PI * 0.375);
    this.context.fillText(label, 0, 0);
    this.context.restore();
    px += drawDeltaX;
  }

  this.context.restore();
};

OGameLineChart.prototype.renderData = function () {
  for (let key in this.dataPoints) {
    if (this.dataKeyHighlight === key) {
      continue;
    }

    this.renderDataPoints(key, this.dataPoints[key]);
  } // render highlighted data set on top


  if (this.dataKeyHighlight !== null) {
    this.renderDataPoints(this.dataKeyHighlight, this.dataPoints[this.dataKeyHighlight]);
  }
};