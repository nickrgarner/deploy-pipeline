#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

# Script used to initialize your ansible server after provisioning.
sudo add-apt-repository ppa:ansible/ansible -y
wget -q -O - https://pkg.jenkins.io/debian/jenkins.io.key | sudo apt-key add -
sudo sh -c 'echo deb https://pkg.jenkins.io/debian-stable binary/ > /etc/apt/sources.list.d/jenkins.list'
sudo apt-get update
sudo apt-get install ansible -y
sudo apt-get install -y rpm

# Run ansible playbooks to install Jenkins + plugins and configure build environment
ansible-playbook /bakerx/cm/jenkins-install.yml
ansible-playbook /bakerx/cm/build-env.yml
