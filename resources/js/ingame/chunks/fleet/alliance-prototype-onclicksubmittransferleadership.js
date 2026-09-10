

Alliance.prototype.onClickSubmitTransferLeadership = function (e) {
  e.preventDefault();
  let newLeaderId = $('#assignally #newLeaderId').val();
  let params = {
    newLeaderId: newLeaderId,
    _token: this.token
  };
  let that = this;
  this.loadingIndicator.show();
  errorBoxDecision(this.loca.LOCA_ALL_NETWORK_ATTENTION, this.loca.LOCA_NETWORK_ALLY_TAKEOVER_ARE_YOU_SURE, this.loca.LOCA_ALL_YES, this.loca.LOCA_ALL_NO, function () {
    $.post(this.urlTransferLeadership, params, that.handleResponse.bind(that)).done(that.onAjaxDone.bind(that));
  }, function () {
    that.loadingIndicator.hide();
  });
};

Alliance.prototype.onClickSubmitTakeoverLeadership = function (e) {
  e.preventDefault();
  let params = {
    _token: this.token
  };
  let that = this;
  this.loadingIndicator.show();
  errorBoxDecision(this.loca.LOCA_ALL_NETWORK_ATTENTION, this.loca.LOCA_ALLY_TAKEOVER_QUESTION, this.loca.LOCA_ALL_YES, this.loca.LOCA_ALL_NO, function () {
    $.post(this.urlTakeoverLeadership, params, that.handleResponse.bind(that)).done(that.onAjaxDone.bind(that));
  }, function () {
    that.loadingIndicator.hide();
  });
};