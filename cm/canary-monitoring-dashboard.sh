#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

sudo apt-get update
sudo apt-get install npm -y
sudo npm install pm2@latest -g

cd /bakerx/lib/dashboard

npm install

pm2 start bin/www