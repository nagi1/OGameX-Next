

function switchParticipant(obj) {
  if ($(obj).hasClass('active')) {
    return;
  }

  let attackType = $(obj).data('attackType');
  let participantId = $(obj).data('participantId');
  let combatsimSection = $(obj).closest("combatsim-section");
  $('participant-header[data-attack-type="' + attackType + '"]').removeClass('active');
  $('participant-header[data-attack-type="' + attackType + '"][data-participant-id="' + participantId + '"]').addClass('active');
  $('fleet-content[data-attack-type="' + attackType + '"]:not(fleet-content[base-defender])').hide();
  $('fleet-content[data-attack-type="' + attackType + '"][data-participant-id="' + participantId + '"]').show(); //adjust buttons

  $(combatsimSection.find("fleet-section-clear .clearPlayer")).attr('data-participant-id', participantId).data('participantId', participantId).attr('data-attack-type', attackType).data('attackType', attackType);
  $(combatsimSection.find("fleet-section-clear .clearTechnologies")).attr('data-participant-id', participantId).data('participantId', participantId).attr('data-attack-type', attackType).data('attackType', attackType);
}

function deleteRequest(obj) {
  let simId = $(obj).data('simulationId');

  if (simId === 0) {
    return;
  }

  let creation = $("single-simulation[data-simulation-id=" + simId + "] .creation").html();
  let target = $("single-simulation[data-simulation-id=" + simId + "] .target span").html();
  let question = combatSimLoca.LOCA_COMBATSIM_DELETE_REQUEST.replace('#date#', creation).replace('#target#', target);
  errorBoxDecision(combatSimLoca.LOCA_COMBATSIM_DELETE, question, jsloca.LOCA_ALL_YES, jsloca.LOCA_ALL_NO, function () {
    deleteSim(simId);
  });
}

function deleteSim(simId) {
  let body = {
    _token: token,
    simId: simId
  };
  $.ajax({
    url: simBackendUrl + '&action=deleteSim',
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
        $("combatsim-list single-simulation[data-simulation-id=" + json.simId + "]").remove();
        showNotification(json.message, 'success');

        if (combatSimId === json.simId) {
          combatSimId = 0;
          loadSimDetails();
          $('#deleteCombatPlanning').attr('disabled', true).attr('data-simulation-id', 0).data('simulationId', 0);
          newCombatPlanning();
        }

        if ($("combatsim-list owned-sims single-simulation").length === 0) {
          $("combatsim-list owned-sims").append('<div className="noentries">' + combatSimLoca.LOCA_COMBATSIM_NO_SIMS_FOUND + '</div>');
        }

        $("combatsim-list .entryCount .current").html($("combatsim-list single-simulation").length);
      }
    },
    error: function () {
      showNotification(combatSimLoca.LOCA_ERROR_DEFAULT, 'error');
    }
  });
}

function saveSimName(obj) {
  let simId = $(obj).data('simulationId');

  if (simId === 0 || simId !== combatSimId) {
    return;
  }

  let simName = $('combatsim-name input[name=simulationName]').val();
  let body = {
    _token: token,
    simId: simId,
    simName: simName
  };
  $.ajax({
    url: simBackendUrl + '&action=saveSimName',
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
        $("combatsim-list single-simulation[data-simulation-id=" + json.simData.simId + "] .state span.simName").text(' - ' + json.simData.simName);
        $("combatsim-shortinfo .shortName span").text(json.simData.simName);
        showNotification(json.message, 'success');
      }
    },
    error: function () {
      showNotification(combatSimLoca.LOCA_ERROR_DEFAULT, 'error');
    }
  });
}