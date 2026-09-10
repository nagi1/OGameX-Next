

HappyEdit.prototype.onClickSelectResearch = function (e) {
  e.preventDefault();
  let elemName = $(e.currentTarget).attr('name');
  let selectedElem = $("#lfresearch input[name='" + elemName + "']:checked");
  let previousTechId = selectedElem.data('techid');
  let currentTechId = $(e.currentTarget).data('techid');
  let previousLifeformId = selectedElem.data('lifeformid');
  let currentLifeformId = $(e.currentTarget).data('lifeformid');
  let slot = $(e.currentTarget).data('slot');
  let pic = $("#slotPic" + slot);

  if (currentLifeformId === 0) {
    $(".slotName" + slot).text('None');
    pic.removeClass("lifeformsprite").removeClass('queuePic').removeClass('lifeformTech' + previousTechId).addClass('lifeformTech0');
  } else if (previousLifeformId === 0 && currentLifeformId !== 0) {
    $(".slotName" + slot).text(lfResearch[slot][currentLifeformId].name);
    pic.removeClass("lifeformTech0").addClass('lifeformsprite').addClass('queuePic').addClass('lifeformTech' + currentTechId);
  } else {
    $(".slotName" + slot).text(lfResearch[slot][currentLifeformId].name);
    pic.removeClass("lifeformTech" + previousTechId).addClass('lifeformTech' + currentTechId);
  }
};

HappyEdit.prototype.onClickSelectAllResearch = function (e) {
  e.preventDefault();
  let lifeformId = $(e.currentTarget).data('lifeformid');
  let selectedElements = $("#lfresearch input[data-lifeformid='" + lifeformId + "']");
  selectedElements.each(function () {
    let elemName = $(this).attr('name');
    let selectedElem = $("#lfresearch input[name='" + elemName + "']:checked");
    let previousTechId = selectedElem.data('techid');
    let currentTechId = $(this).data('techid');
    let previousLifeformId = selectedElem.data('lifeformid');
    let currentLifeformId = $(this).data('lifeformid');
    let slot = $(this).data('slot');
    let pic = $("#slotPic" + slot);

    if (currentLifeformId === 0) {
      $(".slotName" + slot).text('None');
      pic.removeClass("lifeformsprite").removeClass('queuePic').removeClass('lifeformTech' + previousTechId).addClass('lifeformTech0');
    } else if (previousLifeformId === 0 && currentLifeformId !== 0) {
      $(".slotName" + slot).text(lfResearch[slot][currentLifeformId].name);
      pic.removeClass("lifeformTech0").addClass('lifeformsprite').addClass('queuePic').addClass('lifeformTech' + currentTechId);
    } else {
      $(".slotName" + slot).text(lfResearch[slot][currentLifeformId].name);
      pic.removeClass("lifeformTech" + previousTechId).addClass('lifeformTech' + currentTechId);
    }

    $(this).prop('checked', true);
  });
};

HappyEdit.prototype.onClickSaveLifeformResearchData = function (e) {
  e.preventDefault();

  if (!e.currentTarget.hasAttribute("disabled")) {
    let formData = $('#lifeformResearch').serializeArray();
    this.loadingIndicator.show();
    let targetUrl = $(e.currentTarget).data('link');
    $.post(targetUrl, formData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
  }
};