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

rm -rf microservice-$branch

git clone https://github.com/chrisparnin/checkbox.io-micro-preview.git microservice-$branch

cd microservice-$branch

git checkout $branch

npm install

pm2 start index.js