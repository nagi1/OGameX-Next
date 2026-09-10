
function initTooltipSkins() {
  jQuery.extend(Tipped.Skins, {
    'cloud': {
      offset: {
        x: 0,
        y: -1,
        mouse: {
          x: -12,
          y: -12
        } // only defined in the base class

      },
      stem: {
        height: 6,
        width: 11,
        offset: {
          x: 5,
          y: 5
        },
        spacing: 0
      }
    },
    'premium': {
      offset: {
        x: 0,
        y: -1,
        mouse: {
          x: -12,
          y: -12
        } // only defined in the base class

      },
      stem: {
        height: 6,
        width: 11,
        offset: {
          x: 5,
          y: 5
        },
        spacing: 0
      }
    }
  });
}
function changeTooltip(object, title) {
  var targetElement = $(object);

  if (targetElement.length == 0) {
    return;
  }

  removeTooltip(targetElement);
  $(targetElement).attr('title', title);
  initTooltips(targetElement);
}

function removeTooltip(object) {
  var targetElement = $(object);
  targetElement.each(function () {
    if ($(this).data('tooltipLoaded')) {
      $(this).data('tooltipLoaded', false);
      Tipped.remove($(this));
    }
  });
}

function getTooltipOptions(element) {
  var $thisObj = $(element);
  var options = {
    skin: 'cloud',
    size: 'x-small',
    maxWidth: 400,
    closeButton: false,
    hideOn: {
      element: 'mouseleave',
      tooltip: 'mouseleave'
    },
    hideOnClickOutside: true
  }; // we need longer tooltips on galaxy

  if (window.location.href.indexOf('galaxy') !== -1) {
    options.maxWidth = 400;
  }

  if ($thisObj.hasClass('tooltipPremium')) {
    options.skin = 'premium';
  }

  if ($thisObj.hasClass('tooltipLeft')) {
    options.position = {
      target: 'leftmiddle',
      tooltip: 'righttop'
    };
  } else if ($thisObj.hasClass('tooltipRight')) {
    options.position = {
      target: 'rightmiddle',
      tooltip: 'lefttop'
    };
  } else if ($thisObj.hasClass('tooltipBottom')) {
    options.position = {
      target: 'bottommiddle',
      tooltip: 'topmiddle'
    };
  }

  if ($thisObj.data('tooltip-width')) {
    options.maxWidth = $thisObj.data('tooltip-width');
  }

  if ($thisObj.hasClass('hideTooltipOnMouseenter')) {
    options.hideOn.tooltip = 'mouseenter';
  }

  if (isMobile || $thisObj.hasClass('tooltipClose')) {
    options.hideOthers = true; // options.hideOn = false;
  }

  if ($thisObj.hasClass('hideOthers')) {
    options.hideOthers = true;
  }

  options.afterUpdate = function (content, element) {
    if (isMobile && $thisObj.data('tooltip-button')) {
      var $buttonDiv = $(document.createElement('div')).addClass('tooltipButton');
      $(document.createElement('a')).addClass('btn_blue').attr('href', 'javascript:void(0);').html($thisObj.data('tooltip-button')).bind('click', function (e) {
        if ($(element).not('a') && $(element).find('a').length) {
          element = $(element).find('a')[0];
        }

        var event = document.createEvent("MouseEvents");
        event.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        element.dispatchEvent(event);
      }).appendTo($buttonDiv);
      $(content).append($buttonDiv);
    }

    if (isMobile || $thisObj.hasClass('tooltipClose')) {
      var $closeBtn = $(document.createElement('div')).addClass('close-tooltip');
      $(content).prepend($closeBtn);
    }

    Tipped.refresh(element);
  };

  return options;
}

function getTooltipSelector(selector) {
  var standardSelector = ".tooltipPremium, .tooltip, .tooltipRight, .tooltipLeft, .tooltipBottom, .tooltipClose, .tooltipHTML, .tooltipRel, .tooltipAJAX, .tooltipCustom, .markItUpButton a";

  if (typeof selector == 'undefined') {
    selector = standardSelector;
  } else if (typeof selector == 'string' && !selector.match(/\.tooltip/)) {
    var standardSelectorArray = standardSelector.split(', ');
    var previousSelector = selector;

    for (i in standardSelectorArray) {
      selector += ", " + previousSelector + " " + standardSelectorArray[i];
    }
  }

  return selector;
}

function sanitizeTooltip(text) {
  return text.replace(/<\s*script/g, '&lt;script');
}

function initTooltips(selector) {
  initTooltipSkins();
  selector = getTooltipSelector(selector);

  function generateHTML(text) {
    var element = {};
    var splitted = text.split("|");
    var title = $(document.createElement('h1')).html(splitted[0]);
    var splitLine = $(document.createElement('div')).addClass('splitLine');

    if (typeof splitted[2] !== "undefined" && typeof splitted[3] !== "undefined") {
      var title2 = $(document.createElement('h1')).html(splitted[2]);
      var splitLine2 = $(document.createElement('div')).addClass('splitLine');
      element = $(document.createElement('div')).css('display', 'none').addClass('htmlTooltip').append(title).append(splitLine).append(splitted[1] + "</br>").append(title2).append(splitLine2).append(splitted[3]);
    } else {
      element = $(document.createElement('div')).css('display', 'none').addClass('htmlTooltip').append(title).append(splitLine).append(splitted[1]);
    }

    return element[0];
  }

  removeTooltip(selector);

  function addTooltip(object) {
    var $thisObj = $(object);

    if ($thisObj.data('tooltipLoaded')) {
      return;
    }

    $thisObj.data('tooltipLoaded', true);

    if (isMobile && $thisObj.hasClass('js_hideTipOnMobile')) {
      $thisObj.attr('title', '');
      return;
    }

    var options = getTooltipOptions($thisObj);

    if ($thisObj.hasClass('tooltipCustom')) {
      if (options.hideOn != false) {
        options.hideOn = {
          element: 'mouseleave',
          tooltip: 'mouseleave'
        };
      }

      options.afterUpdate = function (content) {
        $(content).find('.tooltipCustom').each(function (i, element) {
          var options = getTooltipOptions($thisObj);

          if ($(this).hasClass('tooltipHTML')) {
            options.inline = true;
            options.hideOthers = false;
            Tipped.create(this, generateHTML(sanitizeTooltip($(this).attr('title'))), options);
          } else {
            options.hideOthers = false;
            Tipped.create(this, sanitizeTooltip($(this).attr('title')), options);
          }
        });
      };
    }

    if ($thisObj.hasClass('tooltipHTML')) {
      if (typeof $thisObj.attr('title') == 'undefined' || $thisObj.attr('title').trim().length == 0) {
        return;
      }

      Tipped.create($thisObj[0], generateHTML(sanitizeTooltip($thisObj.attr('title'))), options);
      return;
    }

    if ($thisObj.hasClass('tooltipRel')) {
      options.inline = $thisObj.attr('rel');

      if ($thisObj.hasClass('tooltipPersistent')) {
        options.detach = false;
      }

      Tipped.create($thisObj[0], undefined, options);
      return;
    }

    if ($thisObj.hasClass('tooltipAJAX')) {
      $.get($thisObj.attr('rel'), {}, function (data) {
        Tipped.create($thisObj[0], data, options);
      });
      return;
    }

    if (typeof $thisObj.attr('title') == 'undefined' || $thisObj.attr('title').trim().length == 0) {
      return;
    }

    Tipped.create($thisObj[0], sanitizeTooltip($thisObj.attr('title')), options);
  }

  $(document).undelegate(selector, 'touchstart.tooltipClick').delegate(selector, 'touchstart.tooltipClick', function (e) {
    if (Tipped.visible(this)) {
      var event = document.createEvent("MouseEvents");
      event.initMouseEvent("click", true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
      this.dispatchEvent(event);
      e.preventDefault();
      e.stopPropagation();
    }
  }); // this fixes tooltips not being closed

  $(document).undelegate('.t_Tooltip.t_visible .close-tooltip', 'click').delegate('.t_Tooltip.t_visible .close-tooltip', 'click', function (e) {
    Tipped.hide($(e.currentTarget).closest('.t_Tooltip')[0]);
  });

  if (typeof selector == "string") {
    $(document).undelegate(selector, 'mouseenter.tooltipLoad touchstart.tooltipLoad').delegate(selector, 'mouseenter.tooltipLoad touchstart.tooltipLoad', function (e) {
      addTooltip(this);
      Tipped.show(this);
    });
  } else {
    $(selector).each(function () {
      addTooltip(this);
    });
  }
}

$(function () {
  initTooltips();
});