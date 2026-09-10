

function showSpaceObjectSelection(obj) {
  let basicData = $($(obj).closest("basic-data")[0]);
  let togglePanel = basicData.find('.js_togglePanel');
  togglePanel.toggle();
}

function selectSpaceObject(obj) {
  let currentTarget = $(obj);
  let basicData = currentTarget.closest("basic-data");
  basicData.find('.toggleLink').attr('data-selected-planetid', currentTarget.data('planetid')).data('selectedPlanetid', currentTarget.data('planetid'));
  basicData.find('.togglePanel').hide();
  basicData.find('.togglePanel li').removeClass('selected');
  basicData.find('.togglePanel ul #' + currentTarget.data('planetid')).addClass('selected');
  basicData.find('.toggleLink').html(currentTarget.html());
}

function loadPlanetInfo(obj) {
  let loadDataSection = $(obj).closest("div.selectWrapper");
  let inputField = loadDataSection.find(".toggleLink").first();
  let attackType = $(obj).data('attackType');
  let isBaseDefender = attackType === 2 && $(obj).data('participantId') === $('fleet-content[data-attack-type=2]').first().data('participantId');
  loadPlanetAction(inputField.data('selectedPlanetid'), $(obj), isBaseDefender, attackType);
  simChanged(obj);
}