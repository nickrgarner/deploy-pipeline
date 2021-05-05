const child = require("child_process");
const chalk = require("chalk");

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
  yargs.option("gh-user", {
    type: "string",
    description: "NCSU GitHub Username",
  });
  yargs.option("gh-pass", {
    type: "string",
    description: "NCSU GitHub Password",
  });
  yargs.demandOption(["gh-user", "gh-pass"], "Please provide NCSU Github credentials.");
};

exports.handler = async (argv) => {
  const { privateKey, "gh-user": ghUser, "gh-pass": ghPass } = argv;

  (async () => {
    await run({ privateKey, ghUser, ghPass });
  })();
};

async function run({ ghUser, ghPass }) {
  console.log(chalk.greenBright("Installing config-srv server!"));

  console.log(chalk.blueBright("Downloading focal image..."));
  let result = child.spawnSync(`bakerx`, `pull focal cloud-images.ubuntu.com`.split(" "), {
    shell: true,
    stdio: "inherit",
  });
  if (result.error) {
    printError(result);
  }

  console.log(chalk.blueBright("Provisioning config-srv server..."));
  result = child.spawnSync(
    `bakerx`,
    `run config-srv focal --ip 192.168.33.20 --memory=4096 --sync`.split(" "),
    {
      shell: true,
      stdio: "inherit",
    },
  );
  if (result.error) {
    printError(result);
  }

  console.log(chalk.blueBright("Running init script..."));
  result = sshSync(
    `/bakerx/cm/server-init.sh ${ghUser ? `-u ${ghUser}` : ""} ${ghPass ? `-p ${ghPass}` : ""}`,
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
