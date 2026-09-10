

function fetchDataAboutCurrentAllianceClass(newClassName, upgradeItemAjax, questionType, price) {
  if (!activatingItem) {
    activatingItem = true;
    $.ajax({
      url: inventoryObj.ingameUrl,
      type: "GET",
      data: {
        component: 'allianceclassselection',
        action: 'fetchDataAboutCurrentAllianceClass',
        ajax: 1,
        asJson: 1
      },
      dataType: "json",
      error: function (error) {
        promptUserForAllianceClassChange(newClassName, upgradeItemAjax, questionType, price);
      },
      success: function (data) {
        promptUserForAllianceClassChange(newClassName, upgradeItemAjax, questionType, price, data);
      }
    });
  }
}

function promptUserForAllianceClassChange(newClassName, upgradeItemAjax, questionType, price, response) {
  activatingItem = false;

  if (response.userDoesNotHaveAlliance) {
    return 0;
  }

  let localizationString = LocalizationStrings.allianceClassItem[questionType];
  localizationString = localizationString.replace('#allianceClassName#', newClassName);

  if (questionType === 'buyAndActivateItemQuestion') {
    localizationString = localizationString.replace('#darkmatter#', tsdpkt(price));
  }

  if (response && response.currentAllianceClass && response.dateOfLastAllianceClassChange) {
    localizationString += LocalizationStrings.allianceClassItem.appendCurrentClassQuestion;
    localizationString = localizationString.replace('#currentAllianceClassName#', response.currentAllianceClass);
    localizationString = localizationString.replace('#lastAllianceClassChange#', response.dateOfLastAllianceClassChange);
  }

  errorBoxDecision(LocalizationStrings.notice, localizationString, LocalizationStrings.yes, LocalizationStrings.no, upgradeItemAjax);
}