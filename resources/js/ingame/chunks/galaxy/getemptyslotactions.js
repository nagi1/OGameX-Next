

function getEmptySlotActions(galaxyContentObject, systemData) {
  let emptyLink = `<div class="emptyAction"></div>`;
  let coloniseMission = galaxyContentObject.availableMissions.find(availMission => availMission.missionType === 7);
  let colonisationLink = "";

  if (!systemData.canColonize || !coloniseMission || coloniseMission.link === "#") {
    colonisationLink = `<div class="tooltip planetMoveIcons colonize-inactive icon tpd-hideOnClickOutside"
                      title="${coloniseMission ? coloniseMission.description : loca.LOCA_GALAXY_ERROR_COLONIZATION}"></div>`;
  } else {
    colonisationLink = `<a href="${coloniseMission.link}" class="tooltip planetMoveIcons colonize-active icon tpd-hideOnClickOutside ipiHintable" data-ipi-hint="ipiGalaxyColonize">
                    <div class="tooltip planetMoveIcons colonize-active icon tpd-hideOnClickOutside"
                      title="${coloniseMission.description}"></div></a>`;
  }

  let planetMove = galaxyContentObject.availableMissions.find(availMission => availMission.missionType === 0);
  let planetMoveLink = "";

  if (planetMove === undefined) {
    planetMoveLink = `<div class="emptyAction"></div>`;
  } else if (planetMove.planetMovePossible === true) {
    planetMoveLink = `<a class="planetMoveIcons planetMoveDefault tooltip icon js_hideTipOnMobile"
               href="javascript: void(0);"
               onClick="movePlanet(
                       '${planetMove.moveLink}',
                       {'position':${galaxyContentObject.position},
                       'galaxy': ${galaxyContentObject.galaxy},
                       'system': ${galaxyContentObject.system}},
                       '${planetMove.galaxyLink}'
                       ); return false;"
               title="${planetMove.title}"
            ><div class="planetMoveIcons planetMoveDefault tooltip icon js_hideTipOnMobile"
                      title="${planetMove.title}"></div></a>`;
  } else {
    planetMoveLink = `<div class="planetMoveIcons planetMoveInactive tooltip icon"
                      title="${planetMove.title}"></div>`;
  }

  const discoverLink = getDiscoveryLinkIcon(galaxyContentObject);
  return `
        ${discoverLink}
        ${colonisationLink}
        ${planetMoveLink}
        ${emptyLink}
        ${emptyLink}
        `;
}

function getDiscoveryLinkIcon(galaxyContentObject) {
  let discoverLink = "";

  if (constants.lifeformEnabled === true) {
    const discoverMission = galaxyContentObject.availableMissions.find(mission => mission.missionType === constants.discover);

    if (typeof discoverMission !== 'undefined') {
      if (discoverMission.canSend === true) {
        const titleText = galaxyLoca.discoverySend + " " + discoverMission.discoveryCount;
        discoverLink = `<div class="planetDiscoverIcons planetDiscoverDefault icon"><a href="#"
                    class="tooltip js_hideTipOnMobile ipiHintable planetDiscover position${galaxyContentObject.position}"
                    data-ipi-hint="ipiDiscoverLifeform"
                    onClick="discoverPlanet(
                        '${discoverMission.link}',
                        {
                            'galaxy': ${galaxyContentObject.galaxy},
                            'system': ${galaxyContentObject.system},
                            'position':${galaxyContentObject.position},
                            '_token': token
                        }
                    ); return false;"
                    title="${titleText}">
                </a></div>`;
      } else {
        discoverLink = `<div class="planetDiscoverIcons planetDiscoverUnavailable tooltip ipiHintable icon js_hideTipOnMobile"
                    data-ipi-hint="ipiDiscoverLifeform"
                    title="${discoverMission.canSend}">
                </div>`;
      }
    }
  }

  return discoverLink;
}