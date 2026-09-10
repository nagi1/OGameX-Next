

function closeCombatSimResultOverlay() {
  if (!$(".overlayDiv.combatSimResultOverlay").length) {
    return;
  }

  $(".overlayDiv.combatSimResultOverlay").remove();
}
/* Rounds start */


function getRoundData(round, participant, side = "attacker") {
  let remainingTechs = {};
  let lostTechs = {};
  let roundData = {};

  if (typeof combatData === 'undefined') {
    return roundData;
  }

  let {
    combatRounds
  } = combatData;

  if (!combatRounds[round]) {
    return roundData;
  }

  let currentRound = combatRounds[round];

  if (participant !== 'all') {
    if (currentRound[`${side}Ships`] && currentRound[`${side}Ships`][participant]) {
      remainingTechs = currentRound[`${side}Ships`][participant];
    }

    if (currentRound[`${side}Losses`] && currentRound[`${side}Losses`][participant]) {
      lostTechs = currentRound[`${side}Losses`][participant];
    }
  } else {
    if (currentRound[`${side}ShipsTotal`]) {
      remainingTechs = currentRound[`${side}ShipsTotal`];
    }

    if (currentRound[`${side}LossesInThisRoundTotal`]) {
      lostTechs = currentRound[`${side}LossesInThisRoundTotal`];
    }
  }

  Object.keys(remainingTechs).map(techId => {
    if (!roundData[techId]) {
      roundData[techId] = {
        "remaining": 0,
        "lost": 0
      };
    }

    roundData[techId].remaining = remainingTechs[techId];
  });
  Object.keys(lostTechs).map(techId => {
    if (!roundData[techId]) {
      roundData[techId] = {
        "remaining": 0,
        "lost": 0
      };
    }

    roundData[techId].lost = lostTechs[techId];
  });
  return roundData;
}

function selectRound(round) {
  let attacker = 'all';

  if ($('#combatSimReport .attacker .participant_select').length) {
    attacker = $('#combatSimReport .attacker .participant_select').val();
  }

  displayRoundData(round, attacker, 'attacker');
  let defender = 'all';

  if ($('#combatSimReport .defender .participant_select').length) {
    defender = $('#combatSimReport .defender .participant_select').val();
  }

  displayRoundData(round, defender, 'defender');
  displayRoundStatistics(round);
  $('.selectRoundBtn').removeAttr('disabled');
  $(`.selectRoundBtn[data-round-number=${round}]`).prop('disabled', true);
}

function displayRoundData(round, participant, side = "attacker") {
  let roundData = getRoundData(round, participant, side); // let shownTechIds = Object.keys(roundData)

  $(`#combatSimRounds .combat_participant.${side} .military_ships > li`).hide().removeClass('even odd');
  $(`#combatSimRounds .combat_participant.${side} .civil_ships > li`).hide().removeClass('even odd');
  $(`#combatSimRounds .combat_participant.${side} .defence_techs > li`).hide().removeClass('even odd');
  Object.keys(roundData).map(techId => {
    let {
      remaining,
      lost
    } = roundData[techId];

    if (remaining || lost) {
      $(`#${side}CombatSimTechRow_${techId}`).show();
      $(`#${side}CombatSimTechRow_${techId} .detail_shipsleft`).text(remaining);
      $(`#${side}CombatSimTechRow_${techId} .detail_shipslost`).text(-lost);
    }
  });
  let participantNumber = 0;

  if (participant !== 'all') {
    participantNumber = participant;
  }

  $(`.${side}CharacterClass characterclass-icon`).removeAttr(characterClassArr.join(' ')).attr(findClassName(characterClassArr, combatData[side][participantNumber].characterClassId), true);
  $(`.${side}AllianceClass allianceclass-icon`).removeAttr(allianceClassArr.join(' ')).attr(findClassName(allianceClassArr, combatData[side][participantNumber].allianceClassId), true);
  let visibleIterator = 0;
  $(`#combatSimRounds .combat_participant.${side} .military_ships li`).each(function (index, obj) {
    if ($(obj).is(':visible')) {
      if (visibleIterator % 2 === 0) {
        $(obj).addClass('odd');
      } else {
        $(obj).addClass('even');
      }

      visibleIterator++;
    }
  });
  $(`#combatSimRounds .combat_participant.${side} .combatShipsTitle`).show();

  if (!visibleIterator) {
    $(`#combatSimRounds .combat_participant.${side} .combatShipsTitle`).hide();
  }

  visibleIterator = 0;
  $(`#combatSimRounds .combat_participant.${side} .civil_ships li`).each(function (index, obj) {
    if ($(obj).is(':visible')) {
      if (visibleIterator % 2 === 0) {
        $(obj).addClass('odd');
      } else {
        $(obj).addClass('even');
      }

      visibleIterator++;
    }
  });
  $(`#combatSimRounds .combat_participant.${side} .civilShipsTitle`).show();

  if (!visibleIterator) {
    $(`#combatSimRounds .combat_participant.${side} .civilShipsTitle`).hide();
  }

  visibleIterator = 0;
  $(`#combatSimRounds .combat_participant.${side} .defence_techs li`).each(function (index, obj) {
    if ($(obj).is(':visible')) {
      if (visibleIterator % 2 === 0) {
        $(obj).addClass('odd');
      } else {
        $(obj).addClass('even');
      }

      visibleIterator++;
    }
  });
  $(`#combatSimRounds .combat_participant.${side} .defenceTechsTitle`).show();

  if (!visibleIterator) {
    $(`#combatSimRounds .combat_participant.${side} .defenceTechsTitle`).hide();
  }
}

function getRoundStatistic(round) {
  let statistic = {
    absorbedDamageAttacker: 0,
    absorbedDamageDefender: 0,
    fullStrengthAttacker: 0,
    fullStrengthDefender: 0,
    hitsAttacker: 0,
    hitsDefender: 0
  };

  if (typeof combatData === 'undefined') {
    return statistic;
  }

  let {
    combatRounds
  } = combatData;

  if (!combatRounds[round]) {
    return statistic;
  }

  let currentRound = combatRounds[round];

  if (currentRound.statistic) {
    statistic = currentRound.statistic;
  }

  return statistic;
}

function displayRoundStatistics(round) {
  let statistic = getRoundStatistic(round);
  Object.keys(statistic).map(statisticKey => {
    $(`#${statisticKey}`).text(statistic[statisticKey]);
  });
}

function getCombatResearchPercentages(side, participant = 'all') {
  let combatResearchPercentages = {
    weaponPercentage: 0,
    shieldPercentage: 0,
    armorPercentage: 0
  };

  if (typeof combatData === 'undefined') {
    return combatResearchPercentages;
  }

  if (!combatData[side]) {
    return combatResearchPercentages;
  }

  if (participant === 'all') {
    combatData[side].map(participantData => {
      if (participantData.weaponPercentage) {
        combatResearchPercentages.weaponPercentage += participantData.weaponPercentage;
      }

      if (participantData.shieldPercentage) {
        combatResearchPercentages.shieldPercentage += participantData.shieldPercentage;
      }

      if (participantData.armorPercentage) {
        combatResearchPercentages.armorPercentage += participantData.armorPercentage;
      }
    });
    combatResearchPercentages.weaponPercentage /= combatData[side].length;
    combatResearchPercentages.shieldPercentage /= combatData[side].length;
    combatResearchPercentages.armorPercentage /= combatData[side].length;
  } else {
    if (combatData[side] && combatData[side][participant]) {
      let participantData = combatData[side][participant];

      if (participantData.weaponPercentage) {
        combatResearchPercentages.weaponPercentage = participantData.weaponPercentage;
      }

      if (participantData.shieldPercentage) {
        combatResearchPercentages.shieldPercentage = participantData.shieldPercentage;
      }

      if (participantData.armorPercentage) {
        combatResearchPercentages.armorPercentage = participantData.armorPercentage;
      }
    }
  }

  return combatResearchPercentages;
}

function displayCombatResearchPercentages(side, participant) {
  let combatResarchPercentages = getCombatResearchPercentages(side, participant);
  $(`#combatSimRounds .combat_participant.${side} .${side}Weapon span`).text(`${combatResarchPercentages.weaponPercentage}%`);
  $(`#combatSimRounds .combat_participant.${side} .${side}Shield span`).text(`${combatResarchPercentages.shieldPercentage}%`);
  $(`#combatSimRounds .combat_participant.${side} .${side}Cover span`).text(`${combatResarchPercentages.armorPercentage}%`);
}