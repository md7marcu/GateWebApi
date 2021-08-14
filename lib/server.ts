import server from "./app";

const PORT = 3008;
server.listen(PORT, () => {console.log("Express server listening on portt " + PORT); });
