const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const scpSync = require("../lib/scp");
const sshSync = require("../lib/ssh");
const got = require("got");
const fs = require("fs");

var config = {};
/** DO NOT CHECK IN TO REPO */
config.token = "12345"; // Add Digital Ocean api token here for now
/** DO NOT CHECK IN TO REPO */

const headers = {
  "Content-Type": "application/json",
  Authorization: "Bearer " + config.token,
};

exports.command = "prod up";
exports.desc = "Provision cloud instance for deployment";
exports.handler = async (argv) => {
  (async () => {
    await run();
  })();
};

async function createDroplet(dropletName, region, imageName) {
  return new Promise(async function (resolve, reject) {
    var data = {
      name: dropletName,
      region: region,
      size: "s-1vcpu-1gb",
      image: imageName,
      ssh_keys: null,
      backups: false,
      ipv6: false,
      user_data: null,
      private_networking: null,
    };

    console.log("Attempting to create: " + JSON.stringify(data));

    let response = await got
      .post("https://api.digitalocean.com/v2/droplets", {
        headers: headers,
        json: data,
      })
      .catch((err) => reject(`createDroplet: ${err}`));

    console.log(response.statusCode);
    let droplet = JSON.parse(response.body).droplet;
    console.log(response.body);

    if (response.statusCode == 202) {
      console.log(chalk.green(`Created droplet id ${droplet.id}`));
      resolve(droplet.id);
    }
  });
}

async function getDropletIP(id) {
  return new Promise(async function (resolve, reject) {
    let response = await got(`https://api.digitalocean.com/v2/droplets/${id}`, {
      headers: headers,
      responseType: "json",
    }).catch((err) => reject(chalk.red(`getDropletIP: ${err}`)));

    if (response.body.droplet) {
      let droplet = response.body.droplet;
      let ip = droplet.networks.v4[1].ip_address;
      console.log(chalk.greenBright(`IP Address of droplet: ` + ip));
      resolve(ip);
    }
  });
}

async function addToInventory(itrustIP, checkboxIP) {
  return new Promise(async function (resolve, reject) {
    fs.writeFile(
      "inventory.ini",
      `[itrust]\n${itrustIP} ansible_user=vagrant\n\n[checkbox]\n${checkboxIP} ansible_user=vagrant\n`,
      (err) => {
        if (err) {
          reject(printError(err));
        } else {
          resolve(
            console.log(
              chalk.greenBright(`iTrust2 and checkbox.io deployments added to Ansible hosts`),
            ),
          );
        }
      },
    );
  });
}

async function run() {
  console.log(chalk.greenBright("Provisioning Digital Ocean instance for iTrust2..."));
  let itrustDroplet = await createDroplet("itrust", "nyc1", "debian-10-x64");

  await new Promise((r) => setTimeout(r, 10000)); // Give droplet time to spin up

  let itrustIP = await getDropletIP(itrustDroplet);

  console.log(chalk.greenBright("Provisioning Digital Ocean instance for checkbox.io..."));
  let checkboxDroplet = await createDroplet("checkbox", "nyc1", "debian-10-x64");

  await new Promise((r) => setTimeout(r, 10000)); // Give droplet time to spin up

  let checkboxIP = await getDropletIP(checkboxDroplet);
  await addToInventory(itrustIP, checkboxIP);
}

function printError(result) {
  console.log(result.error);
  process.exit(result.status);
}
