require("dotenv").config();
const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const jenkins = require("jenkins")({
  baseUrl: `http://${process.env.JENKINS_USER}:${process.env.JENKINS_PASSWORD}@192.168.33.20:9000`,
  crumbIssuer: true,
});

const scpSync = require("../lib/scp");
const sshSync = require("../lib/ssh");

exports.command = "build";
exports.desc = "Trigger a build job on Jenkins";

exports.handler = async (argv) => {
  const { job } = argv;
  (async () => {
    await run(job);
  })();
};

async function run(job = "checkbox-build") {
  console.log(chalk.greenBright("Triggering jenkins build job"));

  console.log(chalk.blueBright("Updating jenkins jobs..."));
  let result = sshSync(
    `/home/vagrant/.local/bin/jenkins-jobs --conf /etc/jenkins_jobs/jenkins_jobs.ini update /bakerx/build-job.yml`,
    "vagrant@192.168.33.20"
  );
  if (result.error) {
    printError(result);
  }

  console.log(chalk.blueBright(`Triggering job [${job}]...`));
  result = await jenkins.job.build(job, (err, data) => {
    if (err) {
      throw err;
    }

    console.log(chalk.blueBright(`Queue Item Number: ${data}`));
  });
}

function printError(result) {
  console.log(result.error);
  process.exit(result.status);
}
