 // Lifeform


HappyEdit.prototype.submitDiscoverData = function (e) {
  //this.loadingIndicator.show()
  let targetUrl = $(e.currentTarget).data('link');
  let lfId = $(e.currentTarget).data('id');
  let data = {
    lifeformId: lfId
  };
  $.post(targetUrl, data, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

HappyEdit.prototype.onClickSaveLifeformData = function (e) {
  e.preventDefault();

  if (!e.currentTarget.hasAttribute("disabled")) {
    let formData = $('#lifeformSettings').serializeArray();
    this.loadingIndicator.show();
    let targetUrl = $(e.currentTarget).data('link');
    $.post(targetUrl, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
  }
};

HappyEdit.prototype.onClickSaveLifeformBuildingData = function (e) {
  e.preventDefault();

  if (!e.currentTarget.hasAttribute("disabled")) {
    let formData = $('#lifeformBuilding').serializeArray();
    this.loadingIndicator.show();
    let targetUrl = $(e.currentTarget).data('link');
    $.post(targetUrl, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
  }
};