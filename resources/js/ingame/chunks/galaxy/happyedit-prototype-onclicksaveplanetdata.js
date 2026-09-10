 //
// Tab: Planet
//


HappyEdit.prototype.onClickSavePlanetData = function (e) {
  e.preventDefault();

  if (!e.currentTarget.hasAttribute("disabled")) {
    this.submitPlanetData($('#planetSettings').serializeArray());
  }
};

HappyEdit.prototype.submitPlanetData = function (formData) {
  this.loadingIndicator.show();
  $.post(this.urlSubmitPlanet, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};