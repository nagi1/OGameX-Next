
function scrollToTopOfDialog(dialog) {
  $('html, body').stop().animate({
    scrollTop: Math.max(0, dialog.offset().top - 300)
  }, 200);
}

function openOverlay(url, dialogParams) {
  if ($(".ui-dialog span.ui-dialog-title:contains('" + dialogParams.title + "')").length) {
    return;
  }

  if (typeof openOverlay.index == "undefined") {
    openOverlay.index = 0;
  } else {
    openOverlay.index++;
  }

  var currentIndex = openOverlay.index;
  dialogParams = dialogParams || {};

  if ((typeof dialogParams.type == 'undefined' || dialogParams.type != 'inline') && !url.match(new RegExp("^(" + ogameUrl + "|" + startpageUrl + ")"))) {
    window.open('redir.php?url=' + encodeURIComponent(url), '_newtab');
    return;
  }

  if (typeof dialogParams.height == 'undefined') {
    dialogParams.height = "auto";
  }

  if (typeof dialogParams.width == 'undefined') {
    dialogParams.width = "auto";
  }

  if (typeof dialogParams.position == 'undefined') {
    if (isMobile && !isMobileApp) {
      dialogParams.position = {
        my: "top",
        at: "top"
      };
    } else {
      dialogParams.position = {
        my: "center",
        at: "center"
      };
    }
  }

  dialogParams.closeText = "";

  if ($(".overlayDiv").length && !isMobile) {
    var lastOverlay = $(".overlayDiv:last");
    var offset = lastOverlay.offset();
    dialogParams.position = {
      my: "left top",
      at: "left+" + (offset.left + 10) + " top+" + (offset.top + 10)
    };
  }

  function positionDialog(dialog) {
    var $dialogParent = dialog.parent(".ui-dialog");

    if ($dialogParent.length) {
      $dialogParent.css('top', Math.max(0, parseInt($dialogParent.css('top').replace(/px$/, '')))).css('left', Math.max(0, parseInt($dialogParent.css('left').replace(/px$/, ''))));
    }
  }

  var type = dialogParams.type;
  delete dialogParams.type;

  if (type !== 'inline') {
    var loadImage = $(document.createElement('img')).attr('src', '/img/icons/4161a64a933a5345d00cb9fdaa25c7.gif').attr('alt', LocalizationStrings.loading);
    var centerDiv = $(document.createElement('div')).css('text-align', 'center').css('margin-top', '20px').append(loadImage);
    var dialog = $(document.createElement("div")).addClass('overlayDiv').css('display', 'none').append(centerDiv).appendTo("body");

    var defaultClose = function () {
      dialog.find('select').ogameDropDown('destroy');
      dialog.remove();
      Tipped.hideAll();
    };

    switch (typeof dialogParams.close) {
      case 'function':
        // Nothing to do
        break;

      case 'string':
        var closeCallbacks = dialogParams.close.split(' ');

        dialogParams.close = function () {
          $.each(closeCallbacks, function (i, e) {
            if (e == '__default') {
              defaultClose();
            } else {
              window[e]();
            }
          });
        };

        break;

      default:
        dialogParams.close = defaultClose;
        break;
    }
  } else if (!dialogParams.close && type === 'inline') {
    dialogParams.close = function () {
      if (closeTradeResourcesOverlay && typeof closeTradeResourcesOverlay === 'function' && typeof traderObj !== 'undefined') {
        closeTradeResourcesOverlay(true);
      }

      if ($($(".ui-dialog span.ui-dialog-title:contains('" + dialogParams.title + "')").parents('.ui-dialog')[0]).length > 0) {
        $($(".ui-dialog span.ui-dialog-title:contains('" + dialogParams.title + "')").parents('.ui-dialog')[0]).remove();
      }

      $(".overlayDiv").removeClass("overlayDiv");
    };
  }

  if (typeof url == 'string') {
    var queryObject = $.deparam($.param.querystring(url));

    if (typeof queryObject.page != 'undefined') {
      dialog.attr('data-page', queryObject.page);
    }

    if (!isMobile && $.inArray(queryObject.page, popupWindows) != -1) {
      var top = Math.max(0, Math.floor($(window).height() / 2 - dialogParams.popupHeight / 2));
      var left = Math.max(0, Math.floor($(window).width() / 2 - dialogParams.popupWidth / 2));
      var popup = window.open(url + '&popup=1', queryObject.page, "width=" + dialogParams.popupWidth + "," + "height=" + dialogParams.popupHeight + "," + "scrollbars=yes," + "resizable=yes," + "top=" + top + "," + "left=" + left);
      dialog.remove();
      popup.focus();
      return;
    }
  }

  if (typeof dialogParams['class'] != 'undefined') {
    var overlayClass = dialogParams['class'].split(' ').join('.');

    if ($(".overlayDiv." + overlayClass).length) {
      $.get(url, {}, function (data) {
        $(".overlayDiv." + dialogParams['class']).empty().append(data).dialog("moveToTop");
      });
      dialog.remove();
      dialog = $(".overlayDiv." + overlayClass);

      if (typeof queryObject.page != 'undefined') {
        dialog.attr('data-page', queryObject.page);
      }

      if (typeof dialogParams['title'] != 'undefined') {
        dialog.dialog('option', 'title', dialogParams['title']);
      }

      scrollToTopOfDialog(dialog);
      return true;
    } else {
      dialog.addClass(dialogParams['class']);
    }
  }

  if (type == 'inline') {
    dialog = $(url);
  }

  if (isNaN(dialogParams.dragStart) && isNaN(dialogParams.dragStop)) {
    var background;

    dialogParams.dragStart = function () {
      $('html').data('noclick', true);
      dialog.dialog('option', 'width', dialog.width()).dialog('option', 'height', dialog.height());
      background = {
        'bg': dialog.css('background'),
        'image': dialog.css('background-image'),
        'x': dialog.css('background-position-x'),
        'y': dialog.css('background-position-y'),
        'position': dialog.css('background-position')
      };
      dialog.find('select').ogameDropDown('hide');
      dialog.children().hide(); // da die dropdowns nun ausserhalb sind, muessen sie auch separat versteckt und wieder angezeigt werden

      var dropDowns = dialog.find('.markItUpDropMenu[id]');

      for (var i = 0; i < dropDowns.length; ++i) {
        var $myDropDown = $('body>ul[rel=' + dropDowns[i].id + ']'); // Anpassung beim 1. Mal:

        var adjustTop = typeof $myDropDown.attr('old_left') == 'undefined' ? -18 : 0;
        var adjustLeft = typeof $myDropDown.attr('old_left') == 'undefined' ? -6 : 0;
        $myDropDown.attr('old_top', dialog.offset()['top'] + adjustTop).attr('old_left', dialog.offset()['left'] + adjustLeft).hide(); // Werte merken fuer dragStop
      }

      dialog.css('background', '#000000');
    };

    dialogParams.dragStop = function () {
      setTimeout(function () {
        $('html').data('noclick', false);
      }, 100); // try to use the different css properties of different browsers

      if (typeof dialog.bg == 'undefined' || dialog.bg.length == 0) {
        dialog.css('background-image', background.image);

        if (typeof background.position == 'undefined' || background.position.length == 0) {
          dialog.css('background-position-x', background.x).css('background-position-y', background.y);
        } else {
          dialog.css('background-position', background.position);
        }
      } else {
        dialog.css('background', background.bg);
      }

      dialog.children().show(); // verschiebe die Dropdowns in der gleichen Weise wie den Dialog selbst

      var dropDowns = dialog.find('.markItUpDropMenu[id]');

      for (var i = 0; i < dropDowns.length; ++i) {
        var $innerUl = $('body>ul[rel=' + dropDowns[i].id + ']');
        $innerUl.css({
          'top': parseInt($innerUl.css('top')) - $innerUl.attr('old_top') + dialog.offset()['top'] + 'px',
          'left': parseInt($innerUl.css('left')) - $innerUl.attr('old_left') + dialog.offset()['left'] + 'px'
        });

        if ($(dropDowns[i]).attr('data-opened') == 1) {
          $innerUl.show();
        }
      }

      dialog.dialog('option', 'width', dialogParams.width).dialog('option', 'height', dialogParams.height);
      positionDialog(dialog);
    };
  }

  if (isNaN(dialogParams.resizable)) {
    dialogParams.resizable = false;
  }

  if (isMobile) {
    dialogParams.draggable = false; //        dialogParams.modal = true;
  }

  if (dialogParams.modal) {
    dialogParams.open = function () {
      $('.ui-widget-overlay').css('height', '').css('width', '');
    };
  }

  switch (type) {
    case 'iframe':
      var width = overlayWidth;
      var height = overlayHeight;

      if (typeof dialogParams.iframeWidth != 'undefined') {
        width = dialogParams.iframeWidth;
        delete dialogParams.iframeWidth;
      }

      if (typeof dialogParams.iframeHeight != 'undefined') {
        height = dialogParams.iframeHeight;
        delete dialogParams.iframeHeight;
      }

      dialog.html("<iframe allowTransparency='true'" + "frameborder='0' hspace='0' src='" + url + "' " + "id='TB_iframeContent' name='TB_iframeContent" + Math.round(Math.random() * 1000) + "' " + "style='width:" + (width + 25) + "px;height:" + (height + 1) + "px;' >" + "</iframe>").dialog(dialogParams).dialog("moveToTop");
      positionDialog(dialog);
      break;

    case 'inline':
      var inlineObject = $(url);
      var $dialogParent = inlineObject.parent();
      inlineObject.addClass('overlayDiv').dialog(dialogParams).dialog("moveToTop");
      positionDialog(inlineObject);
      break;

    default:
      dialog.dialog(dialogParams).dialog("moveToTop");
      $.get(url, {}).done(function (data) {
        dialog.empty().append(data).dialog('option', 'position', dialog.dialog('option', 'position'));
        setTimeout(function () {
          dialog.dialog('option', 'position', dialog.dialog('option', 'position'));
          positionDialog(dialog);
        }, 100);
        $(document).trigger('ajaxShowOverlay');
      }).fail(function () {});
  }

  Tipped.hideAll();
  $("select").ogameDropDown('hide');

  if (!isMobile) {
    $(window).bind('resize.overlay' + currentIndex, function () {
      if (dialog.is(':data(dialog)')) {
        dialog.dialog('option', 'position', dialog.dialog('option', 'position'));
        positionDialog(dialog);
      } else {
        $(window).unbind('resize.overlay' + currentIndex);
      }
    });
  }
} // checks if any overlay is there at all


function isOverlayOpen() {
  return $(".overlayDiv").length > 0;
}

function initOverlays() {
  $(document).undelegate('a[href*="overlay=1"], button[data-target*="overlay=1"], a.overlay, button.overlay', 'click').delegate('a[href*="overlay=1"], button[data-target*="overlay=1"], a.overlay, button.overlay', 'click', function (e) {
    e.preventDefault();
    var url = $(this).attr('href') || $(this).attr('data-target');

    if (typeof $(this).data('overlay-token') !== 'undefined') {
      url += "&token=" + $(this).data('overlay-token');
    }

    if ($(this).data('overlay-same')) {
      var $uiDialog = $(this).parents('.ui-dialog');
      var $overlayDiv = $uiDialog.find('.overlayDiv');

      if ($(this).data('overlay-same') && $overlayDiv.length > 0) {
        $.get(url, {}, function (data) {
          removeTooltip($overlayDiv.find(getTooltipSelector()));
          $overlayDiv.empty() // force repaint (ie 8 bug q.q)
          .append(data) // force repaint (ie 8 bug -.-)
          .dialog('moveToTop');
          $overlayDiv.dialog("option", "position", $overlayDiv.dialog("option", "position"));
          $uiDialog.hide(); // force repaint (ie 9/10 bug ~=[,,_,,]:3)

          $uiDialog.show(); // force repaint...  ie 9/10 bug (/¯◡ ‿ ◡)/¯ ~ ┻━┻
        });
        return false;
      }
    }

    var dialogParams = {
      zIndex: 4000
    };

    if ($(this).data('overlay-title')) {
      dialogParams.title = $(this).data('overlay-title');
    } else if (typeof $(this).attr('title') != 'undefined' && $(this).attr('title').length) {
      dialogParams.title = $(this).attr('title');
    } else if ($(this).data('tipped_restore_title')) {
      dialogParams.title = $(this).data('tipped_restore_title').replace(/^.+\|/, '');
    }

    if ($(this).data('overlay-class')) {
      dialogParams['class'] = $(this).data('overlay-class');
    }

    if ($(this).data('overlay-width')) {
      dialogParams.width = $(this).data('overlay-width');
    }

    if ($(this).data('overlay-height')) {
      dialogParams.height = $(this).data('overlay-height');
    }

    if ($(this).data('overlay-popup-width')) {
      dialogParams.popupWidth = $(this).data('overlay-popup-width');
    }

    if ($(this).data('overlay-popup-height')) {
      dialogParams.popupHeight = $(this).data('overlay-popup-height');
    }

    if ($(this).data('overlay-modal')) {
      dialogParams.modal = $(this).data('overlay-modal');
      dialogParams.resizable = false;
      dialogParams.draggable = false;
    }

    if ($(this).data('overlay-iframe')) {
      dialogParams.type = 'iframe';

      if ($(this).data('iframe-width')) {
        dialogParams.iframeWidth = $(this).data('iframe-width');
      }

      if ($(this).data('iframe-height')) {
        dialogParams.iframeHeight = $(this).data('iframe-height');
      }
    } else if ($(this).data('overlay-inline')) {
      dialogParams.type = 'inline';
      url = $(this).data('overlay-inline');
    }

    if ($(this).data('overlay-close')) {
      dialogParams.close = $(this).data('overlay-close');
    }

    openOverlay(url, dialogParams);
    return false;
  });
}

function updateOverlayToken(tokenId, updateToken) {
  $('[data-overlay-token-id=' + tokenId + ']').data('overlay-token', updateToken);
  token = updateToken;
}