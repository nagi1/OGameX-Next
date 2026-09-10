
function OGameLineChart(container, data) {
  this.container = container;
  this.dataPoints = data.dataPoints || [];
  this.deltaY = data.deltaY || 1;
  this.digitsY = data.digitsY || 0;
  this.title = data.title || '';
  this.titleFont = data.titleFont || 'Bold 13px Verdana, Arial, SunSans-Regular, Sans-Serif';
  this.titleColor = data.titleColor || '#6f9fc8';
  this.titleBaseline = data.titleBaseline || 'middle';
  this.labelFontY = data.labelFont || '11px Verdana, Arial, SunSans-Regular, Sans-Serif';
  this.labelColorY = data.labelColor || '#6f9fc8';
  this.labelBaselineY = data.labelBaseline || 'middle';
  this.labelLineHeightY = data.labelLineHeightY || 11;
  this.labelSpacingY = data.labelSpacingY || 20;
  this.labelHeightY = data.labelHeightY || 20;
  this.labelFontX = data.labelFont || '11px Verdana, Arial, SunSans-Regular, Sans-Serif';
  this.labelColorX = data.labelColor || '#6f9fc8';
  this.labelBaselineX = data.labelBaseline || 'middle';
  this.labelLineHeightX = data.labelLineHeightX || 11;
  this.guidesStyle = data.guidesStyle || '#6f9fc8';
  this.lineStyles = data.lineStyles || {};
  this.lineWidths = data.lineWidths || {};
  this.lineStyleHighlight = data.lineStyleHighlight || '#aaffaa';
  this.lineWidthHighlight = data.lineWidthHighlight || 5;
  this.lineThresholdHighlight = data.lineThresholdHighlight || 10;
  this.tooltips = data.tooltips || {};
  this.dataKeyHighlight = null;
  this.marginLeft = data.marginLeft || 60;
  this.marginRight = data.marginRight || 30;
  this.marginTop = data.marginTop || 20;
  this.marginBottom = data.marginBottom || 110;
  this.visibility = data.visibility || {};
}

OGameLineChart.epsilon = 0.0001;