#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
RPC_URL="${RPC_URL:-http://127.0.0.1:8545}"
WEB_ENV_FILE="${WEB_ENV_FILE:-$ROOT_DIR/apps/web/.env.local}"

NODE_STARTED_BY_SCRIPT=0
NODE_PID=""

log() {
  printf '[dev:local] %s\n' "$1"
}

rpc_ready() {
  curl -sS --max-time 2 \
    -H "content-type: application/json" \
    --data '{"jsonrpc":"2.0","id":1,"method":"eth_chainId","params":[]}' \
    "$RPC_URL" >/dev/null 2>&1
}

wait_for_rpc() {
  local retries=40
  local delay=1

  for ((i = 1; i <= retries; i++)); do
    if rpc_ready; then
      return 0
    fi
    sleep "$delay"
  done

  return 1
}

read_env_value() {
  local key="$1"
  local file="$2"

  if [[ ! -f "$file" ]]; then
    return 1
  fi

  local line
  line="$(grep -E "^${key}=" "$file" | tail -n1 || true)"
  if [[ -z "$line" ]]; then
    return 1
  fi

  printf '%s' "${line#*=}"
}

set_env_value() {
  local key="$1"
  local value="$2"
  local file="$3"

  mkdir -p "$(dirname "$file")"
  touch "$file"

  local tmp_file
  tmp_file="$(mktemp)"

  awk -v k="$key" -v v="$value" '
    BEGIN { written = 0 }
    $0 ~ ("^" k "=") {
      print k "=" v
      written = 1
      next
    }
    { print }
    END {
      if (written == 0) {
        print k "=" v
      }
    }
  ' "$file" >"$tmp_file"

  mv "$tmp_file" "$file"
}

contract_code_exists() {
  local address="$1"
  local payload
  payload="$(printf '{"jsonrpc":"2.0","id":1,"method":"eth_getCode","params":["%s","latest"]}' "$address")"

  local response
  response="$(curl -sS --max-time 3 -H "content-type: application/json" --data "$payload" "$RPC_URL" || true)"

  local code
  code="$(printf '%s' "$response" | sed -n 's/.*"result":"\([^"]*\)".*/\1/p')"

  [[ -n "$code" && "$code" != "0x" ]]
}

cleanup() {
  if [[ "$NODE_STARTED_BY_SCRIPT" -eq 1 && -n "$NODE_PID" ]]; then
    log "Stopping local Hardhat node (pid $NODE_PID)"
    kill "$NODE_PID" >/dev/null 2>&1 || true
  fi
}

trap cleanup EXIT INT TERM

cd "$ROOT_DIR"

if rpc_ready; then
  log "Detected running local RPC at $RPC_URL"
else
  log "Starting local Hardhat node..."
  pnpm --filter @darkpool/contracts node >/dev/null 2>&1 &
  NODE_PID=$!
  NODE_STARTED_BY_SCRIPT=1

  if ! wait_for_rpc; then
    log "Local RPC did not become ready in time."
    exit 1
  fi
  log "Local Hardhat node is ready."
fi

factory_address=""
if factory_address="$(read_env_value "NEXT_PUBLIC_FACTORY_ADDRESS" "$WEB_ENV_FILE")"; then
  :
else
  factory_address=""
fi

needs_deploy=0
if [[ -z "$factory_address" ]]; then
  log "No NEXT_PUBLIC_FACTORY_ADDRESS set in $WEB_ENV_FILE."
  needs_deploy=1
elif ! contract_code_exists "$factory_address"; then
  log "No contract code found at current NEXT_PUBLIC_FACTORY_ADDRESS ($factory_address)."
  needs_deploy=1
else
  log "Factory contract found at $factory_address. Reusing existing deployment."
fi

if [[ "$needs_deploy" -eq 1 ]]; then
  log "Deploying contracts to localhost..."
  deploy_output="$(pnpm --filter @darkpool/contracts deploy:local)"
  printf '%s\n' "$deploy_output"

  new_factory_address="$(printf '%s\n' "$deploy_output" | sed -n 's/.*MarketFactory :[[:space:]]*\(0x[a-fA-F0-9]\{40\}\).*/\1/p' | tail -n1)"
  if [[ -z "$new_factory_address" ]]; then
    log "Failed to parse MarketFactory address from deployment output."
    exit 1
  fi

  set_env_value "NEXT_PUBLIC_FACTORY_ADDRESS" "$new_factory_address" "$WEB_ENV_FILE"
  log "Updated NEXT_PUBLIC_FACTORY_ADDRESS in $WEB_ENV_FILE to $new_factory_address"
fi

if [[ "${SKIP_WEB:-0}" == "1" ]]; then
  log "SKIP_WEB=1 set. Setup complete, not starting web server."
  exit 0
fi

log "Starting Next.js dev server..."
pnpm --filter @darkpool/web dev
