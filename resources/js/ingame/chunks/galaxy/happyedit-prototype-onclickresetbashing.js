

HappyEdit.prototype.onClickResetBashing = function (e) {
  e.preventDefault();
  let galaxy,
      system,
      position = 0;
  galaxy = document.getElementById('bashingGalaxy').value ?? -1;
  system = document.getElementById('bashingSystem').value ?? -1;
  position = document.getElementById('bashingPosition').value ?? -1;
  $.post($(e.currentTarget).data('link'), {
    "galaxy": galaxy,
    "system": system,
    "position": position
  }, this.handleSubmitResponse.bind(this));
};