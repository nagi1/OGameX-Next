

function removeCombatSim(simId) {
  if (combatSimId === simId) {
    combatSimId = 0;
    newCombatPlanning();
  }

  $(`combatsim-list single-simulation[data-simulation-id="${simId}"]`).remove();
}

function changeCombatSimState(simId, state) {
  let element = $(`combatsim-section[overview] single-simulation[data-simulation-id='${simId}'] .state .status`);
  let action = $(`combatsim-section[overview] single-simulation[data-simulation-id='${simId}'] sim-actions button.overlay`);
  let shortAction = $('#showCombatResultShortInfo');
  action.hide();

  switch (state) {
    case 1:
      element.text(jsloca.COMBATSIM_PENDING).removeClass('planning done').addClass('pending');
      break;

    case 2:
      element.text(jsloca.COMBATSIM_DONE).removeClass('planning pending').addClass('done');
      action.show();
      shortAction.removeAttr('disabled').attr('data-target', action.data('target'));
      break;

    default:
      element.text(jsloca.COMBATSIM_PLANNING).removeClass('pending done').addClass('planning');
  }
}

function loadSim(simId) {
  let body = {
    _token: token,
    simId: simId
  };
  $.ajax({
    url: simBackendUrl + '&action=loadSim',
    data: body,
    type: "POST",
    dataType: "json",
    success: function (json) {
      token = json.newAjaxToken;

      if (json.status === 'success') {
        newCombatPlanning(); // update short info

        $('combatsim-shortinfo .shortSimId span').html(json.simData.simId);
        $('combatsim-shortinfo .shortName span').html(json.simData.simName);
        $('combatsim-shortinfo .shortTarget span').html('[' + json.simData.galaxy + ':' + json.simData.system + ':' + json.simData.position + ']');
        $('combatsim-shortinfo .shortAttackerCount span').html(json.simData.attackerCount);
        $('combatsim-shortinfo .shortDefenderCount span').html(json.simData.defenderCount);
        $('combatsim-shortinfo .shortShipCount span').html(json.simData.shipCount);
        combatSimId = json.simData.simId;
        $('#deleteCombatPlanning').removeAttr('disabled').attr('data-simulation-id', combatSimId).data('simulationId', combatSimId);
        let combatSimSection;

        if (json.simData.attackerCount > 1) {
          combatSimSection = $("combatsim-section[data-attack-type=1]").first();
          Object.keys(json.simData.data.attacker).slice(1).forEach(participantId => {
            addParticipant(combatSimSection, participantId);
          });
        }

        if (json.simData.defenderCount > 1) {
          combatSimSection = $("combatsim-section[data-attack-type=2]").first();
          Object.keys(json.simData.data.defender).slice(1).forEach(participantId => {
            addParticipant(combatSimSection, participantId);
          });
        }

        let attackType = 1;
        let isBaseDefender = false;
        Object.keys(json.simData.data.attacker).forEach(index => {
          adjustResearchClassBonuses(json.simData.data.attacker[index]);
          fillData($("fleet-content[data-participant-id=" + index + "][data-attack-type=1]").first(), json.simData.data.attacker[index], isBaseDefender, attackType);
        });
        attackType = 2;
        isBaseDefender = true;
        Object.keys(json.simData.data.defender).forEach(index => {
          adjustResearchClassBonuses(json.simData.data.defender[index]);
          const element = json.simData.data.defender[index];

          if (isBaseDefender === true) {
            index = 0;

            if (element.engineerActive === true) {
              $("#square-checkboxEngineer").attr('checked', true);
            } else {
              $("#square-checkboxEngineer").removeAttr('checked');
            }

            if (element.lootFood === true) {
              $("#square-checkboxFoodLoot").attr('checked', true);
            } else {
              $("#square-checkboxFoodLoot").removeAttr('checked');
            }

            $("fleet-content[base-defender] misc-section input[name='lootModifier']").removeAttr('checked');
            $("#round-radioLootModifier" + Math.floor((element.lootModifier - 0.25) / 0.25)).attr('checked', true);
          }

          fillData($("fleet-content[data-participant-id=" + index + "][data-attack-type=2]").first(), element, isBaseDefender, attackType);
          isBaseDefender = false;
        });
        combatSimChanged = false;
        $("gradient-button button#saveCombatPlanning div.emoji").remove();

        if (parseInt(json.simData.type) === 0) {
          $("#deleteCombatPlanning").removeAttr('disabled');

          if (json.simStateProgress === true) {
            $("#simulateCombatPlanning").prop('disabled', true);
          } else {
            $("#simulateCombatPlanning").removeAttr('disabled');
          }
        } else {
          $("#deleteCombatPlanning").prop('disabled', true);
          $("#simulateCombatPlanning").prop('disabled', true);
        }

        $("#saveCombatPlanning").prop('disabled', true);
        loadSimDetails();
        showNotification(json.message, 'success');
      } else {
        showNotification(json.errors[0].message, 'error');

        if (json.errors[0].error === 280001) {
          newCombatPlanning();
          $("combatsim-list single-simulation[data-simulation-id=" + simId + "]").remove();
        }
      }
    },
    error: function () {
      showNotification(combatSimLoca.LOCA_ERROR_DEFAULT, 'error');
    }
  });
}

function addParticipant(combatsimSection, participantId = null) {
  let attackType = combatsimSection.data('attackType');
  combatsimSection.attr('show-lifeform', '0');
  combatsimSection.find("participants-headline").show();
  combatsimSection.find(".removeParticipantBtn").removeClass('disabled');

  if (participantId === null) {
    participantId = combatsimSection.find("participants-headline participant-header").last().data('participantId') + 1;
  }

  if ($("participant-header").length >= combatSimMaxParticipants) {
    showNotification(combatSimLoca.LOCA_COMBATSIM_TOO_MUCH_PARTICIPANTS.replace("#number#", combatSimMaxParticipants), 'error');
    return;
  } // handle participants


  $(combatsimSection.find("participant-header")).removeClass('active');
  let newParticipant = [{
    attackType: attackType,
    participantId: participantId
  }].map(participantHeaderTemplate).join('');
  let cloneParticipant = combatsimSection.find("participants-headline participant-header").last().clone(true);
  cloneParticipant.attr('data-participant-id', $(newParticipant).data('participantId')).data('participantId', $(newParticipant).data('participantId')).attr('data-attack-type', $(newParticipant).data('attackType')).data('attackType', $(newParticipant).data('attackType')).addClass('active').html($(newParticipant).html()).insertAfter(combatsimSection.find("participants-headline participant-header").last()); // handle new fleet

  let newFleetSection = [{
    attackType: attackType,
    participantId: participantId
  }].map(fleetContentTemplate).join('');

  if (attackType === 2) {
    newFleetSection = newFleetSection.replace(/tabindex=\"(\d.*?)\"/g, function (i, match) {
      return "tabindex=\"" + (parseInt(match) + 200) + "\"";
    });
  }

  let cloneFleet = combatsimSection.find("fleet-content").last().clone(true);
  let newElement = $(newFleetSection);
  $(combatsimSection.find("fleet-content")).hide();
  newElement.find("lifeform-data technology-icon[solarsatellite]").closest('div.technology-fullrow').hide();
  newElement.find("lifeform-data technology-icon[resbuggy]").closest('div.technology-fullrow').hide();
  cloneFleet.attr('data-participant-id', newElement.data('participantId')).data('participantId', newElement.data('participantId')).attr('data-attack-type', newElement.data('attackType')).data('attackType', newElement.data('attackType')).html(newElement.html()).show().insertAfter(combatsimSection.find("fleet-content").last());
  combatsimSection.find("participants-headline participant-header p").each(function (index, element) {
    $(element).html(index + 1);
  }); //adjust buttons

  $(combatsimSection.find("fleet-section-clear .clearPlayer")).attr('data-participant-id', participantId).data('participantId', participantId).attr('data-attack-type', attackType).data('attackType', attackType);
  $(combatsimSection.find("fleet-section-clear .clearTechnologies")).attr('data-participant-id', participantId).data('participantId', participantId).attr('data-attack-type', attackType).data('attackType', attackType);
  simChanged(combatsimSection);
}

function newCombatPlanning() {
  let participantId = 0,
      attackType;
  let completeCombatsSim = $("div#combatsim");
  completeCombatsSim.find("combatsim-section:not(combatsim-section[base-defender]):not(combatsim-section[overview])").each((index, element) => {
    const combatsimSection = $(element);
    combatsimSection.attr('show-lifeform', '0');
    attackType = $(combatsimSection.find("thick-headline-background")[0]).data('attackType'); // remove header

    combatsimSection.find("participants-headline participant-header").remove();
    let newParticipant = [{
      attackType: attackType,
      participantId: participantId
    }].map(participantHeaderTemplate).join('');
    combatsimSection.find("participants-headline").hide().append(newParticipant);
    combatsimSection.find("participants-headline participant-header p").each(function (index, element) {
      $(element).html(index + 1);
    }); // remove fleet sections

    let newFleetSection = [{
      attackType: attackType,
      participantId: participantId
    }].map(fleetContentTemplate).join('');

    if (attackType === 2) {
      newFleetSection = newFleetSection.replace(/tabindex=\"(\d.*?)\"/g, function (i, match) {
        return "tabindex=\"" + (parseInt(match) + 200) + "\"";
      });
    }

    combatsimSection.find("fleet-content").remove();
    let newElement = $(newFleetSection);

    if (attackType !== 2) {
      newElement.find("lifeform-data technology-icon[solarsatellite]").closest('div.technology-fullrow').hide();
      newElement.find("lifeform-data technology-icon[resbuggy]").closest('div.technology-fullrow').hide();
    }

    newElement.insertBefore(combatsimSection.find("fleet-section-clear")); //adjust buttons

    $(combatsimSection.find("fleet-section-clear .clearPlayer")).attr('data-participant-id', 0).data('participantId', 0).attr('data-attack-type', attackType).data('attackType', attackType);
    $(combatsimSection.find("fleet-section-clear .clearTechnologies")).attr('data-participant-id', 0).data('participantId', 0).attr('data-attack-type', attackType).data('attackType', attackType);
  });
  completeCombatsSim.find("fleet-content[base-defender] misc-section input").removeAttr('checked');
  completeCombatsSim.find("fleet-content[base-defender] misc-section #round-radioLootModifier2").attr('checked', true);
  completeCombatsSim.find("combatsim-section[base-defender] basic-data .resource-row input").val('');
  completeCombatsSim.find("combatsim-section[base-defender] basic-data defense-section input").val('');
  completeCombatsSim.find("combatsim-section[base-defender] lifeform-data input").val('');
  completeCombatsSim.find("combatsim-section[base-defender] lifeform-data").hide();
  completeCombatsSim.find("combatsim-section[base-defender]").attr('show-lifeform', '0');
  combatSimChanged = false;
  $("gradient-button button#saveCombatPlanning div.emoji").remove();
  combatSimId = 0;
  loadSimDetails();
  $('#deleteCombatPlanning').attr('disabled', true).attr('data-simulation-id', 0).data('simulationId', 0);
  $("combatsim-shortinfo div > span").html('-');
  $('#showCombatResultShortInfo').prop('disabled', true).attr('data-target', '');
  $("#saveCombatPlanning").prop('disabled', true);
  $("#simulateCombatPlanning").prop('disabled', true);
  $(".removeParticipantBtn").addClass('disabled');
}

function resetAnim(obj) {
  let currentTarget = $(obj);
  currentTarget.find('.togglePanel').hide();
  currentTarget.find('class-selection input').prop('checked', false);
}

function invitePlayerToSim(obj) {
  let simId = $(obj).data('simulationId');
  let playerId = $(obj).data('playerId');

  if ($("shared-participant").length >= combatSimMaxParticipants) {
    showNotification(combatSimLoca.LOCA_COMBATSIM_TOO_MUCH_PARTICIPANTS.replace("#number#", combatSimMaxParticipants), 'error');
    return;
  }

  if (combatSimId !== 0 && simId === combatSimId) {
    let body = {
      _token: token,
      simId: simId,
      playerId: playerId
    };
    $.ajax({
      url: simBackendUrl + '&action=invitePlayer',
      data: body,
      type: "POST",
      dataType: "json",
      success: function (json) {
        token = json.newAjaxToken;

        if (json.status === 'failure') {
          showNotification(json.errors[0].message, 'error');
          return;
        }

        if (json.status === 'success') {
          showNotification(json.message, 'success');
          loadSimDetails();
        }
      }
    });
  }
}

function removeParticipant(obj) {
  let simId = $(obj).data('simulationId');
  let playerId = $(obj).data('playerId');

  if (combatSimId !== 0 && simId === combatSimId) {
    let body = {
      _token: token,
      simId: simId,
      playerId: playerId
    };
    $.ajax({
      url: simBackendUrl + '&action=removePlayer',
      data: body,
      type: "POST",
      dataType: "json",
      success: function (json) {
        token = json.newAjaxToken;

        if (json.status === 'failure') {
          showNotification(json.errors[0].message, 'error');
          return;
        }

        if (json.status === 'success') {
          showNotification(json.message, 'success');
          loadSimDetails();
        }
      }
    });
  }
}