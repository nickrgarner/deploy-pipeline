const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const scpSync = require("../lib/scp");
const sshSync = require("../lib/ssh");

let jenkins;

exports.command = "build [job]";
exports.desc = "Trigger a build job on Jenkins";
exports.builder = (yargs) => {
  yargs.positional("job", {
    describe: "Name of the build job",
  });
  yargs.option("user", {
    alias: "u",
    type: "string",
    description: "Jenkins User Name",
  });
  yargs.option("password", {
    alias: "p",
    type: "string",
    description: "Jenkins Password",
  });
};
exports.handler = async (argv) => {
  const { job, user, password } = argv;
  jenkins = require("jenkins")({
    baseUrl: `http://${user}:${password}@192.168.33.20:9000`,
    crumbIssuer: true,
    promisify: true,
  });
  (async () => {
    await run(job);
  })();
};

async function getBuildStatus(job, id) {
  return new Promise(async function (resolve, reject) {
    const result = await jenkins.build.get(job, id);
    resolve(result);
  });
}

async function waitOnQueue(id) {
  return new Promise(function (resolve, reject) {
    jenkins.queue.item(id, function (err, item) {
      if (err) {
        throw err;
      }
      if (item.executable) {
        resolve(item.executable.number);
      } else if (item.cancelled) {
        reject("canceled");
      } else {
        setTimeout(async function () {
          resolve(await waitOnQueue(id));
        }, 5000);
      }
    });
  });
}

async function run(job) {
  console.log(chalk.greenBright("Triggering jenkins build job"));

  console.log(chalk.blueBright("Updating jenkins jobs..."));
  let result = sshSync(
    `/home/vagrant/.local/bin/jenkins-jobs --conf /etc/jenkins_jobs/jenkins_jobs.ini --user ${process.env.JENKINS_USER} --password ${process.env.JENKINS_PASSWORD} update /bakerx/build-job.yml`,
    "vagrant@192.168.33.20"
  );
  if (result.error) {
    printError(result);
  }

  console.log(chalk.blueBright(`Triggering job [${job}]...`));
  const queueId = await jenkins.job.build(job);
  console.log(chalk.blueBright(`Queue item number: ${queueId}`));

  console.log(chalk.blueBright(`Waiting for job to start...`));
  const buildId = await waitOnQueue(queueId);

  console.log(chalk.blueBright(`Fetching Build Log:`));
  const log = await jenkins.build.logStream(job, buildId);

  log.on("data", function (text) {
    process.stdout.write(text);
  });

  log.on("error", function (err) {
    printError(err);
  });

  log.on("end", async function () {
    const build = await getBuildStatus(job, buildId);
    console.log(
      chalk.blueBright(`Build finished with result: ${build.result}`)
    );
  });
}

function printError(result) {
  console.log(result.error);
  process.exit(result.status);
}
