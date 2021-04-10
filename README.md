# Team 23 - Spicy Pandas

## CSC 519 - DevOps, Spring 2021

## [Milestone 2 Checkpoint](CHECKPOINT.md)

## Usage

### Configure Jenkins and build environment:

```shell
# Create .vault-pass file
echo "<VAULT PASSWORD>\n" >> .vault-pass

# Install
npm install
npm link

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

## Lessons Learned
- Coding a mutation fuzzer requires careful consideration of what code can and cannot be manipulated due to compile errors. Often our fuzzer test runs would be "all or nothing" in which we would either get all compile errors or none. This was particularly the case with fuzzing of `<` and `>` causing issues with generics.
- JaCoCo requires both a minimum AND corresponding maximum threshold value in order to gate a build. This particular quirk caused us issues for a while when setting up the build gates for the iTrust job.
- Jenkins plugins are easy to autonomously install, but hard to autonomously configure. Documentation standards for Jenkins plugins seems to be highly variable and scattered in all different places, with the official plugin pages on the Jenkins site having very barebones information.
- Abstract Syntax Trees are very powerful for performing static analysis, but do require some trial and error to get acquainted with the token types that a particular parser uses. We had to play around a lot to find the right token types to use for each of the metrics we were required to implement.

## [Screencast 1 - Static Analysis and iTrust Build Job](https://youtu.be/IgJYQdkNrak)

## Past Milestones
### [Build README](M1%20Docs/README.md)
### [Build Checkpoint](M1%20Docs/CHECKPOINT.md)
