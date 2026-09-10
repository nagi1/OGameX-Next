

function renderEventSpaceObjects(galaxyContentObject, systemData) {
  galaxyContentObject.planets.map(planet => {
    switch (planet.planetType) {
      case 1:
        renderEventPlanet(planet, galaxyContentObject, systemData);
        break;

      case 2:
        renderEventDebris(planet, galaxyContentObject, systemData);
        break;
    }
  });
}

function renderEventPlanet(planet, galaxyContentObject, systemData) {
  if (!planet) {
    return;
  }

  let lastPosition = $("div.expeditionDebrisSlotBoxRow");
  let positionNumber = parseInt(lastPosition.find('.cellPosition').text()) + 1;
  lastPosition.after(`
        <div class="eventSlotRow">
            <div class="eventSlotBoxCell cellPosition">${positionNumber}</div>
            <div class="bdaySlotBox"  id="galaxyRow17planet">
                <div>
                    <h3 class="title float_left">${loca.LOCA_EVENTH_ENEMY_INFINITELY_SPACE}:</h3>
                </div>
                <div class="birthdayNameWrapper">
                    <div id="birthdayName" class="name float_left tooltipRel tooltipClose tooltipRight js_hideTipOnMobile js_bday_planet"
                       rel="planet17"
                    >
                        <div style="position: relative;width: 30px;height: 30px;display: inline-block;">
                            <img class="float_left"
                                src="${planet.imageInformation}"
                                width="30"
                                height="30"
                            />
                            ${addFleetContainer(galaxyContentObject.position, planet.planetType)}
                        </div>${planet.planetName}
                        ${getEventPlanetTooltip(planet, galaxyContentObject, systemData)}
                    </div>
                </div>
            </div>
        </div>
    `);
  getFleetIcon(planet.fleet, galaxyContentObject.position, planet.planetType);
}

function renderEventDebris(planet, galaxyContentObject, systemData) {
  if (!planet) {
    return;
  }

  let darkMatterObject = planet.resources.darkMatter;

  if (!darkMatterObject || !darkMatterObject.amount) {
    return;
  }

  let lastPosition = $("#galaxyRow17planet");

  if (!lastPosition.length) {
    lastPosition = $("div.expeditionDebrisSlotBoxRow");
  }

  let positionNumber = parseInt(lastPosition.find('.cellPosition').text()) + 1;
  lastPosition.after(`
        <div class="eventSlotRow">
            <div class="eventSlotBoxCell cellPosition">${positionNumber}</div>
            <div class="bdaySlotBox"  id="galaxyRow17debris">
                <div>
                    <h3 class="title float_left">${loca.LOCA_EVENTH_ENEMY_INFINITELY_SPACE}:</h3>
                </div>
                <div class="birthdayNameWrapper">
                    <div id="birthdayName" class="name float_left tooltipRel tooltipClose tooltipRight js_hideTipOnMobile js_bday_planet"
                       rel="debris17"
                    >
                        <div style="position: relative;width: 30px;height: 30px;display: inline-block;">
                            <img class="float_left" src="/img/icons/e1b6654d1b29bc65aea0b8fc79be80.png" width="30" height="30"/>
                            ${addFleetContainer(galaxyContentObject.position, planet.planetType)}
                        </div>${planet.planetName}
                        ${getEventDebrisTooltip(planet, galaxyContentObject, systemData)}
                    </div>
                </div>
            </div>
        </div>
    `);
  getFleetIcon(planet.fleet, galaxyContentObject.position, planet.planetType);
}

function getEventPlanetTooltip(planet, galaxyContentObject, systemData) {
  let {
    galaxy,
    system,
    position
  } = galaxyContentObject;
  let linkHTML = '';

  if (!systemData.canFly) {
    linkHTML += `<li>${loca.LOCA_FLEET_NO_FREE_SLOTS}</li>`;

    if (!systemData.hasAdmiral) {
      linkHTML += `<li><a href="${premiumLink}">${loca.LOCA_HEADER_GETADMIRAL}</a></li>`;
    }
  } else {
    planet.availableMissions.map(mission => {
      if (mission.missionType === constants.espionage) {
        if (mission.canSpy) {
          let espionageMissionFunction = getEspionageMission(galaxyContentObject, planet, systemData);

          if (espionageMissionFunction) {
            linkHTML += `<li><a href="#"
                                onClick="${espionageMissionFunction}">
                                ${mission.name}
                            </a></li>`;
          }
        }

        if (mission.reportId && mission.reportLink) {
          linkHTML += `<li><a href="${mission.reportLink}" class="overlay">${loca.LOCA_MESSAGES_ESPIONAGEREPORT}</a></li>`;
        }
      } else {
        linkHTML += `<li><a href="${mission.link}">${mission.name}</a></li>`;
      }
    });
  }

  return `
        <div id="planet${position}" style="display: none;" class="htmlTooltip galaxyTooltip">
            <h1>${loca.LOCA_ALL_PLANET}: <span class="textNormal">${planet.planetName}</span></h1>
            <div class="splitLine"></div>
            <ul class="ListImage">
                <li><span>[${galaxy}:${system}:${position}]</span></li>
                <li><img src="${planet['imageInformation']}" alt="" height="30" width="30"></li>
            </ul>
            <ul class="ListLinks">
                ${linkHTML}
            </ul>
        </div>
        `;
}

function getEventDebrisTooltip(planet, galaxyContentObject, systemData) {
  let {
    galaxy,
    system,
    position
  } = galaxyContentObject;
  let darkMatterObject = planet.resources.darkMatter;
  let darkmatter = number_format(darkMatterObject.amount);
  let recyclersToSend = planet.requiredShips;
  let linkHTML = "";

  if (!systemData.canFly) {
    linkHTML += `<li>${loca.LOCA_FLEET_NO_FREE_SLOTS}</li>`;

    if (!systemData.hasAdmiral) {
      linkHTML += `<li><a href="${premiumLink}">${loca.LOCA_HEADER_GETADMIRAL}</a></li>`;
    }
  } else if (systemData.availableRecyclers > 0) {
    let recyclerJS = `sendShips(${8}, ${galaxy}, ${system}, ${position}, ${planet.planetType}, ${recyclersToSend})`;
    linkHTML = `<li><a href="#" onClick="${recyclerJS};return false">${loca.LOCA_GALAXY_DEBRIS_REDUCE}</a></li>`;
  } else {
    linkHTML = `<li><span class="inactiveLink">${loca.LOCA_GALAXY_DEBRIS_REDUCE}</span></li>`;
  }

  let headline = loca.LOCA_FLEET_DEBRIS;
  return `
        <div id="debris${position}" style="display: none;" class="htmlTooltip galaxyTooltip">
            <h1>${headline}</h1>
            <div class="splitLine"></div>
            <ul class="ListImage">
                <li><span id="pos-debris">[${galaxy}:${system}:${position}]</span></li>
                <li><img class="float_left" src="/img/icons/e1b6654d1b29bc65aea0b8fc79be80.png" width="30" height="30" alt="${headline}"/></li>
            </ul>
            <ul class="ListLinks">
                <li class="debris-content">${loca.LOCA_ALL_DARKMATTER}: ${darkmatter}</li>
                ${linkHTML}
            </ul>
        </div>
    `;
}