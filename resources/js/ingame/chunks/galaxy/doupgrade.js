

function doUpgrade(technologyId, planetId, mode, listId, showSlotWarning) {
  let warning;

  if (planetType === 1) {
    warning = LocalizationStrings.lastSlotWarningMoon;
  } else {
    warning = LocalizationStrings.lastSlotWarningPlanet;
  }

  if (showSlotWarning && lastBuildingSlot.shouldWarnForTechnologyId(technologyId)) {
    errorBoxDecision(LocalizationStrings.attention, warning, LocalizationStrings.yes, LocalizationStrings.no, function () {
      executeBuildAction(technologyId, planetId, mode, listId);
    });
  } else {
    executeBuildAction(technologyId, planetId, mode, listId);
  }
}

function executeBuildAction(technologyId, planetId, mode, listId) {
  if (mode === 1) {
    buildListActionBuild(technologyId, null, null, null, planetId);
  } else if (mode === 3) {
    buildListActionDemolish(technologyId, planetId);
  } else if (mode === 2 && listId) {
    buildListActionCancel(technologyId, listId, planetId);
  }
}