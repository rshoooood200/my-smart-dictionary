#!/bin/bash
cd /home/z/my-project
export NODE_ENV=development
exec node node_modules/.bin/next dev -p 3000 -H 0.0.0.0
