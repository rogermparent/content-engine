#! /bin/sh

# Install dependencies for Cypress as well as git for git-specific tests
apt-get update
apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb git

git config --global user.email "runner@example.com"
git config --global user.name "Test Runner"

# Install cypress
pnpm exec cypress install

# Start a headless run of all cypress tests
pnpm --filter=recipe-editor run e2e-start:headless