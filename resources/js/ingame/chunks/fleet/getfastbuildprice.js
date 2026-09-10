

function getFastBuildPrice($thisObj) {
  if ($thisObj.hasClass('building')) {
    return pricebuilding;
  } else if ($thisObj.hasClass('lfbuilding')) {
    return pricelfbuilding;
  } else if ($thisObj.hasClass('research')) {
    return priceresearch;
  } else if ($thisObj.hasClass('lfresearch')) {
    return pricelfresearch;
  } else if ($thisObj.hasClass('ship')) {
    return priceship;
  } else if ($thisObj.hasClass('shipextended')) {
    return priceshipextended;
  }
}

function getRedirectLink(params) {
  var finalParams = {};

  if (params != undefined) {
    for (var key in params) {
      finalParams[key] = params[key];
    }

    return $.param.fragment($.param.querystring(window.location.href, finalParams), {}); //Return witch anchor and added params
  } else {
    return window.location.href.split('#')[0]; //return url without anchor
  }
}

function sendShips(order, galaxy, system, planet, planettype, shipCount, additionalParams) {
  if (shipsendingDone == 1) {
    shipsendingDone = 0;
    params = {
      mission: order,
      galaxy: galaxy,
      system: system,
      position: planet,
      type: planettype,
      shipCount: shipCount,
      _token: token
    };

    if (additionalParams && typeof additionalParams === 'object') {
      Object.keys(additionalParams).map(key => {
        if (!params[key]) {
          params[key] = additionalParams[key];
        }
      });
    }

    $.ajax(miniFleetLink, {
      data: params,
      dataType: "json",
      type: "POST",
      success: function (data) {
        token = data.newAjaxToken;
        updateOverlayToken('phalanxSystemDialog', data.newAjaxToken);
        updateOverlayToken('phalanxDialog', data.newAjaxToken);
        getAjaxEventbox();
        displayMiniFleetMessage(data.response);
        refreshFleetEvents(true);
      }
    });
  }
}

function sendShipsWithPopup(order, galaxy, system, planet, planettype, shipCount) {
  params = {
    mission: order,
    galaxy: galaxy,
    system: system,
    position: planet,
    type: planettype,
    shipCount: shipCount,
    _token: token
  };
  $.ajax(miniFleetLink, {
    data: params,
    dataType: "json",
    type: "POST",
    success: function (data) {
      token = data.newAjaxToken;
      updateOverlayToken('phalanxSystemDialog', data.newAjaxToken);
      updateOverlayToken('phalanxDialog', data.newAjaxToken);

      if (data.response.success) {
        fadeBox(data.response.message + ' ' + data.response.coordinates.galaxy + ":" + data.response.coordinates.system + ":" + data.response.coordinates.position, !data.response.success);
      } else {
        fadeBox(data.response.message, true);
      }
    }
  });
}

function outlawWarning(order, galaxy, system, planet, planettype, shipCount, callbackFunction) {
  if (typeof callbackFunction != 'function') {
    if (order == constants.espionage) {
      callbackFunction = sendEspionageProbes;
    } else if (order == constants.missleattack) {
      callbackFunction = openMissleLaunchBox;
    }
  }

  if (showOutlawWarning) {
    errorBoxDecision(LocalizationStrings.attention, LocalizationStrings.outlawWarning, LocalizationStrings.yes, LocalizationStrings.no, callbackFunction);
  } else {
    callbackFunction();
  }

  function sendEspionageProbes() {
    sendShips(order, galaxy, system, planet, planettype, shipCount);
  }

  function openMissleLaunchBox() {
    openOverlay(missleAttackLink + '&galaxy=' + galaxy + '&system=' + system + '&position=' + planet + '&type=' + planettype, {
      modal: true,
      title: loca.LOCA_FLEET_MISSILEATTACK || 'Missile Attack'
    });
  }
}