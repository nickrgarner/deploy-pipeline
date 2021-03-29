# Team 23 - Spicy Pandas

## CSC 519 - DevOps, Spring 2021

## [Test Checkpoint](CHECKPOINT.md)

## Usage

Configure Jenkins and build environment:

```shell
# Create .vault-pass file
echo "<VAULT PASSWORD>\n" >> .vault-pass

# Install
npm install
npm link

# Provision and configure VM
pipeline setup
```

**NOTE:** If cloning the repo onto a host system that uses Windows OS you may need to update the line endings style in `/cm/server-init.sh` from CRLF to LF before running the `pipeline setup` command.

Run `checkbox.io` build job:

```shell
pipeline build checkbox.io -u <JENKINS USERNAME> -p <JENKINS PASSWORD>
```

## Past Milestones
### [Build README](M1%20Docs/README.md)
### [Build Checkpoint](M1%20Docs/CHECKPOINT.md)
