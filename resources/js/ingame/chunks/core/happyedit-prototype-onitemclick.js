

HappyEdit.prototype.onItemClick = function (e) {
  e.preventDefault();
  $.post($(e.currentTarget).data('link'), {}, this.handleSubmitResponse.bind(this));
};