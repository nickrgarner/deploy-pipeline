const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const scpSync = require("../lib/scp");
const sshSync = require("../lib/ssh");
const got = require("got");
const fs = require("fs");
const VBox = require('../lib/VBoxManage');

exports.command = "canary [base] [compare]";
exports.desc = "Generate canary score and report";
exports.builder = (yargs) => {
  yargs.positional("base", {
    describe: "Name of the base branch",
  });
  yargs.positional("compare", {
    describe: "Name of the branch to compare",
  });
};

exports.handler = async (argv) => {
  const { base, compare } = argv;
  (async () => {
    await run(base, compare);
  })();
};

async function run(base, compare) {
  console.log(chalk.greenBright("Spinning up Canary VM..."));
  result = child.spawnSync(
    `bakerx`,
    `run canary queues --ip 192.168.33.29 --sync`.split(" "),
    {
      shell: true,
      stdio: "inherit",
    }
  );
  if (result.error) {
    printError(result);
  }
  let ip = getIPAddress();
  console.log(chalk.greenBright(`Setting host network as ${ip}...`));
  fs.writeFileSync(path.join(__dirname, "../lib/dashboard/metrics/ip.txt"), ip);

  result = sshSync(`/bakerx/cm/canary-load-balancer.sh`, "vagrant@192.168.33.29");
  if (result.error) {
    printError(result);
  }

  result = sshSync(`/bakerx/cm/canary-monitoring-dashboard.sh`, "vagrant@192.168.33.29");
  if (result.error) {
    printError(result);
  }

  console.log(chalk.greenBright("Spinning up Base VM..."));
  result = child.spawnSync(
    `bakerx`,
    `run base focal --ip 192.168.33.28 --sync`.split(" "),
    {
      shell: true,
      stdio: "inherit",
    }
  );
  if (result.error) {
    printError(result);
  }
  VBox.execute('controlvm', 'base natpf1 "service,tcp,,9001,,3000"').catch( e => e );

  result = sshSync(`/bakerx/cm/canary-instance-setup.sh -b ${base}`, "vagrant@192.168.33.28");
  if (result.error) {
    printError(result);
  }

  result = sshSync(`/bakerx/cm/canary-monitoring-agent.sh -b ${base}`, "vagrant@192.168.33.28");
  if (result.error) {
    printError(result);
  }

  console.log(chalk.greenBright("Spinning up Compare VM..."));
  result = child.spawnSync(
    `bakerx`,
    `run compare focal --ip 192.168.33.27 --sync`.split(" "),
    {
      shell: true,
      stdio: "inherit",
    }
  );
  if (result.error) {
    printError(result);
  }
  VBox.execute('controlvm', 'compare natpf1 "service,tcp,,9002,,3000"').catch( e => e );

  result = sshSync(`/bakerx/cm/canary-instance-setup.sh -b ${compare}`, "vagrant@192.168.33.27");
  if (result.error) {
    printError(result);
  }

  result = sshSync(`/bakerx/cm/canary-monitoring-agent.sh -b ${compare}`, "vagrant@192.168.33.27");
  if (result.error) {
    printError(result);
  }
}

function printError(result) {
  console.log(result.error);
  process.exit(result.status);
}

function getIPAddress() {
  var interfaces = require('os').networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];

    for (var i = 0; i < iface.length; i++) {
      var alias = iface[i];
      if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal)
        return alias.address;
    }
  }

  return '0.0.0.0';
}

