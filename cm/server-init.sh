#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

while getopts u:p: flag
do
    case "${flag}" in
        u) username=${OPTARG};;
        p) password=${OPTARG};;
    esac
done

# Script used to initialize your ansible server after provisioning.
sudo add-apt-repository ppa:ansible/ansible -y
sudo apt-get update
sudo apt-get install ansible -y

# Run ansible playbooks to install Jenkins + plugins and configure build environment
ansible-playbook /bakerx/cm/jenkins-install.yml
ansible-playbook --vault-pass "/home/.vault-pass" /bakerx/cm/jenkins-config.yml --extra-vars "GH_USER=$username GH_PASS=$password"
ansible-playbook --vault-pass "/home/.vault-pass" /bakerx/cm/build-env.yml --extra-vars "GH_USER=$username GH_PASS=$password"
