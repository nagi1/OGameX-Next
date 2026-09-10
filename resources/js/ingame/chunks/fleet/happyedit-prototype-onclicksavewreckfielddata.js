 //
// Tab: Wreckfield
//


HappyEdit.prototype.onClickSaveWreckfieldData = function (e) {
  e.preventDefault();
  let allShips = $('[name="allShips"]').val();

  if (allShips.length === 0) {
    let formData = $('#wreckfieldSettings').serializeArray().filter(function (obj) {
      return obj.name !== 'allShips';
    });
    this.submitWreckfieldData(formData);
  } else {
    this.submitWreckfieldData({
      allShips: allShips
    });
  }
};