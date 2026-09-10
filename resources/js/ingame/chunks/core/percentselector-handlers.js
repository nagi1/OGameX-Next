

PercentSelector.handlers = {};
/**** touch handling ****/

PercentSelector.handlers.touchDragging = false;

PercentSelector.handlers.touchStart = function (event) {
  var touches = event.originalEvent.touches;
  if (touches.length > 1) return;
  event.preventDefault();
  PercentSelector.handlers.touchDragging = false;
};

PercentSelector.handlers.touchEnd = function (event) {
  touches = event.originalEvent.touches;
  if (touches.length == 0) touches = event.originalEvent.changedTouches;
  if (touches.length > 1) return;
  var bar = touches[0].target.parentNode;
  PercentSelector.setPercentFromPageX(bar, touches[0].pageX, true);

  if (bar.onpercentchange != undefined) {
    bar.onpercentchange($(bar).attr("percent"));
  }

  event.preventDefault();
};

PercentSelector.handlers.touchMove = function (event) {
  PercentSelector.handlers.touchDragging = true;
  var touches = event.originalEvent.touches;
  if (touches.length > 1) return;
  event.preventDefault();
  PercentSelector.setPercentFromPageX(touches[0].target.parentNode, touches[0].pageX);
};
/*** mouse handling ***/


PercentSelector.handlers.mouseDragging = false;

PercentSelector.handlers.mouseDown = function (event) {
  PercentSelector.handlers.mouseDragging = true;
};

PercentSelector.handlers.mouseOut = function (event) {
  if (PercentSelector.handlers.mouseDragging) {
    var bar = PercentSelector.fallbackMode ? event.currentTarget : event.originalEvent.target.parentNode; //         if (bar.onpercentchange != undefined) {
    //             var x = eval(bar.onpercentchange);
    // console.debug(x);
    //             if (typeof x == 'function') {
    //                 x($(bar).attr("percent"));
    //             }
    //             // bar.onpercentchange($(bar).attr("percent"));
    //         }
  }

  PercentSelector.handlers.mouseDragging = false;
};

PercentSelector.handlers.mouseUp = function (event) {
  PercentSelector.handlers.mouseDragging = false;
  var bar = PercentSelector.fallbackMode ? event.currentTarget : event.originalEvent.target.parentNode;
  PercentSelector.setPercentFromPageX(bar, event.pageX, true); // if (bar.onpercentchange != undefined) {
  //     var x = eval(bar.onpercentchange);
  //
  //     if (typeof x == 'function') {
  //         x($(bar).attr("percent"));
  //     }
  //     // bar.onpercentchange($(bar).attr("percent"));
  // }
  // if(bar.onpercentchange != undefined) {
  //     bar.onpercentchange($(bar).attr("percent"));
  // }
};

PercentSelector.handlers.mouseMove = function (event) {
  if (PercentSelector.handlers.mouseDragging) {
    event.preventDefault();
    var bar = PercentSelector.fallbackMode ? event.currentTarget : event.originalEvent.target.parentNode;
    PercentSelector.setPercentFromPageX(bar, event.pageX);
  }
};