

function hideTipsOnTabChange() {
  $("select").ogameDropDown('hide');
  Tipped.hideAll();
}

jQuery.fn.slideFadeToggle = function (speed, easing, callback) {
  return this.animate({
    opacity: 'toggle',
    width: 'toggle'
  }, speed, easing, callback);
};

function focusOnTabChange(element, focusOnReady) {
  var focusFunction = function () {
    $(element).focus();
  };

  if (focusOnReady == true) {
    $(document).ready(focusFunction);
  }

  $(window).unbind('blur').bind('blur', focusFunction);
}