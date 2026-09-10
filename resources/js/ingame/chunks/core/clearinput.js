

function clearInput(id) {
  $(id).val("");
}

function checkIntInput(id, minVal, maxVal) {
  var value = $(id).val();

  if (typeof value != "undefined" && value != "") {
    intVal = Math.abs(getValue(value));

    if (maxVal != null) {
      intVal = Math.min(intVal, maxVal);
    }

    $(id).val(intVal);
  }
}

function clampInt(val, minVal, maxVal, allowEmpty) {
  if (allowEmpty && (val === '' || val === 0)) {
    return '';
  }

  let intVal = parseInt(val);

  if (isNaN(intVal)) {
    return minVal;
  }

  intVal = Math.min(intVal, maxVal);
  intVal = Math.max(intVal, minVal);
  return intVal;
}

function clampFloat(val, minVal, maxVal) {
  let floatVal = parseFloat(val);

  if (isNaN(floatVal)) {
    return minVal;
  }

  floatVal = Math.max(floatVal, minVal);
  floatVal = Math.min(floatVal, maxVal);
  return floatVal;
}