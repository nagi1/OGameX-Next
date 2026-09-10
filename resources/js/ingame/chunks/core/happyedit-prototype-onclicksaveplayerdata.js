 //
// Tab: player
//


HappyEdit.prototype.onClickSavePlayerData = function (e) {
  e.preventDefault();

  if (!e.currentTarget.hasAttribute("disabled")) {
    this.submitPlayerData($('#playerSettings').serializeArray());
  }
};

HappyEdit.prototype.triggerNews = function (e) {
  e.preventDefault();
  $.post(this.urlTriggerNews, {}, this.handleSubmitResponse.bind(this));
};