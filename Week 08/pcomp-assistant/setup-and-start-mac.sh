#!/bin/bash

cd "$(dirname "$0")" || exit 1

echo "Starting PCom Assistant..."
echo

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed."
  echo "Install the LTS version from https://nodejs.org, then run this script again."
  exit 1
fi

if [ ! -f ".env.local" ]; then
  echo "First-time setup: enter your DeepSeek API key."
  read -r -s -p "DeepSeek API key: " DEEPSEEK_KEY
  echo

  if [ -z "$DEEPSEEK_KEY" ]; then
    echo "No key was entered. Setup stopped."
    exit 1
  fi

  printf 'DEEPSEEK_API_KEY=%s\nDEEPSEEK_MODEL=deepseek-flash\nPORT=3000\n' "$DEEPSEEK_KEY" > .env.local
  unset DEEPSEEK_KEY
  chmod 600 .env.local
  echo "Saved the key privately in .env.local."
  echo
fi

echo "Keep this Terminal window open while using PCom Assistant."
echo "Open the exact localhost address printed below in your browser."
echo "Press Control+C to stop the server."
echo
node server.js
