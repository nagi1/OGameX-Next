

function reallySubmitBuyRequest($btn, userInputAmounts) {
  let costs = $btn.data('premiumCosts'),
      itemuuid = $btn.data('itemuuid');
  $.ajax({
    url: buyResourcesLink,
    data: {
      itemUuid: itemuuid,
      costs: costs,
      _token: token,
      userInputAmounts: userInputAmounts
    },
    type: "POST",
    dataType: "json",
    success: function (dataFromBuy) {
      token = dataFromBuy.newAjaxToken;

      if (dataFromBuy.status === 'failure') {
        let error = dataFromBuy.errors[0] || undefined;

        if (error && error.message) {
          fadeBox(error.message, true);
        } else {
          fadeBox(loca["error"], true);
        }

        return;
      } else {
        window.location.reload();
      }
    },
    error: function () {}
  });
}

function handleInputForResourcePackages(e) {
  let regex;

  if (LocalizationStrings.thousandSeperator === '.') {
    regex = new RegExp('\\' + LocalizationStrings.thousandSeperator, 'g');
  } else {
    regex = new RegExp(LocalizationStrings.thousandSeperator, 'g');
  }

  let $input = $(e.target),
      val = parseInt($input.val().replace(regex, '')) || 0,
      original = $input.data('original'),
      modified = false;

  if (e.which !== 75 && e.which >= 65 && e.which <= 90) {
    // prevent a-z. "k" is handled before.
    val = 0;
    modified = true;
  }

  if (val > original) {
    val = original;
    modified = true;
  }

  if (modified === true) {
    $input.val(tsdpkt(val));
  }

  updateCostsAfterUserModification($input);
}