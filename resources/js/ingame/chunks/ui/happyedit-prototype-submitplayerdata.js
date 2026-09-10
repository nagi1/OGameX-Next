

HappyEdit.prototype.submitPlayerData = function (formData) {
  this.loadingIndicator.show();
  $.post(this.urlSubmitPlayer, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
}; //
// Tab: Buildings
//


HappyEdit.prototype.onClickSaveBuildingsData = function (e) {
  e.preventDefault();
  let allBuilding = $('[name="allBuildings"]').val();

  if (allBuilding.length === 0) {
    let formData = $('#buildingsSettings').serializeArray().filter(function (obj) {
      return obj.name !== 'allBuildings';
    });
    this.submitBuildingsData(formData);
  } else {
    this.submitBuildingsData({
      allBuildings: allBuilding
    });
  }
};

HappyEdit.prototype.submitBuildingsData = function (formData) {
  this.loadingIndicator.show();
  $.post(this.urlSubmitBuildings, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};