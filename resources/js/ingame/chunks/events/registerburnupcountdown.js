

function registerBurnUpCountDown(elementId) {
  var burnUpCountDownElement = $(elementId);
  var duration = $(elementId).data('duration');

  if (duration > 0) {
    if (!burnUpCountDownForStationScreen[elementId]) {
      burnUpCountDownForStationScreen[elementId] = new simpleCountdown(burnUpCountDownElement, duration, function () {
        location.reload();
      });
    }
  }
}

function registerRepairTimeCountDown(elementId) {
  var repairTimeCountDownElement = $(elementId);
  var duration = $(elementId).data('duration');

  if (duration > 0) {
    if (!repairTimeDownForStationScreen[elementId]) {
      repairTimeDownForStationScreen[elementId] = new simpleCountdown(repairTimeCountDownElement, duration, function () {
        location.reload();
      });
    }
  }
}