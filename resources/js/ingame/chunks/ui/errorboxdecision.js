

function errorBoxDecision(head, content, yes, no, yesHandler, noHandler, useHashCharacter) {
  var useHash = getIEVersion() <= 9 && (useHashCharacter || false);
  var errorBox = $("#errorBoxDecision");
  errorBox.find("#errorBoxDecisionHead").html(head);
  errorBox.find("#errorBoxDecisionContent").html(content);

  var yesFunction = function (e) {
    e.stopPropagation();

    if (typeof errorBox.data('uiDialog') != 'undefined') {
      errorBox.dialog('destroy');
    }

    if (typeof yesHandler == 'function') {
      yesHandler();
    }

    if (yesHandler == 'submit_planet_delete_form') {
      $('#planetMaintenanceDelete').submit();
    }
  };

  var noFunction = function (e) {
    e.stopPropagation();

    if (typeof errorBox.data('uiDialog') != 'undefined') {
      errorBox.dialog('destroy');
    }

    if (noHandler == 'reload') {
      location.reload();
    }

    if (typeof noHandler == 'function') {
      noHandler();
    }
  }; // workaround for firefox instantly firing yes on click event when the error box was opened via keyboard enter event:
  // setting a timeout with the event bindings


  errorBox.find(".yes, .no").unbind('click');
  errorBox.unbind('keydown.yesHandler');
  setTimeout(function () {
    var $yesButton = errorBox.find('.yes');
    var $noButton = errorBox.find('.no');
    $yesButton.unbind('click').bind('click', yesFunction).focus().find("#errorBoxDecisionYes").html(yes);
    $noButton.unbind('click').bind('click', noFunction).find("#errorBoxDecisionNo").html(no);

    if (useHash) {
      $yesButton.attr('href', '#');
      $noButton.attr('href', '#');
    } else {
      $yesButton.attr('href', 'javascript:void(0);');
      $noButton.attr('href', 'javascript:void(0);');
    }

    errorBox.bind('keydown.yesHandler', function (e) {
      if (e.which == KeyEvent.DOM_VK_RETURN) {
        errorBox.find('.yes').trigger('click');
      }
    });
  }, 100);
  Tipped.hideAll();
  errorBox.dialog({
    resizable: false,
    modal: true,
    title: head,
    close: noFunction,
    width: 400,
    dialogClass: 'errorBox'
  });
}

function errorBoxNotify(head, content, ok, okHandler, useHashCharacter) {
  var useHash = getIEVersion() <= 9 && (useHashCharacter || false);
  var errorBox = $("#errorBoxNotify");
  errorBox.find("#errorBoxNotifyHead").html(head);
  errorBox.find("#errorBoxNotifyContent").html(content);

  var okFunction = function (e) {
    e.stopPropagation();
    errorBox.dialog('destroy');

    if (typeof okHandler == 'function') {
      okHandler();
    } else if (typeof window[okHandler] == "function") {
      window[okHandler]();
    }
  };

  var $okButton = errorBox.find('.ok');
  $okButton.unbind('click').bind('click', okFunction).find("#errorBoxNotifyOk").html(ok);

  if (useHash) {
    $okButton.attr('href', '#');
  } else {
    $okButton.attr('href', 'javascript:void(0);');
  }

  Tipped.hideAll();
  errorBox.dialog({
    resizable: false,
    modal: true,
    title: head,
    close: okFunction,
    width: 400,
    dialogClass: 'errorBox'
  });
}