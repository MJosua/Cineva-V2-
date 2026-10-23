function startServer(server, port, App) {
  server.listen(port, () => {
    console.log(`INTEGRATED API SSL Server running on port ${port}`);

    try {
      const { startCLI } = require('../script/testing-utils');
      startCLI(App);
    } catch (e) {
      console.log('Testing CLI not loaded:', e.message);
    }
  });
}

module.exports = {
  startServer,
};
