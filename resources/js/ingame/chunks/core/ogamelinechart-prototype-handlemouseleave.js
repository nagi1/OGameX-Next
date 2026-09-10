

OGameLineChart.prototype.handleMouseLeave = function (e) {
  this.setHighlight(null);
  this.render();
};

OGameLineChart.prototype.updateHighlight = function (p) {
  let line = this.getClosestLine(p, this.lineThresholdHighlight);
  let key = line ? line.key : null;
  this.setHighlight(key);
};