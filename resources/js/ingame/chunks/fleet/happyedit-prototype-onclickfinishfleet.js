 //
// Tab: Fleet
//


HappyEdit.prototype.onClickFinishFleet = function (e) {
  e.preventDefault();
  this.submitFinishFleet($(e.target).attr('data-fleet-id'));
};

HappyEdit.prototype.submitFinishFleet = function (id) {
  this.loadingIndicator.show();
  $.post(this.urlSubmitFleet, {
    fleetId: id
  }, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};