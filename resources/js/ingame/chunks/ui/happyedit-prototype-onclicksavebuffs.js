

HappyEdit.prototype.onClickSaveBuffs = function (e) {
  e.preventDefault();
  this.loadingIndicator.show();

  if (e.target.value === 'all') {
    const updateData = {
      targets: [],
      buffAction: e.target.name === 'buffDeleteAll' ? 'delete' : 'update'
    };
    document.querySelectorAll('#buffEditForm .happyedit-buffs-buff').forEach(buff => {
      updateData.targets.push({
        id: buff.dataset.target,
        effectTime: buff.querySelector('input[data-type="buffEffectTime"]').value,
        cooldownTime: buff.querySelector('input[data-type="buffCooldownTime"]').value
      });
    });
    $.post(this.urlSubmitBuffs, updateData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
    return;
  }

  const updateData = {
    targets: [{
      id: e.target.value,
      effectTime: document.querySelector('#buffEditForm input[data-type="buffEffectTime"][data-target="' + e.target.value + '"]').value,
      cooldownTime: document.querySelector('#buffEditForm input[data-type="buffCooldownTime"][data-target="' + e.target.value + '"]').value
    }],
    buffAction: e.target.name === 'buffDelete' ? 'delete' : 'update'
  };
  $.post(this.urlSubmitBuffs, updateData, this.handleSubmitResponse.bind(this)).done(this.onAjaxDone.bind(this));
};

HappyEdit.prototype.onChangeBuffTime = function (e) {
  if (e.target.dataset.type === 'buffEffectTime') {
    const cooldownTarget = document.querySelector('#buffEditForm input[data-type="buffCooldownTime"][data-target="' + e.target.dataset.target + '"]');

    if (cooldownTarget.value < e.target.value) {
      cooldownTarget.value = e.target.value;
    }
  }
};