const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const os = require("os");

const scpSync = require("../lib/scp");
const sshSync = require("../lib/ssh");
const fs = require("fs");

exports.command = "useful-tests";
exports.desc = "Run mutation fuzzer on iTrust test suite";
exports.builder = (yargs) => {
  yargs.option("count", {
    alias: "c",
    description: "Number of test mutations",
    default: 1000,
  });
  yargs.option("ghuser", {
    alias: "gh-user",
    description: "NCSU Github Username",
    type: "string",
  });
  yargs.option("ghpass", {
    alias: "gh-pass",
    description: "NCSU Github Password",
    type: "string",
  });
  yargs.demandOption(
    ["gh-user", "gh-pass"],
    "Please provide NCSU Github credentials.",
  );
};
exports.handler = async (argv) => {
  const { count, ghuser, ghpass } = argv;

  (async () => {
    await run(count, ghuser, ghpass);
  })();
};

async function run(count, ghuser, ghpass) {
  console.log(chalk.blueBright("Cloning iTrust2 repository..."));
  let result = sshSync(`rm -rf /tmp/iTrust2-v8`, "vagrant@192.168.33.20");
  result = sshSync(
    `cd /tmp; git clone https://${ghuser}:${ghpass}@github.ncsu.edu/engr-csc326-staff/iTrust2-v8`,
    "vagrant@192.168.33.20",
  );
  if (result.error) {
    printError(result);
  }

  console.log(chalk.blueBright(`Fuzzing iTrust2 with ${count} mutations...`));
  result = sshSync(
    `node /bakerx/lib/driver ${count} /tmp/iTrust2-v8/iTrust2/src/main/java/edu/ncsu/csc/iTrust2`,
    "vagrant@192.168.33.20",
  );
  if (result.error) {
    printError(result);
  }
}
