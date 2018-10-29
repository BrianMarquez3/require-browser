const http = require("http");
const ora = require("ora");
const chalk = require("chalk");
const createServer = require("fs-remote/createServer");
const makeClientBundle = require("./makeClientBundle");
const serveJs = require("./serveJs");
const argv = require("yargs")
  .option("fs-port", {
    demandOption: true,
    default: 3001,
    describe: "Port to run the fs-remote server on",
    type: "number"
  })
  .option("http-port", {
    demandOption: true,
    default: 3002,
    describe: "Port to host the require-browser.js file from",
    type: "number"
  }).argv;

const { fsPort, httpPort } = argv;

async function main() {
  const clientSpinner = ora("Preparing client bundle...").start();
  let clientCode;
  try {
    clientCode = await makeClientBundle({ fsPort });
  } catch (err) {
    clientSpinner.fail();
    throw err;
  }
  clientSpinner.succeed("Prepared client bundle");

  const fsServerSpinner = ora("Starting filesystem server...").start();
  try {
    const fsServer = createServer();

    await new Promise(resolve => {
      fsServer.listen(fsPort, resolve);
    });
  } catch (err) {
    fsServerSpinner.fail();
    throw err;
  }
  fsServerSpinner.succeed("Started filesystem server");

  const httpServerSpinner = ora("Starting HTTP server...").start();
  try {
    const fileServer = http.createServer(serveJs(clientCode));

    await new Promise(resolve => {
      fileServer.listen(httpPort, resolve);
    });
  } catch (err) {
    httpServerSpinner.fail();
    throw err;
  }
  httpServerSpinner.succeed("Started HTTP server");

  console.log(chalk.green("\nrequire-browser server is up and running!\n"));
  console.log("Add the following script tag to your page:");
  console.log(
    chalk`\n<{blue script src}={yellow "http://localhost:${httpPort}/require-browser.js"}></{blue script}>\n`
  );
  console.log(
    chalk`Then use the new global {magenta require} function to load files on your computer:`
  );
  console.log(chalk`\n{blue require}({yellow "./file.js"});\n`);
}

main().catch(err => {
  console.error(chalk.red(err.stack));
  process.exit(1);
});