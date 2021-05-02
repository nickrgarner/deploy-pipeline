#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

while getopts b: flag
do
    case "${flag}" in
        b) branch=${OPTARG};;
    esac
done

sudo apt-get update
sudo apt-get install npm -y
sudo npm install pm2@latest -g

cd /bakerx/lib/agent

npm install

pm2 start index.js -- $branch