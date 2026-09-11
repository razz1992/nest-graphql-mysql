#!/bin/bash

echo "===== Installing Nest CLI for build ====="

npm install --no-save @nestjs/cli

echo "===== Starting NestJS build ====="

npm run build

echo "===== NestJS build finished ====="

if [ ! -f "dist/main.js" ]; then
    echo "ERROR: dist/main.js was not generated"
    exit 1
fi

echo "===== Verified dist/main.js exists ====="