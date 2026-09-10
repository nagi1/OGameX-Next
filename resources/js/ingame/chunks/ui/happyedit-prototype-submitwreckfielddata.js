

HappyEdit.prototype.submitWreckfieldData = function (formData) {
  this.loadingIndicator.show();
  $.post(this.urlSubmitWreckfield, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
}; //
// Tab: Rewards
//


HappyEdit.prototype.onClickSaveRewardsData = function (e) {
  e.preventDefault();

  if (!e.currentTarget.hasAttribute("disabled")) {
    this.submitRewardsData($('#rewardsSettings').serializeArray());
  }
};

HappyEdit.prototype.submitRewardsData = function (formData) {
  this.loadingIndicator.show();
  $.post(this.urlSubmitRewards, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};