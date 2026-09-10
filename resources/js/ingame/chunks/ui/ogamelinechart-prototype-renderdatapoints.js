

OGameLineChart.prototype.renderDataPoints = function (key, dataPoints) {
  if (!this.isDataSetVisible(key)) {
    return;
  }

  this.context.save();
  this.context.strokeStyle = this.getLineStyle(key);
  this.context.lineWidth = this.getLineWidth(key);
  this.context.beginPath();

  for (let i = 0; i < dataPoints.length - 1; ++i) {
    let s = this.transformDataPointToCanvas(i, dataPoints[i].y);
    let e = this.transformDataPointToCanvas(i + 1, dataPoints[i + 1].y);
    this.context.moveTo(s.x, s.y);
    this.context.lineTo(e.x, e.y);
  }

  this.context.stroke();
  this.context.closePath();
  this.context.restore();
};

OGameLineChart.prototype.transformDataPointToCanvas = function (x, y) {
  let minY = Math.ceil(this.getMinY() / this.deltaY);
  let maxY = Math.floor(this.getMaxY() / this.deltaY);
  let numDataPoints = this.getNumDataPoints();
  if (y === undefined) throw 'Y is undefined';
  let drawMinY = this.marginTop;
  let drawMaxY = this.height - this.marginBottom;
  let drawMinX = this.marginLeft;
  let drawMaxX = this.width - this.marginRight;
  let drawDeltaX = Math.floor((drawMaxX - drawMinX) / (numDataPoints - 1));
  let scaleY = (drawMaxY - drawMinY) / (maxY - minY);
  let cx = Math.floor(drawDeltaX * x + drawMinX);
  let cy = Math.floor(-(y - minY) * scaleY + drawMaxY);
  return {
    x: cx,
    y: cy
  };
};

OGameLineChart.prototype.transformEventToCanvas = function (e) {
  let canvasOffset = $(this.canvas).offset();
  let x = e.pageX - canvasOffset.left;
  let y = e.pageY - canvasOffset.top;
  return {
    x: x,
    y: y
  };
};