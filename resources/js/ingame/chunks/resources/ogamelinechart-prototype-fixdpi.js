

OGameLineChart.prototype.fixDPI = function () {
  let dpi = window.devicePixelRatio;
  let that = this; //create a style object that returns width and height

  let style = {
    height: function () {
      return +getComputedStyle(that.canvas).getPropertyValue('height').slice(0, -2);
    },
    width: function () {
      return +getComputedStyle(that.canvas).getPropertyValue('width').slice(0, -2);
    }
  }; //set the correct attributes for a crystal clear image!

  this.canvas.setAttribute('width', style.width() * dpi);
  this.canvas.setAttribute('height', style.height() * dpi);
};