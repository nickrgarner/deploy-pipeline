#!/bin/bash

# Exit on error
set -e

# Trace commands as we run them:
set -x

sudo chmod 600 /bakerx/checkbox_key.pub
sudo cat /bakerx/checkbox_key.pub >> ~/.ssh/authorized_keys
