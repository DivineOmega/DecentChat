#!/bin/bash

# Clean up existing build if present
rm -r DecentChat-windows-x64

# Download electron (Windows x64)
wget -nc https://github.com/atom/electron/releases/download/v0.36.7/electron-v0.36.7-win32-x64.zip
unzip electron-v0.36.7-win32-x64.zip -d DecentChat-windows-x64

# Rename electron executable
mv DecentChat-windows-x64/electron.exe DecentChat-windows-x64/DecentChat.exe

# Make app directory
mkdir DecentChat-windows-x64/resources/app

# Sync app content
rsync ../* DecentChat-windows-x64/resources/app/ -r --exclude builds

# Install dependencies
cd DecentChat-windows-x64/resources/app/
bower install bootstrap
mkdir dist
cd dist
wget -nc https://github.com/DivineOmega/DecentMessaging/releases/download/0.1/DecentMessaging.jar
chmod +x DecentMessaging.jar
cd ../../../../
