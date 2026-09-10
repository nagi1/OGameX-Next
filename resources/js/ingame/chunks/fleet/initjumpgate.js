

function initJumpgate() {
  $('select').ogameDropDown();
  $(".list tr:even").addClass("alt");
  $(document).undelegate('#jumpgateForm .ship_input_row .textinput', 'keyup change input').delegate('#jumpgateForm .ship_input_row .textinput', 'keyup change input', function () {
    checkIntInput(this, 0, $(this).attr('rel'));
  }).undelegate('#jumpgateForm .ship_input_row .textinput', 'focus').delegate('#jumpgateForm .ship_input_row .textinput', 'focus', function () {
    if ($.isNumeric($(this).val()) === false) {
      $(this).val("");
    } else {
      $(this).select();
    }
  });
  $('#jumpgate .answerHeadline, .js_openStandardMoonMenu').click(function () {
    if (!player.hasCommander) {
      errorBoxNotify(LocalizationStrings.error, translation.changeSettingOnlyWithCommander, LocalizationStrings.ok, null, false);
    } else {
      $('#jumpgate').find('.answerHeadline').toggleClass('open');
      $('.thirdCol').toggleClass('hidden');
    }
  });
  $('.js_executeJumpButton').click(function () {
    var selectedMoon = $('#jumpgateForm').find('select[name="targetSpaceObjectId"]').val();
    window.jumpGateTargetId = selectedMoon;

    if (selectedMoon != 0) {
      var noShipsSelected = true;
      $('.ship_selection_table input').each(function () {
        if ($(this).val() > 0) {
          noShipsSelected = false;
        }
      });

      if (!noShipsSelected) {
        ajaxFormSubmit('jumpgateForm', $(this).attr('data-url'), jumpgateDone);
      } else {
        fadeBox(translation.noShipsWereSelected, true);
      }
    } else {
      fadeBox(translation.validTargetNeeded, true);
    }
  });
}

function jumpgateDone(data) {
  var data = $.parseJSON(data);

  if (data["status"]) {
    planet = data["targetMoon"];
    $('.overlayDiv').dialog('destroy');
  }

  errorBoxAsArray(data["errorbox"]);

  if (typeof data.newAjaxToken != 'undefined') {
    setNewTokenData(data.newAjaxToken);
  }
}

function jumpgateDefaultTargetSelectionCallback(data) {
  var data = $.parseJSON(data);

  if (data["status"]) {
    token = data.token;
    $('#jumpgateForm').find('input[name="token"]').val(data.token);
    var targetSelect = $('#jumpgateForm').find('select[name="targetSpaceObjectId"]');
    targetSelect.find('option').removeAttr('selected');
    var optionNode = targetSelect.find('option[value="' + data["targetMoon"] + '"]');

    if (optionNode.length) {
      optionNode.attr('selected', 'selected');
    } else {
      if (targetSelect.find('option[value="0"]').length == 0) {
        targetSelect.append($(document.createElement('option')).attr('value', 0).attr('selected', 'selected').text('--'));
      } else {
        targetSelect.find('option[value="0"]').attr('selected', 'selected');
      }
    }

    targetSelect.trigger('change'); // not sure if the following is enough to refresh that dropdown

    targetSelect.ogameDropDown('refresh');
  }

  errorBoxAsArray(data["errorbox"]);

  if (typeof data.newAjaxToken != 'undefined') {
    setNewTokenData(data.newAjaxToken);
  }
}

function setNewTokenData(newToken) {
  $('#jumpgateForm input[name="token"]').val(newToken);
  $('#jumpgateDefaultTargetSelectionForm input[name="token"]').val(newToken);
  token = newToken;
}

function openJumpgate() {
  //if($(".ui-dialog #content #jumpgate").length == 0) {
  openOverlay(jumpGateLink, {
    title: jumpGateLoca.LOCA_STATION_JUMPGATE_HEADLINE
  }); //}
}