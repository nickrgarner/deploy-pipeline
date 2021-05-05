const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const axios = require('axios');
const sshSync = require("../lib/ssh");
const fs = require("fs");
const VBox = require('../lib/VBoxManage');
const sampleEventBody = require('../sample-canary-event.json');

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
  fs.writeFileSync(path.join(__dirname, "../lib/ip.txt"), ip);

  result = sshSync(`/bakerx/cm/canary-load-balancer.sh`, "vagrant@192.168.33.29");
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

  const testResults = await generateTestTraffic();
  generateTestReport(testResults);
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

async function generateTestTraffic() {
  // Generate traffic to base instance
  const baseResults = [];
  let interval;
  console.log(chalk.greenBright('Executing canary analysis of base branch...'));
  await new Promise((resolve) => {
    const time = new Date();
    interval = setInterval(async () => {
      if ((new Date() - time) >= 60000) {
        resolve();
      } else {
        try {
          const result = await axios.post('http://192.168.33.29:3030/preview', sampleEventBody);
          baseResults.push(result);
        } catch {
          baseResults.push({status: 500})
        }
      }
    }, 1000);
  });
  clearInterval(interval);

  // Generate traffic to compare instance
  const compareResults = [];
  console.log(chalk.greenBright('Executing canary analysis of compare branch...'));
  await new Promise((resolve) => {
    const time = new Date();
    interval = setInterval(async () => {
      if ((new Date() - time) >= 60000) {
        resolve();
      } else {
        try {
          const result = await axios.post('http://192.168.33.29:3030/preview', sampleEventBody, { headers: { 'canary-instance': 'compare' } });
          compareResults.push(result);
        } catch {
          compareResults.push({status: 500})
        }
      }
    }, 1000);
  });
  clearInterval(interval);

  // Return results
  return {
    base: baseResults,
    compare: compareResults
  }
}

function generateTestReport({base, compare}) {
  const baseSuccessRate = base.filter(response => {
    return response.status === 200;
  }).length / base.length * 100;

  const compareSuccessRate = compare.filter(response => {
    return response.status === 200;
  }).length / compare.length * 100;

  console.log(chalk.greenBright(`Success rate for base branch: ${baseSuccessRate.toFixed(2)}% of requests over 60 seconds succeeded`));
  console.log(chalk.greenBright(`Success rate for base branch: ${compareSuccessRate.toFixed(2)}% of requests over 60 seconds succeeded`));

  if (baseSuccessRate - compareSuccessRate > 10) {
    console.log(chalk.redBright('Canary Failed'));
  } else {
    console.log(chalk.greenBright('Canary Passed!'))
  }
}

