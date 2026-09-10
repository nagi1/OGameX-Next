 //
// Tab: Research
//


HappyEdit.prototype.onClickSaveResearchData = function (e) {
  e.preventDefault();
  let allResearches = $('[name="allResearches"]').val();

  if (allResearches.length === 0) {
    let formData = $('#researchSettings').serializeArray().filter(function (obj) {
      return obj.name !== 'allResearches';
    });
    this.submitResearchData(formData);
  } else {
    this.submitResearchData({
      allResearches: allResearches
    });
  }
};

HappyEdit.prototype.submitResearchData = function (formData) {
  this.loadingIndicator.show();
  $.post(this.urlSubmitResearch, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};