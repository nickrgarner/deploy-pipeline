# Team 23 - Spicy Pandas

## CSC 519 - DevOps, Spring 2021

## [Milestone 3 Checkpoint](CHECKPOINT.md)

## [Screencast Part 1](https://youtu.be/0VAVmI86ZRQ)
## [Screencast Part 2](https://youtu.be/yyDk95c6x-4)

## Usage

### Setup
```shell
# Create .vault-pass file
echo "<VAULT PASSWORD>\n" >> .vault-pass

# Install
npm install
npm link
```

### Configure Jenkins and build environment:

```shell
# Provision and configure VM
pipeline setup --gh-user <NCSU Github User> --gh-pass <NCSU Github Password>
```
**NOTE:** NCSU Github Password should be a [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) or a plain-text password that **escapes special characters**.

**NOTE:** If cloning the repo onto a host system that uses Windows OS you may need to update the line endings style in `/cm/server-init.sh` from CRLF to LF before running the `pipeline setup` command.

### Run `checkbox.io` build job:

```shell
pipeline build checkbox.io -u <JENKINS USERNAME> -p <JENKINS PASSWORD>
```

### Run `iTrust` build job:
```sh
pipeline build iTrust -u <JENKINS USERNAME> -p <JENKINS PASSWORD>
```

### Run mutation fuzzer for `iTrust2-v8` repo:
```sh
pipeline useful-tests -c <repetitions> --gh-user <NCSU Github User> --gh-pass <NCSU Github Password>
```
**NOTE:** NCSU Github Password should be a [Personal Access Token](https://docs.github.com/en/github/authenticating-to-github/creating-a-personal-access-token) or a plain-text password that **escapes special characters**.

### Provision production instances:
```sh
# Provision on Digital Ocean - requires API token in `commands/produp.js`
pipeline prod up

# Provision locally with VirtualBox
pipeline prod up --local
```
**NOTE:** The proper inventory file will be generated at runtime by running one of these commands.

### Deploy applications:
```sh
# Install checkbox.io dependencies and serve with nginx
pipeline deploy checkbox -i inventory.ini

# Install iTrust2-v8 dependencies and serve with Tomcat9
pipeline deploy iTrust -i inventory.ini
```
**NOTE:** Deploying iTrust2 requires FIRST running a Jenkins build of the project to generate a snapshot WAR file.

## Lessons Learned
* One of the difficulties of canary analysis is determining which health metrics are important to the project being tested. For example, HTTP codes are arguably most useful for web applications and REST APIs.
* Getting SSH key pairs proliferated to the various deploy targets can be challenging depending on initial security setups, but help ensure smooth interactions with the configuration server once established.
* Tomcat and nginx configuration are quite complicated and application-dependent, requiring a lot of trial, error, and debugging to successfully implement.
* Arguably the most useful role of canary analysis is in support of gradual rollout of new releases, versus as a testing tool. Traffic can be incrementally diverted to new versions of the code without impacting the entire userbase at once.

## Past Milestones
### [Build README](M1%20Docs/README.md)
### [Build Checkpoint](M1%20Docs/CHECKPOINT.md)
### [Test README](M2%20Docs/README.md)
### [Test Checkpoint](M2%20Docs/CHECKPOINT.md)
