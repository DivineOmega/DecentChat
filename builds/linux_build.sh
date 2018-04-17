#!/bin/bash

# Clean up existing build if present
rm -r DecentChat-linux-x64

# Download electron (Linux x64)
wget -nc https://github.com/atom/electron/releases/download/v0.36.7/electron-v0.36.7-linux-x64.zip
unzip electron-v0.36.7-linux-x64.zip -d DecentChat-linux-x64

# Rename electron executable
mv DecentChat-linux-x64/electron DecentChat-linux-x64/DecentChat

# Make app directory
mkdir DecentChat-linux-x64/resources/app

# Sync app content
rsync ../* DecentChat-linux-x64/resources/app/ -r --exclude builds

# Install dependencies
cd DecentChat-linux-x64/resources/app/
bower update
mkdir dist
cd dist
wget -nc https://github.com/DivineOmega/DecentMessaging/releases/download/v0.4.0/DecentMessaging.jar
chmod +x DecentMessaging.jar
cd ../../../../
