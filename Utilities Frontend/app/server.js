const express = require("express");
const app = express();
const port = 8082;

app.use(express.static("dist"));

app.get("dist/node_modules/*", (req, res) => {
  // strip the /dist from the url
  res.sendFile(__dirname + req.url.replace("/dist", ""));
});

app.get("*", (req, res) => {
  res.sendFile(__dirname + "/dist/index.html");
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
