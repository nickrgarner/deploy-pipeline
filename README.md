# Team 23 - Spicy Pandas

## CSC 519 - DevOps, Spring 2021

### Usage

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

Run `checkbox.io` build job:

```shell
pipeline build checkbox-build -u <JENKINS USERNAME> -p <JENKINS PASSWORD>
```

### Discussion

Some of the challenging issues we stumbled at during the automation of the setup process:

- We had a hard time getting Jenkins installed using `yum`, ultimately because of the python dependency issue that came up. This took us a while, but we were ultimately able to get it installed.
- It took us a while to figure out why we kept getting an error while creating our Mongo User, but we eventually found out the error was because we were misunderstanding the purpose of the `database` parameter to the mongodb_user module here:

```
mongodb_user:
    database: admin
    name: "{{mongo.MONGO_USER}}"
```

- We also had a difficult time getting the build command to correctly update Jenkins using the jenkins_jobs.ini

### Screencast

We uploaded our screencast to [google drive]()
