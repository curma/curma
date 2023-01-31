const port = "?port?";

window.process = {
  env: {
    NODE_ENV: "development"
  }
}
window.__VUE_PROD_DEVTOOLS__ = false

const ws = new WebSocket(`ws://localhost:${port}/curma-ws-client`);
ws.onopen = () => {
  console.debug("[curma] connected");
}
// on lost connection
ws.onclose = () => {
  console.debug("[curma] lost connection");
  // try to reconnect
  const reconnect = () => {
    const ws = new WebSocket(`ws://localhost:${port}/curma-ws-client`);
    ws.onopen = () => {
      console.debug("[curma] reconnected");
      location.reload();
    }
    // if failed
    ws.onclose = reconnect
  }
  reconnect()
}

window.require = (path, name) => {
  console.log("[curma] require", name);
  const res = req_request(path, name);
  // is json?
  try {
    return JSON.parse(res);
  } catch (e) {
    return res;
  }
}

function req_request(path, name) {
  const url = `/curma-require?path=${path}&name=${name}`;
  const xhr = new XMLHttpRequest();
  xhr.open("GET", url, false);
  xhr.send();
  return xhr.responseText;
}

// on receive message
ws.onmessage = data => {
  data = data.data;
  if (data === "reload") {
    console.debug("[curma] reload");
    location.reload();
  }
}