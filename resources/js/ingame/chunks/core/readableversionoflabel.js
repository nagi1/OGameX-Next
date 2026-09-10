
/**
 *
 * @param labelObject object
 * @param useCount int
 * @returns string
 */


function readableVersionOfLabel(labelObject, useCount) {
  labelObject.location = -0.05 * useCount + 0.85;
  var split = labelObject.label.indexOf('/');

  if (split) {//        label = label.substring(0,split) + '<br/>/<br/>' + label.substring(split + 1);
  }

  return labelObject;
}
/**
 * check single line of the matrix if a line could be drawn. does not check start or end of the line
 * @param coordinates array containing the positions of the endpoints
 * @param sourceLeft int x-coordinate of the source
 * @param sourceTop int y-coordinate of the source
 * @param targetLeft int x-coordinate of the target
 * @param targetTop int y-coordinate of the target
 * @return bool if the path is blocked by an element
 */


function lineInCoordinatesBlocked(coordinates, sourceLeft, sourceTop, targetLeft, targetTop) {
  if (sourceLeft == targetLeft) {
    // check column (target is above. every time!)
    for (var i in coordinates) {
      if (coordinates[i].left == sourceLeft && sourceTop > coordinates[i].top && targetTop < coordinates[i].top) {
        return true;
      }
    }
  } else if (sourceTop == targetTop && sourceLeft > targetLeft) {
    // check row to the left
    for (var j in coordinates) {
      if (coordinates[j].top == sourceTop && sourceLeft > coordinates[j].left && targetLeft < coordinates[j].left) {
        return true;
      }
    }
  } else if (sourceTop == targetTop && sourceLeft < targetLeft) {
    // check row to the right
    for (var k in coordinates) {
      if (coordinates[k].top == sourceTop && sourceLeft < coordinates[k].left && targetLeft > coordinates[k].left) {
        return true;
      }
    }
  }

  return false;
}
/**
 * check if a single spot in the coordinates array is blocked by an element. used for edges of the connection line
 * @param coordinates the coordinates matrix data
 * @param left x-coordinate to check
 * @param top y-coordinate to check
 * @returns {boolean}
 */


function positionInCoordinatesBlocked(coordinates, left, top) {
  for (var i in coordinates) {
    if (coordinates[i].left == left && coordinates[i].top == top) {
      return true;
    }
  }

  return false;
}
var javascriptAvailable = true;
var days = new Array('Mon', 'Tus', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun');
var months = new Array("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");