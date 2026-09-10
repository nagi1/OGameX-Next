

function findClassName(classArr, id) {
  return classArr[id] ?? classArr[0];
}

function findClassId(classArr, name) {
  return Math.max(0, classArr.indexOf(name));
}