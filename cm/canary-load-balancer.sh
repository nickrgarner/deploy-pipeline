#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

sudo npm install pm2@latest -g

cd /bakerx/lib

npm install

pm2 start canary-driver.js