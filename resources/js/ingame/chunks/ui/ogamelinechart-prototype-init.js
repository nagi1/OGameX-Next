

OGameLineChart.prototype.init = function () {
  let html = '<div class="og-linechart"><canvas></canvas><div class="tooltip"></div></div>';
  this.container.html(html);
  this.canvas = this.container.find('canvas')[0];
  this.tooltip = this.container.find('.tooltip');
  this.fixDPI();
  this.context = this.canvas.getContext('2d');
  this.context.imageSmoothingEnabled = true;
  this.container.on('mousemove', this.handleMouseMove.bind(this));
  this.container.on('mouseleave', this.handleMouseLeave.bind(this));
};

OGameLineChart.prototype.handleMouseMove = function (e) {
  let mousePosition = this.transformEventToCanvas(e);
  this.updateHighlight(mousePosition);
  this.updateTooltip(mousePosition);

  if (this.onMouseMove) {
    this.onMouseMove(e, this);
  }

  this.render();
};