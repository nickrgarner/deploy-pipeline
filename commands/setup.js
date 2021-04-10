const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const os = require("os");

const scpSync = require("../lib/scp");
const sshSync = require("../lib/ssh");

exports.command = "setup";
exports.desc = "Provision and configure the Jenkins server";
exports.builder = (yargs) => {
  yargs.options({
    privateKey: {
      describe: "Install the provided private key on the configuration server",
      type: "string",
    },
  });
};

exports.handler = async (argv) => {
  const { privateKey } = argv;

  (async () => {
    await run(privateKey);
  })();
};

async function run(privateKey) {
  console.log(chalk.greenBright("Installing config-srv server!"));

  console.log(chalk.blueBright("Downloading focal image..."));
  let result = child.spawnSync(
    `bakerx`,
    `pull focal cloud-images.ubuntu.com`.split(" "),
    {
      shell: true,
      stdio: "inherit",
    }
  );
  if (result.error) {
    printError(result);
  }

  console.log(chalk.blueBright("Provisioning config-srv server..."));
  result = child.spawnSync(
    `bakerx`,
    `run config-srv focal --ip 192.168.33.20 --memory=2048 --cpus=6 --sync`.split(" "),
    {
      shell: true,
      stdio: "inherit",
    }
  );
  if (result.error) {
    printError(result);
  }

  console.log(chalk.blueBright("Running init script..."));
  result = sshSync("/bakerx/cm/server-init.sh", "vagrant@192.168.33.20");
  if (result.error) {
    printError(result);
  }
}

function printError(result) {
  console.log(result.error);
  process.exit(result.status);
}
