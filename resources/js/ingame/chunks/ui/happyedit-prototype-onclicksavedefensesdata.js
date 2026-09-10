 //
// Tab: Defenses
//


HappyEdit.prototype.onClickSaveDefensesData = function (e) {
  e.preventDefault();
  let allDefense = $('[name="allDefense"]').val();

  if (allDefense.length === 0) {
    let formData = $('#defenseSettings').serializeArray().filter(function (obj) {
      return obj.name !== 'allDefense';
    });
    this.submitDefensesData(formData);
  } else {
    this.submitDefensesData({
      allDefense: allDefense
    });
  }
};

HappyEdit.prototype.submitDefensesData = function (formData) {
  this.loadingIndicator.show();
  $.post(this.urlSubmitDefense, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};