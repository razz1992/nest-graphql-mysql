#!/bin/bash

echo "===== NestJS AWS EB build started ====="

npm run build

echo "===== NestJS AWS EB build completed ====="

if [ ! -f "dist/main.js" ]; then
    echo "ERROR: dist/main.js was not generated"
    exit 1
fi

echo "===== Verified dist/main.js ====="