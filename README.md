# Team 23 - Spicy Pandas

## CSC 519 - DevOps, Spring 2021

## [Milestone 3 Checkpoint](CHECKPOINT.md)

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


## Past Milestones
### [Build README](M1%20Docs/README.md)
### [Build Checkpoint](M1%20Docs/CHECKPOINT.md)
### [Test README](M2%20Docs/README.md)
### [Test Checkpoint](M2%20Docs/CHECKPOINT.md)
