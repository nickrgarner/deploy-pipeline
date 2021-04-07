const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const os = require("os");

const scpSync = require("../lib/scp");
const sshSync = require("../lib/ssh");
const mtfuzz = require("./lib/driver").mtfuzz;
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
    await runs(count, ghuser, ghpass);
  })();
};

async function run(count, ghuser, ghpass) {
  console.log(chalk.blueBright("Cloning iTrust2 repository..."));
  let result = sshSync(
    `git clone https://${ghuser}:${ghpass}@github.ncsu.edu/engr-csc326-staff/iTrust2-v8`,
    "vagrant@192.168.33.10",
  );
  if (result.error) {
    printError(result);
  }

  console.log(chalk.blueBright(`Fuzzing iTrust2 with ${count} mutations...`));
  let result = sshSync(``);
}

// Code under test...
const marqdown = require("./test/marqdown");

// Seed inputs
let mdA = fs.readFileSync("test/test.md", "utf-8");
let mdB = fs.readFileSync("test/simple.md", "utf-8");

let args = process.argv.slice(2);
const runs = args.length > 0 ? args[0] : 1000;

// Fuzz function 1000 (or given) times, with given seed string inputs.
mtfuzz(runs, [mdA, mdB], (md) => marqdown.render(md));

function printError(result) {
  console.log(result.error);
  process.exit(result.status);
}
