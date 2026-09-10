

HappyEdit.prototype.handleSubmitResponse = function (response) {
  let data = JSON.parse(response);
  let status = data.status || 'failure';

  if (status === 'success') {
    this.fetchData(this.tab);
    fadeBox(data.message, false);
    getAjaxEventbox();
    getAjaxResourcebox();
  } else {
    this.displayErrors(data.errors);
  }
};