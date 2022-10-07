var liveServer = require("live-server");

var params = {
  port: 8080, // Set the server port. Defaults to 8080.
  root: "./", // Set root directory that's being served. Defaults to cwd.
};

liveServer.start(params);
