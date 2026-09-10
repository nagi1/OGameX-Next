

function onChangeToPremium(e) {
  var $btn = $(e.currentTarget).find('.btn_blue'),
      $fillup = $btn.closest('.fillup'),
      $premiumBar = $btn.closest('.fill_resource_ctn').find('.premium_bar'); // reset

  $('.fillup').removeClass('premium').parent().find('.current_stock span').removeClass('premium_txt').each(function () {
    // color of the current amount of the selected resource
    var $this = $(this);
    $this.text($this.data('currentAmount')); // reset stock text to current amount
  });
  $('.fill_resource .btn_premium').html(loca.fillUpResource).attr('class', 'btn_blue');
  $('.premium_bar').css('width', '0%').data('premiumPercent', 0); // do not highlight disabled buttons

  if ($btn.attr('disabled') === 'disabled') {
    return;
  }

  updateBuyTextAndActivatePackage($btn, $fillup);
  $fillup.parent().find('.current_stock span').addClass('premium_txt') // color of the current amount of the selected resource
  .text($btn.data('newValueFormatted')); // set stock text to the amount the player will have after buying the package

  $premiumBar.data('premiumPercent', $btn.data('premiumPercent'));
  changeTooltip($premiumBar, '+' + tsdpkt(Math.floor($btn.data('premiumValue'))));
  refreshBars('bar_container', 'filllevel_bar', 'premium_bar');
}

function submitBuyRequest(event, confirmedProductionLoweredWarning) {
  let $btn = $(event.currentTarget),
      userInputAmounts = {},
      changed = false;

  if ($('.buy_resources.content_inner').hasClass('productionBasedPackages') && $btn.data('sufficientDarkMatter') === 0) {
    redirectBuyPremium();
    return;
  }

  if (typeof confirmedProductionLoweredWarning === 'undefined') {
    confirmedProductionLoweredWarning = false;
  } else {
    $btn = confirmedProductionLoweredWarning;
    confirmedProductionLoweredWarning = true;
  }

  let isCapped = parseInt($btn.data('isCapped')),
      productionLowered = parseInt($btn.data('productionLowered'));
  $btn.parents('.fillup').find('.resource_box').each(function () {
    let $elem = $(this);
    let resourceName = $elem.find('.resource_name > input').data('resourceType');
    let $input = $elem.find('.resource_name input');
    userInputAmounts[resourceName] = parseInt($input.val().split(LocalizationStrings.thousandSeperator).join(''));
    changed = changed || $input.data('original') !== userInputAmounts[resourceName];
  });

  if (changed === false) {
    userInputAmounts = {};
  }

  if (productionLowered && confirmedProductionLoweredWarning !== true) {
    errorBoxDecision(loca.buyNow, loca.warnProductionLowered, loca.yes, loca.no, function () {
      submitBuyRequest(event, $btn);
    });
    return;
  }

  if (isCapped === 1 && changed === false) {
    // this can only happen for production based packages
    errorBoxDecision(loca.buyNow, loca.warnCapped, loca.yes, loca.no, function () {
      reallySubmitBuyRequest($btn);
    });
    return;
  }

  reallySubmitBuyRequest($btn, userInputAmounts);
}