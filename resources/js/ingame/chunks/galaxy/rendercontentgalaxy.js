

function renderContentGalaxy(json) {
  token = json.token;
  updateOverlayToken('phalanxSystemDialog', json.token);
  updateOverlayToken('phalanxDialog', json.token);
  toGalaxyLink = json.system.toGalaxyLink;
  $('#amountColonized').html(json.system.slotsColonized);
  $('#probeValue').html(json.system.availableProbes);
  $('#recyclerValue').html(json.system.availableRecyclers);
  $('#missileValue').html(json.system.availableMissiles);
  $('#slotUsed').html(json.system.usedFleetSlots);
  $('#slotValue').html(json.system.maximumFleetSlots);
  $("input#galaxy_input").val(json.system.galaxy);
  $("input#system_input").val(json.system.system);
  canSwitchGalaxy = json.system.canSwitchGalaxy;
  // TODO: re-enable
  //getAjaxResourcebox();
  $.each(json.filterSettings, function (key, value) {
    if (value) {
      $(`#filterCell #${key}`).addClass('filter_active');
    }
  });

  if (!canSwitchGalaxy) {
    fadeBox(notEnoughDeuteriumMessage, true);
  }

  if (preserveSystemOnPlanetChange) {
    $(".planetlink, .moonlink").querystring({
      galaxy: json.system.galaxy,
      system: json.system.system
    });
  }

  $('#expeditionDebris').remove();
  $('#galaxyRow17planet').remove();
  $('#galaxyRow17debris').remove();
  buildListCountdowns.map(countdownObject => {
    timerHandler.removeCallback(countdownObject.getTimer);
  });
  buildListCountdowns = [];

  for (const galaxyContentObject of json.system.galaxyContent) {
    clearPosition(galaxyContentObject.position);

    if (galaxyContentObject.position === 16) {
      $("#expeditionDebrisSlotDebrisContainer").append(`
                <div id="expeditionDebris" class="name float_left tooltipRel tooltipClose tooltipRight js_hideTipOnMobile js_bday_debris tpd-hideOnClickOutside" rel="debris16">
                    <div style="position: relative;width: 30px;height: 30px;display: inline-block;">
                        <img class="float_left" src="/img/icons/fa3e396b8af2ae31e28ef3b44eca91.gif" width="30" height="30"/>
                        ${addFleetContainer(galaxyContentObject.position, galaxyContentObject.planets.planetType)}
                    </div>
                </div>
            `);
      $("#expeditionDebris").append(getDebrisTooltip(galaxyContentObject.planets, galaxyContentObject, json.system));
      getFleetIcon(galaxyContentObject.planets.fleet, galaxyContentObject.position, galaxyContentObject.planets.planetType);
      continue;
    }

    if (galaxyContentObject.position === 17) {
      renderEventSpaceObjects(galaxyContentObject, json.system);
      continue;
    }

    $("#galaxyRow" + galaxyContentObject.position).addClass(galaxyContentObject.positionFilters);

    if (galaxyContentObject.planets.length > 0) {
      let shouldLoadPlayerToo = false;

      for (const planet of galaxyContentObject.planets) {
        switch (planet.planetType) {
          case 1:
            renderPlanet(galaxyContentObject, planet, json.system);
            shouldLoadPlayerToo = true;
            break;

          case 2:
            renderDebris(galaxyContentObject, planet, json.system);
            break;

          case 3:
            renderMoon(galaxyContentObject, planet, json.system);
            shouldLoadPlayerToo = true;
            break;
        }
      }

      if (shouldLoadPlayerToo) {
        renderPlayer(galaxyContentObject, json.system);
        colorNumberInFrontOfFriendsPlanet(galaxyContentObject);
        renderPhalanx(galaxyContentObject);
        renderAlliance(galaxyContentObject, json.system);
        renderActions(galaxyContentObject, json.system);
      } else {
        renderEmptySlot(galaxyContentObject, json.system, json.reservedPositions);
      }
    } else {
      renderEmptySlot(galaxyContentObject, json.system, json.reservedPositions);
    }
  }

  $("#galaxyLoading").hide();
  inProgress = false;

  if (typeof IPI !== 'undefined') {
    IPI.refreshHighlights();
  }
}

function renderPlanet(galaxyContentObject, planet, systemData) {
  $("#galaxyRow" + galaxyContentObject.position + " .cellPlanetName").html(`<span class="${galaxyContentObject.player.isBuddy ? "status_abbr_buddy" : ''}">${planet.planetName}</span>`);
  $("#galaxyRow" + galaxyContentObject.position + " .cellPlanet").html(`<a href="javascript: void(0);" onclick="${getEspionageMission(galaxyContentObject, planet, systemData)}"><div class="microplanet"></div></a>`);
  $("#galaxyRow" + galaxyContentObject.position + " .cellPlanet .microplanet").addClass(planet.imageInformation).append(getActivityStar(planet.activity)).append(addFleetContainer(galaxyContentObject.position, planet.planetType)).append(getFleetIcon(planet.fleet, galaxyContentObject.position, planet.planetType)).attr('data-planet-id', planet.planetId).addClass('planetTooltip tooltipRel tooltipPersistent tooltipClose tooltipRight js_hideTipOnMobile').attr('rel', 'planet' + galaxyContentObject.position).append(getPlanetTooltip(planet, galaxyContentObject, systemData));
}

function renderDebris(galaxyContentObject, planet, systemData) {
  $("#galaxyRow" + galaxyContentObject.position + " .cellDebris").html(`<a href="javascript: void(0);"><div class="microdebris ${planet.imageInformation}"></div></a>`);
  $("#galaxyRow" + galaxyContentObject.position + " .cellDebris .microdebris").append(addFleetContainer(galaxyContentObject.position, planet.planetType)).append(getFleetIcon(planet.fleet, galaxyContentObject.position, planet.planetType)).attr('rel', 'debris' + galaxyContentObject.position).addClass("tooltipRel tooltipClose tooltipRight js_hideTipOnMobile").append(getDebrisTooltip(planet, galaxyContentObject, systemData));
}

function renderMoon(galaxyContentObject, planet, systemData) {
  $("#galaxyRow" + galaxyContentObject.position + " .cellMoon").html(`<a href="javascript: void(0);" onclick="${getEspionageMission(galaxyContentObject, planet, systemData)}"><div class="micromoon ${planet.imageInformation}"></div></a>`);
  $("#galaxyRow" + galaxyContentObject.position + " .cellMoon .micromoon").append(getActivityStar(planet.activity)).append(addFleetContainer(galaxyContentObject.position, planet.planetType)).append(getFleetIcon(planet.fleet, galaxyContentObject.position, planet.planetType)).attr('data-moon-id', planet.planetId).attr('rel', 'moon' + galaxyContentObject.position).addClass("tooltipRel tooltipClose tooltipRight js_hideTipOnMobile").append(getMoonTooltip(planet, galaxyContentObject, systemData));
}

function renderPlayer(galaxyContentObject, systemData) {
  let {
    player
  } = galaxyContentObject;

  if (player && player.playerId !== 99999) {
    $("#galaxyRow" + galaxyContentObject.position + " .cellPlayerName").html(getPlayerName(galaxyContentObject, systemData));
  }
}

function colorNumberInFrontOfFriendsPlanet(galaxyContentObject) {
  let {
    player
  } = galaxyContentObject;

  if (player.isBuddy) {
    $("#galaxyRow" + galaxyContentObject.position + " .cellPosition").addClass('status_abbr_buddy');
  }
}

function renderEmptySlot(galaxyContentObject, systemData, reservedPlanets) {
  if (galaxyContentObject.availableMissions) {
    let planetNameCell = $("#galaxyRow" + galaxyContentObject.position + " .cellPlanetName");
    planetNameCell.html('');
    let reservedPlanet = reservedPlanets[galaxyContentObject.position];

    if (reservedPlanet && reservedPlanet.isReserved && parseInt(reservedPlanet.user_id) === systemData.playerId) {
      planetNameCell.append(`
                <span class="planetMoveGalaxyCooldown" id="cooldown-${galaxyContentObject.position}">
                    ${loca.LOCA_ALL_AJAXLOAD}
                </span>
            `);
      buildListCountdowns.push(new SimpleCountdownTimer(`#cooldown-${galaxyContentObject.position}`, reservedPlanet.cooldown, toGalaxyLink));
    }

    renderEmptySlotActions(galaxyContentObject, systemData);
  }
}