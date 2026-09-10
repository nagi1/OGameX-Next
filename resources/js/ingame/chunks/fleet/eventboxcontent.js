
  $(function () {
    if ($("#eventboxContent").is(":visible")) {
      toggleEvents.loaded = true;
      $('#js_eventDetailsClosed').hide();
      $('#js_eventDetailsOpen').show();
    }

    if (window.isStandalonePage === undefined || window.isStandalonePage === false) {
      //This loads notification bar
      getAjaxEventbox(); // this loads even list (notification bar !== event list)

      refreshFleetEvents(true);
    }
  });