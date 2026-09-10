
$(function () {
  $('.slideIn').on('click', function () {
    loadDetails($(this).data('type'));
  });
  $('#detail').on('click', '.close_details', function () {
    $('#detail').hide();
  });
});
var textDestination = [];
textDestination[0] = "diameterField";
textDestination[1] = "diameterContentField";
textDestination[2] = "temperatureField";
textDestination[3] = "temperatureContentField";
textDestination[4] = "positionField";
textDestination[5] = "positionContentField";
textDestination[6] = "scoreField";
textDestination[7] = "scoreContentField";
textDestination[8] = "honorField";
textDestination[9] = "honorContentField";

function type() {
  if (animatedOverview) {
    var destination = document.getElementById(textDestination[currentIndex]);

    if (destination) {
      if (textContent[currentIndex].substr(currentChar, 1) == "<" && linetwo != 1) {
        while (textContent[currentIndex].substr(currentChar, 1) != ">") {
          currentChar++;
        }
      }

      if (linetwo == 1) {
        destination.innerHTML = textContent[currentIndex];
        currentChar = destination.innerHTML = textContent[currentIndex].length + 1;
      } else {
        destination.innerHTML = textContent[currentIndex].substr(0, currentChar) + "_";
        currentChar++;
      }

      if (currentChar > textContent[currentIndex].length) {
        destination.innerHTML = textContent[currentIndex];
        currentIndex++;
        currentChar = 0;

        if (currentIndex < textContent.length) {
          type();
        }
      } else {
        setTimeout("type()", 15);
      }
    }
  } else {
    for (var i = 0; i < textDestination.length; i++) {
      document.getElementById(textDestination[i]).innerHTML = textContent[i];
    }
  }
}

function initType() {
  type();
}