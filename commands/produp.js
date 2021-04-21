const child = require("child_process");
const chalk = require("chalk");
const path = require("path");
const os = require("os");
const scpSync = require("../lib/scp");
const sshSync = require("../lib/ssh");
const got = require("got");

var config = {};
/** DO NOT CHECK IN TO REPO */
config.token = 12345; // Add Digital Ocean api token here for now
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
      console.log(chalk.green(`IP Address of droplet: ` + ip));
      resolve(ip);
    }
  });
}

async function addToInventory(hostName, dropletIP) {
  return new Promise(async function (resolve, reject) {
    let result = sshSync(
      `echo "[${hostName}]\n${dropletIP} ansible_user=vagrant\n" > /bakerx/inventory.ini`,
    );
    if (result.error) {
      reject(printError(result));
    } else {
      resolve(chalk.green(`${hostName}@${dropletIP} added to Ansible hosts`));
    }
  });
}

async function run() {
  console.log(chalk.greenBright("Provisioning Digital Ocean instance for iTrust2..."));
  let itrustID = await createDroplet("itrust", nyc1, "debian-10-x64");

  let ip = await getDropletIP(itrustID);
  await addToInventory("itrust", ip);

  console.log(chalk.greenBright("Provisioning Digital Ocean instance for checkbox.io..."));
  let checkboxID = await createDroplet("checkbox", nyc1, "debian-10-x64");

  ip = await getDropletIP(checkboxID);
  await addToInventory("checkbox", ip);
}

function printError(result) {
  console.log(result.error);
  process.exit(result.status);
}
