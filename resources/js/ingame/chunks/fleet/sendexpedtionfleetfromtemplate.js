

function sendExpedtionFleetFromTemplate() {
  let selectedExpedtionFleetTemplateId = getValue($('#expeditionFleetTemplateSelect').val());

  if (!selectedExpedtionFleetTemplateId) {
    return;
  }

  let expeditionFleetTemplate = expeditionFleetTemplates.find(template => template.id === selectedExpedtionFleetTemplateId);

  if (!expeditionFleetTemplate) {
    return;
  }

  let ships = expeditionFleetTemplate.ships;
  let additionalParams = {
    'speed': expeditionFleetTemplate.fleetSpeed / 10,
    'holdingtime': expeditionFleetTemplate.expeditionTime
  };
  Object.keys(ships).forEach(function (shipId) {
    additionalParams['am' + shipId] = ships[shipId];
  });
  sendShips(missionExpedition, galaxy, system, expeditionPosition, spaceObjectTypePlanet, 0, additionalParams);
}

function initMissleAttackLayer() {
  $("#rocketattack").closest('.ui-dialog-content').dialog('option', 'title', $('#rocketattack').data('title'));
  $("#rocketattack input#missileCount").keyup(function () {
    checkIntInput($(this), 1, $(this).data("max"));
  }).change(function () {
    checkIntInput($(this), 1, $(this).data("max"));
  }).focus();
  $("#rocketattack #number").bind('click', function () {
    var $input = $("#rocketattack input#missileCount");

    if (parseInt($input.val()) != $input.data('max')) {
      $input.val($input.data('max'));
    } else {
      $input.val('1');
    }
  });
  $("#rocketattack #priority a").bind('click', function () {
    var $this = $(this);
    var $primaryTarget = $('#primaryTarget');
    $("#rocketattack #priority a").not($this).removeClass('active');

    if ($this.hasClass('active')) {
      $this.removeClass('active');
      $primaryTarget.val('');
      $("#noPriorityInfo").show();
    } else {
      $this.addClass('active');
      $primaryTarget.val($this.attr('ref'));
      $("#noPriorityInfo").hide();
    }
  });
  $("form#rocketForm").submit(function () {
    $.post($(this).attr("action"), $(this).serialize(), function (response) {
      if (response) {
        launchMissiles(response);
      }
    });
    return false;
  });

  function updateArrivalTime() {
    var $timer = $("#rocketattack #arrivalTime #timer");
    $timer.html(getFormatedDate(serverTime.getTime() + 1000 * $timer.data('duration'), '[d].[m].[y] [G]:[i]:[s]'));
  }

  timerHandler.appendCallback(updateArrivalTime);
  updateArrivalTime();
}

function displayMiniFleetMessage(response, addCoordinatesToMessage = true) {
  var message = response.message;

  if (addCoordinatesToMessage && typeof response.coordinates != 'undefined' && response.coordinates) {
    message += ' [' + response.coordinates.galaxy + ':' + response.coordinates.system + ':' + response.coordinates.position + ']';
  }

  if (response.success) {
    var symbolSelector = '#ownFleetStatus_' + response.coordinates.position + '_' + response.planetType;

    switch (response.type) {
      case 1:
        $(symbolSelector).removeClass("fleetNeutral");
        $(symbolSelector).attr('title', galaxyLoca.fleetAttacking).addClass('fleetHostile').addClass('tooltip');
        break;

      case 2:
        $(symbolSelector).attr('title', galaxyLoca.fleetUnderway).addClass('fleetNeutral').addClass('tooltip');
        break;

      case 3:
        $(symbolSelector).attr('title', galaxyLoca.fleetUnderway).addClass('fleetNeutral').addClass('tooltip');
        break;

      case 4:
        $(symbolSelector).attr('title', galaxyLoca.fleetUnderway).addClass('fleetNeutral').addClass('tooltip');
        break;
    }

    addToTable(message, "success", response.shipsSent);
    showNotification(message, "success");
    $("#slotUsed").html(tsdpkt(response.slots));
    setShips("probeValue", tsdpkt(response.probes));
    setShips("recyclerValue", tsdpkt(response.recyclers));
    setShips("missileValue", tsdpkt(response.missiles));
  } else {
    addToTable(message, "error");
    showNotification(message, "error");
  }

  shipsendingDone = 1;
}