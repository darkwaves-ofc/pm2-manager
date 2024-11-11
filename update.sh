#!/bin/bash

# login to the vps without password prompt
sudo -n true
if [ $? -ne 0 ]; then
    echo "Passwordless sudo is not configured. Please configure passwordless sudo for the current user."
    exit 1
fi

# Display status message
echo "Updating and building..."

# Stash any changes
git stash &>/dev/null
echo "Stashing changes..."

# Pull the latest changes from the remote repository
git pull &>/dev/null
echo "Pulling latest changes..."

# Install npm update
npm install --force &>/dev/null
echo "Installing npm packages..."

# Remove the 'dist' directory if it exists
rm -rf dist &>/dev/null
echo "Removing 'dist' directory..."

# Build the project and start
echo "Building project... and starting server..."
npm run start

# Display a message indicating the update and build process is complete
echo "Update and build process complete."

# PM2 Command --> pm2 start "cd /home/vps3/MRCM-Sport-Meet-Frontend && ./update.sh" --name "MRCM-SPORT-MEET-FRONTEND"
# pm2 start "./update.sh" --name "MRCM-SPORT-MEET-FRONTEND" --user vps3