

function movePlanet(url, data, reloadPage) {
  function movePlanetExecute() {
    $.post(url, data, function (res) {
      if (res.error == '') {
        fadeBox(galaxyLoca.reservationSuccess, false);
        setTimeout('reload_page("' + reloadPage + '")', 3000);
      } else {
        fadeBox(res.error, true);
      }
    }, "json");
  }

  errorBoxDecision(galaxyLoca.questionTitle, galaxyLoca.question, LocalizationStrings.yes, LocalizationStrings.no, movePlanetExecute);
}

function discoverPlanet(url, data, success = () => {}) {
  const discover = () => {
    $.post(url, data, function (res) {
      token = res.newAjaxToken;

      if (typeof res.response.success !== 'undefined' && res.response.success === true) {
        getAjaxEventbox();
        success();
        getAjaxResourcebox();
      }

      displayMiniFleetMessage(res.response);
      const discoveryIcons = Array.from(document.getElementsByClassName('planetDiscover'));
      discoveryIcons.forEach(icon => {
        if (icon.classList.contains('position' + res.response.coordinates.position)) {
          return;
        }

        if (res.response.discovery.canSendDiscovery !== true) {
          $(icon).replaceWith(`
                        <div class="planetDiscoverIcons planetDiscoverUnavailable tooltip icon js_hideTipOnMobile"
                            title="${res.response.discovery.canSendDiscovery}">
                        </div>
                    `);
          return;
        }

        const titleText = galaxyLoca.discoverySend + " " + res.response.discovery.discoveryCount;
        icon.title = titleText;
        changeTooltip(icon, titleText);
      });
      const targetIcon = $('.planetDiscover.position' + res.response.coordinates.position);
      targetIcon.replaceWith(`<div class="planetDiscoverIcons planetDiscoverUnavailable tooltip icon js_hideTipOnMobile"
                    title="${galaxyLoca.discoveryUnderway}">
                </div>`);
      document.getElementById('galaxyHeaderDiscoveryCount').innerHTML = res.response.discovery.galaxyHeader.LOCA_GALAXY_LIFEFORM_DISCOVERY_COUNT;
    }, "json");
  };

  if (showDiscoveryWarning) {
    errorBoxDecision(galaxyLoca.discoverQuestionTitle, galaxyLoca.discoverQuestionText, LocalizationStrings.yes, LocalizationStrings.no, discover);
  } else {
    discover();
  }
}

let sendingSystemDiscoveryMission = false;

function sendSystemDiscoveryMission() {
  if (typeof sendDiscoverSystemUrl === 'undefined' || !sendDiscoverSystemUrl) {
    return;
  }

  if (typeof galaxy === 'undefined' || !galaxy) {
    return;
  }

  if (typeof system === 'undefined' || !system) {
    return;
  }

  if (sendingSystemDiscoveryMission) {
    return;
  }

  sendingSystemDiscoveryMission = true;
  $.ajax({
    url: sendDiscoverSystemUrl,
    data: {
      galaxy: galaxy,
      system: system,
      _token: token
    },
    type: "POST",
    dataType: "json",
    success: function (res) {
      token = res.newAjaxToken;

      if (res.response.success) {
        getAjaxEventbox();
        getAjaxResourcebox();
        res.response.sentToCoordinates.map(coords => {
          displayMiniFleetMessage({ ...res.response,
            coordinates: coords
          }, false);
          const targetIcon = $('.planetDiscover.position' + coords.position);
          targetIcon.replaceWith(`
                        <div class="planetDiscoverIcons planetDiscoverUnavailable tooltip icon js_hideTipOnMobile"
                            title="${galaxyLoca.discoveryUnderway}">
                        </div>
                    `);
        });
      } else {
        fadeBox(res.response.message, true);
      }

      sendingSystemDiscoveryMission = false;
    },
    error: function () {
      sendingSystemDiscoveryMission = false;
    }
  });
}