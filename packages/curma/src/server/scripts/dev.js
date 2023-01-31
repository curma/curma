const port = "?port?";

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

const requireWaitMap = {};
let requireId = 0;

window.require = (name) => {
  console.log("[curma] require", name);
  return new Promise((resolve) => {
    requireWaitMap[requireId] = e => eval(e);
    ws.send(JSON.stringify({
      type: "require",
      name: name,
      id: requireId++
    }));
  })
}

// on receive message
ws.onmessage = data => {
  data = data.data;
  if (data === "reload") {
    console.debug("[curma] reload");
    location.reload();
  }
  data = JSON.parse(data);
  if (data.type === "require") {
    requireWaitMap[data.id](data.data);
  }
}