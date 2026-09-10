

function openBuyResourceDialog(buyResourceDialogLink) {
  openOverlay(buyResourceDialogLink, {
    'class': "buyResourceDialog"
  });
}

function abortBuyResource() {
  $('.overlaydiv .abort_button').on('click', function () {
    $('.overlaydiv').dialog('close');
  });
}

function initBuyResources() {
  refreshBars('bar_container', 'filllevel_bar');
  $('.fill_resource').on('click', '.fillup', onChangeToPremium).on('click', '.btn_premium', submitBuyRequest);
  $('.fillup').on('keyup', '.resource_name input', handleInputForResourcePackages);
  initThousandSeparator();
}