
function errorBoxAsArray(data) {
  if (data["type"] == "notify") {
    notifyBoxAsArray(data);
  } else if (data["type"] == "decision") {
    decisionBoxAsArray(data);
  } else if (data["type"] == "fadeBox") {
    fadeBox(data["text"], data["failed"]);
  }
}

function notifyBoxAsArray(data) {
  errorBoxNotify(data["title"], data["text"], data["buttonOk"], String(data["okFunction"]), data["removeOpen"], data["modal"]);
}