
/**
 * Save the current sort order to the cookie
 *
 * @param string destination
 */
function saveImperiumOrder(destination, isMoon) {
  var typeName = "impSortOrder";

  if (isMoon) {
    typeName = "impSortOrderMoon";
  }

  $.ajax({
    url: saveUrl,
    method: "post",
    dataType: "json",
    data: {
      ajax: 1,
      type: typeName,
      planets: $(destination).sortable('toArray')
    }
  });
}
/**
 * Reset the current sort order
 *
 */


function clearImperiumOrder() {
  $.ajax({
    url: saveUrl,
    method: "post",
    dataType: "json",
    data: {
      ajax: 1,
      type: 'reset'
    },
    success: function (data) {
      if (!data.error) {
        location.reload();
      }
    }
  });
}