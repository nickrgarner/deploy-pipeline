#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

# Script used to initialize your ansible server after provisioning.
sudo add-apt-repository ppa:ansible/ansible -y
sudo apt-get update
sudo apt-get install ansible -y

# Run ansible playbooks to install Jenkins + plugins and configure build environment
ansible-playbook /bakerx/cm/jenkins-install.yml
ansible-playbook /bakerx/cm/jenkins-config.yml
ansible-playbook /bakerx/cm/build-env.yml
