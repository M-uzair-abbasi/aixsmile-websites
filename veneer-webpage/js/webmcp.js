// WebMCP: offers the practice's read-only agent tools to an AI agent running in the
// visitor's browser. No-op unless the browser exposes the model-context API.
// Tools are listed from and executed on https://aixsmile.de/mcp/ (CORS-open, read-only).
(function () {
  var mc = document.modelContext || navigator.modelContext;
  if (!mc || !mc.registerTool) return;
  var MCP = 'https://aixsmile.de/mcp/';
  function rpc(method, params) {
    return fetch(MCP, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: Date.now(), method: method, params: params })
    }).then(function (r) { return r.json(); }).then(function (j) {
      if (j.error) throw new Error(j.error.message);
      return j.result;
    });
  }
  rpc('tools/list').then(function (res) {
    return (res.tools || []).reduce(function (p, t) {
      return p.then(function () {
        return mc.registerTool({
          name: t.name, title: t.title, description: t.description,
          inputSchema: t.inputSchema, annotations: t.annotations,
          execute: function (args) { return rpc('tools/call', { name: t.name, arguments: args || {} }); }
        });
      });
    }, Promise.resolve());
  }).catch(function () { /* optional — never break the page */ });
})();
