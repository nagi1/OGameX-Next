

function addFleetContainer(planetPosition, planetType) {
  return `<div id="ownFleetStatus_${planetPosition}_${planetType}"
            class="fleetAction js_hideTipOnMobile hideTooltipOnMouseenter"
            title="">
        </div>`;
}

function getFleetIcon(fleetArray, planetPosition, planetType) {
  if (!fleetArray || !fleetArray.length) {
    return "";
  }

  $(`#ownFleetStatus_${planetPosition}_${planetType}`).removeClass('fleetNeutral').addClass('tooltip').addClass(fleetArray[0]['class']).attr('title', fleetArray[0]['text']);
}