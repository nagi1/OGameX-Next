

function renderActions(galaxyContentObject, systemData) {
  if (systemData.playerId !== galaxyContentObject.player.playerId) {
    $("#galaxyRow" + galaxyContentObject.position + " .cellAction").html(`${getActions(galaxyContentObject, systemData)}`);
  } else {
    let result = `
        ${getDiscoveryLinkIcon(galaxyContentObject)}
        ${`<div class="emptyAction"></div>`}
        ${`<div class="emptyAction"></div>`}
        ${`<div class="emptyAction"></div>`}
        ${`<div class="emptyAction"></div>`}
       `;
    $("#galaxyRow" + galaxyContentObject.position + " .cellAction").html(getDiscoveryLinkIcon(galaxyContentObject)).html(`${result}`);
  }
}

function renderEmptySlotActions(galaxyContentObject, systemData) {
  $("#galaxyRow" + galaxyContentObject.position + " .cellAction").html(`${getEmptySlotActions(galaxyContentObject, systemData)}`);
}

function getPlayerName(galaxyContentObject, systemData) {
  let {
    player
  } = galaxyContentObject;
  let playerName = "";

  if (player.rank && player.rank.hasRank) {
    playerName = `<span class="honorRank ${player.rank.rankClass} tooltip js_hideTipOnMobile" title="${player.rank.rankTitle}"></span>`;
  }

  if (player.playerId !== systemData.playerId) {
    playerName += `<span class="playerName tooltipRel tooltipClose tooltipRight js_hideTipOnMobile ${getPlayerColorClass(player)}"
           rel="player${player.playerId}">${player.playerName}${getPlayerTooltip(galaxyContentObject)}</span>`;
  } else {
    playerName += `<span class="${getPlayerColorClass(player)} ownPlayerRow">${player.playerName}</span>`;
  }

  playerName += getPlayerAbbreviations(player, galaxyContentObject);
  return playerName;
}