 //
// Tab: Event handler
//


HappyEdit.prototype.onClickRestartEventHandler = function (e) {
  e.preventDefault();
  $.post(this.urlRestartEventHandler, {}, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};