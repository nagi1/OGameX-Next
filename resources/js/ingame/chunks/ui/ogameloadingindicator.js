
function OGameLoadingIndicator(container) {
  this.container = container;
}

OGameLoadingIndicator.prototype.init = function () {
  let html = '<div class="og-loading"><div class="og-loading-overlay"><div class="og-loading-indicator"></div></div></div>';
  this.element = $(html);
  this.container.append(this.element);
};

OGameLoadingIndicator.prototype.show = function () {
  this.element.show();
};

OGameLoadingIndicator.prototype.hide = function () {
  this.element.hide();
};

(function ($) {
  $.fn.ogameLoadingIndicator = function (data) {
    if (this.length > 0) {
      let that = $(this[0]);
      let loadingIndicator = that.data('ogameLoadingIndicator');

      if (loadingIndicator == null) {
        loadingIndicator = new OGameLoadingIndicator(that, data);
        $(this).data('ogameLoadingIndicator', loadingIndicator);
        loadingIndicator.init();
      }

      return loadingIndicator;
    }

    return null;
  };