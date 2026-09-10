

HappyEdit.prototype.fetchData = function (tab) {
  this.loadingIndicator.show();
  $.getJSON(this.tabs[tab], {}, this.onFetch.bind(this)).done(this.onAjaxDone.bind(this));
};