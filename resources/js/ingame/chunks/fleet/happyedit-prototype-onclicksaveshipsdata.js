 //
// Tab: Ships
//


HappyEdit.prototype.onClickSaveShipsData = function (e) {
  e.preventDefault();
  let allShips = $('[name="allShips"]').val();

  if (allShips.length === 0) {
    let formData = $('#shipsSettings').serializeArray().filter(function (obj) {
      return obj.name !== 'allShips';
    });
    this.submitShipsData(formData);
  } else {
    this.submitShipsData({
      allShips: allShips
    });
  }
};

HappyEdit.prototype.submitShipsData = function (formData) {
  this.loadingIndicator.show();
  $.post(this.urlSubmitShips, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};