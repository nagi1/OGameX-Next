

function changeClass(target, selectedClass, type) {
  let classArr = characterClassArr;
  let classBonusArr = characterClassBonuses;

  if (type === 'allianceclass') {
    classArr = allianceClassArr;
    classBonusArr = allianceClassBonuses;
  }

  const classId = findClassId(classArr, selectedClass);
  const classSelection = $(target).closest("class-selection");
  const inputField = classSelection.find("input").first();
  const fleetSection = target.closest('fleet-content');
  const currentClass = findClassName(classArr, inputField.data('classId') === '' ? 0 : parseInt(inputField.data('classId')));
  inputField.data("classId", classId);
  inputField.attr("data-class-id", classId);
  inputField.prop('checked', false);
  const icons = classSelection.find(type + '-icon');
  icons.each((idx, icon) => {
    classArr.forEach(className => {
      $(icon).removeAttr(className);
    });
    targetId = idx + 1;

    if (targetId === classId) {
      targetId = 0;
    }

    $(icon).attr(classArr[targetId], true);
  });

  if (classBonusArr[currentClass]) {
    Object.keys(classBonusArr[currentClass]).forEach(techId => {
      const researchInput = $(fleetSection).find(".technology-row input[name='amount[" + techId + "]']").first();
      const currentValue = researchInput.val().length === 0 ? 0 : parseInt(researchInput.val());
      const currentMin = (researchInput.attr('min') ?? '').length === 0 ? 0 : parseInt(researchInput.attr('min'));
      researchInput.val(Math.max(0, currentValue - classBonusArr[currentClass][techId]));
      researchInput.attr('min', Math.max(0, currentMin - classBonusArr[currentClass][techId]));
    });
  }

  if (classBonusArr[selectedClass]) {
    Object.keys(classBonusArr[selectedClass]).forEach(techId => {
      const researchInput = $(fleetSection).find(".technology-row input[name='amount[" + techId + "]']").first();
      const currentValue = researchInput.val().length === 0 ? 0 : parseInt(researchInput.val());
      const currentMin = (researchInput.attr('min') ?? '').length === 0 ? 0 : parseInt(researchInput.attr('min'));
      researchInput.val(currentValue + classBonusArr[selectedClass][techId]);
      researchInput.attr('min', currentMin + classBonusArr[selectedClass][techId]);
    });
  }

  simChanged(classSelection);
}

function fillData(fleetSection, jsonObj, isBaseDefender, attackType) {
  changeClass(fleetSection.find('characterclass-icon'), characterClassArr[0], 'characterclass');
  changeClass(fleetSection.find('allianceclass-icon'), allianceClassArr[0], 'allianceclass');
  let inputField;
  $.each(jsonObj.researches, function (index, value) {
    inputField = $(fleetSection.find(".technology-row input[name='amount[" + index + "]']")[0]);
    inputField.val(value);
  });
  let selection = 0;

  if (characterClassArr[parseInt(jsonObj.characterClassId)]) {
    selection = parseInt(jsonObj.characterClassId);
  }

  changeClass(fleetSection.find('characterclass-icon'), characterClassArr[selection], 'characterclass');

  if (allianceClassArr[parseInt(jsonObj.allianceClassId)]) {
    selection = parseInt(jsonObj.allianceClassId);
  }

  changeClass(fleetSection.find('allianceclass-icon'), allianceClassArr[selection], 'allianceclass');
  $.each(jsonObj.ships, function (index, value) {
    inputField = $(fleetSection.find(".technology-row input[name='amount[" + index + "]']")[0]);
    inputField.val(value.amount);
    inputField = $(fleetSection.find(".technology-fullrow input[name='weapon[" + index + "]']")[0]);
    inputField.val((Math.floor(value.weapon * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='shield[" + index + "]']")[0]);
    inputField.val((Math.floor(value.shield * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='armor[" + index + "]']")[0]);
    inputField.val((Math.floor(value.armor * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='cargo[" + index + "]']")[0]);
    inputField.val((Math.floor(value.cargo * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='speed[" + index + "]']")[0]);
    inputField.val((Math.floor(value.speed * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='fuel[" + index + "]']")[0]);
    inputField.val((Math.floor(value.fuel * 10000) / 100).toFixed(2));
  });
  inputField = $(fleetSection.find(".technology-fullrow input[name='classBonus[1]']")[0]);
  inputField.val((Math.floor(jsonObj.bonuses.characterClassBooster[1] * 10000) / 100).toFixed(2));
  inputField = $(fleetSection.find(".technology-fullrow input[name='classBonus[2]']")[0]);
  inputField.val((Math.floor(jsonObj.bonuses.characterClassBooster[2] * 10000) / 100).toFixed(2));
  inputField = $(fleetSection.find(".technology-fullrow input[name='classBonus[3]']")[0]);
  inputField.val((Math.floor(jsonObj.bonuses.characterClassBooster[3] * 10000) / 100).toFixed(2));
  inputField = $(fleetSection.find("fleetspeed-section input[value='" + jsonObj.fleetspeed + "']")[0]);
  inputField.prop('checked', true);
  let coords = {};

  if (typeof jsonObj.coords == 'object') {
    coords[0] = jsonObj.coords.galaxy;
    coords[1] = jsonObj.coords.system;
    coords[2] = jsonObj.coords.position;
  } else {
    coords = jsonObj.coords.split(':');
  }

  $(fleetSection.find("coordinates-section input[name='galaxy']")[0]).val(coords[0]);
  $(fleetSection.find("coordinates-section input[name='system']")[0]).val(coords[1]);
  $(fleetSection.find("coordinates-section input[name='position']")[0]).val(coords[2]);

  if (isBaseDefender === true) {
    fleetSection = $("combatsim-section[base-defender] fleet-content");
    $.each(jsonObj.resources, function (index, value) {
      inputField = $(fleetSection.find(".resource-row input[name='resource[" + index + "]']")[0]);
      inputField.val(value);
    });
    $.each(jsonObj.ships, function (index, value) {
      inputField = $(fleetSection.find(".technology-row input[name='amount[" + index + "]']")[0]);
      inputField.val(value.amount);
    });
    $.each(jsonObj.defenses, function (index, value) {
      inputField = $(fleetSection.find(".technology-row input[name='amount[" + index + "]']")[0]);
      inputField.val(value.amount);
      inputField = $(fleetSection.find(".technology-fullrow input[name='weapon[" + index + "]']")[0]);
      inputField.val((Math.floor(value.weapon * 10000) / 100).toFixed(2));
      inputField = $(fleetSection.find(".technology-fullrow input[name='shield[" + index + "]']")[0]);
      inputField.val((Math.floor(value.shield * 10000) / 100).toFixed(2));
      inputField = $(fleetSection.find(".technology-fullrow input[name='armor[" + index + "]']")[0]);
      inputField.val((Math.floor(value.armor * 10000) / 100).toFixed(2));
    });
    inputField = $(fleetSection.find(".technology-fullrow input[name='special[11112]']")[0]);
    inputField.val((Math.floor(jsonObj.bonuses.lifeformProtection * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='special[12112]']")[0]);
    inputField.val((Math.floor(jsonObj.bonuses.spaceDockExtender * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='special[13112]']")[0]);
    inputField.val((Math.floor(jsonObj.bonuses.recycleAttackerFleet * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='special[14112]']")[0]);
    inputField.val((Math.floor(jsonObj.bonuses.moonChanceIncrease * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='denCapacity[22]']")[0]);
    inputField.val((Math.floor(jsonObj.bonuses.denCapacity.metal * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='denCapacity[23]']")[0]);
    inputField.val((Math.floor(jsonObj.bonuses.denCapacity.crystal * 10000) / 100).toFixed(2));
    inputField = $(fleetSection.find(".technology-fullrow input[name='denCapacity[24]']")[0]);
    inputField.val((Math.floor(jsonObj.bonuses.denCapacity.deuterium * 10000) / 100).toFixed(2));
    $.each(jsonObj.missiles, function (index, value) {
      inputField = $(fleetSection.find(".technology-row input[name='amount[" + index + "]']")[0]);
      inputField.val(value.amount);
    });
  }

  simChanged(fleetSection);
}

function clearPlayer(obj) {
  let participantId = $(obj).data('participantId');
  let attackType = $(obj).data('attackType');
  $("fleet-content[data-participant-id=" + participantId + "][data-attack-type=" + attackType + "] fleetspeed-section input").prop('checked', false);
  $("fleet-content[data-participant-id=" + participantId + "][data-attack-type=" + attackType + "] fleetspeed-section input[value='10']").prop('checked', true);
  let fleetSection = $("fleet-content[data-participant-id=" + participantId + "][data-attack-type=" + attackType + "]");
  changeClass(fleetSection.find('characterclass-icon'), characterClassArr[0], 'characterclass');
  changeClass(fleetSection.find('allianceclass-icon'), allianceClassArr[0], 'allianceclass');
  fleetSection.find("research-section input").val('');
  fleetSection.find("ship-section input").val('');
  fleetSection.find("defense-section input").val('');
  fleetSection.find("coordinates-section input").val('');
  fleetSection.find("lifeform-data input").val('');
  simChanged(obj);
}

function clearTechnologies(obj) {
  let participantId = $(obj).data('participantId');
  let attackType = $(obj).data('attackType');
  $("fleet-content[data-participant-id=" + participantId + "][data-attack-type=" + attackType + "] ship-section input").val('');
  $("fleet-content[data-participant-id=" + participantId + "][data-attack-type=" + attackType + "] defense-section input").val('');
  simChanged(obj);
}