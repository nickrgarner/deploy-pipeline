const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const scpSync = require("../lib/scp");
const sshSync = require("../lib/ssh");

exports.command = "deploy [app]";
exports.desc = "Install dependencies and deploy app on given inventory";
exports.builder = (yargs) => {
  yargs.positional("app", {
    describe: "Name of the app to deploy",
  });
  yargs.option("inventory", {
    alias: "i",
    type: "string",
    description: "Filepath to ansible inventory",
  });
};

exports.handler = async (argv) => {
  const { app, inventory: inventoryPath } = argv;
  (async () => {
    await run(app, inventoryPath);
  })();
};

async function run(app, inventoryPath) {
  console.log(chalk.greenBright(`Installing dependencies for ${app}...`));
  let result = sshSync(
    `ansible-playbook ${app}_config -i ${inventoryPath}`,
    "vagrant@192.168.33.20",
  );
  if (result.error) {
    printError(result);
  }
}

function printError(result) {
  console.log(result.error);
  process.exit(result.status);
}
