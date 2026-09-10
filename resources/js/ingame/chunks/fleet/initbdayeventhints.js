

function initBDayEventHints() {
  $(document).undelegate('.event_build_faster, .event_active_hint', 'click').delegate('.event_build_faster, .event_active_hint', 'click', function (e) {
    e.stopPropagation();

    if ($(this).parent().attr('id') === 'expeditionbutton') {
      doExpedition();
    } else {
      $(this).siblings('.detail_button').click();
    }
  });
}
function toggleEvents(doNotClose) {
  if ($("#eventboxContent").is(":hidden")) {
    $("#eventboxContent").slideDown('fast');
    $('#js_eventDetailsClosed').hide();
    $('#js_eventDetailsOpen').show();

    if (typeof toggleEvents.loaded == 'undefined' || !toggleEvents.loaded) {
      refreshFleetEvents();
    }
  } else {
    if (doNotClose) {
      return;
    }

    $("#eventboxContent").slideUp('fast');
    $('#js_eventDetailsClosed').show();
    $('#js_eventDetailsOpen').hide();
  }

  $("#contentWrapper select").ogameDropDown('hide');
}

function refreshFleetEvents(force) {
  if (typeof eventlistLink === 'undefined') {
    return;
  }

  if (!$("#eventboxContent").is(":hidden") || force === true) {
    $("#eventboxContent").html('<img height="16" width="16" src="/img/icons/3f9884806436537bdec305aa26fc60.gif" />');
    $.ajax({
      url: eventlistLink,
      success: function (response) {
        $("#eventboxContent").html(response);
        toggleEvents.loaded = true;
      }
    });
  }
}