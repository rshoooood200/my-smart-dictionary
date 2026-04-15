#!/bin/bash
cd /home/z/my-project
while true; do
  echo "Starting Next.js server..."
  node node_modules/.bin/next dev -p 3000 -H 0.0.0.0 2>&1 | tee dev.log
  echo "Server stopped. Restarting in 2 seconds..."
  sleep 2
done
