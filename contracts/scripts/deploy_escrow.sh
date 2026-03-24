#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTRACTS_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="$(cd "${CONTRACTS_DIR}/.." && pwd)"

if [[ -f "${CONTRACTS_DIR}/.env" ]]; then
  # shellcheck disable=SC1091
  source "${CONTRACTS_DIR}/.env"
fi

required_vars=(STELLAR_NETWORK SOURCE_ACCOUNT TOKEN_ADDRESS)
for var_name in "${required_vars[@]}"; do
  if [[ -z "${!var_name:-}" ]]; then
    echo "Error: ${var_name} is required. Set it in contracts/.env or your shell."
    exit 1
  fi
done

if ! command -v stellar >/dev/null 2>&1; then
  echo "Error: stellar CLI is required but not found in PATH."
  exit 1
fi

cd "${CONTRACTS_DIR}"

echo "Building escrow contract..."
cargo build --release --target wasm32-unknown-unknown -p stellar-market-escrow

WASM_PATH="${CONTRACTS_DIR}/target/wasm32-unknown-unknown/release/stellar_market_escrow.wasm"
if [[ ! -f "${WASM_PATH}" ]]; then
  echo "Error: expected wasm artifact not found at ${WASM_PATH}"
  exit 1
fi

echo "Deploying escrow contract to network '${STELLAR_NETWORK}'..."
CONTRACT_ID="$(
  stellar contract deploy \
    --wasm "${WASM_PATH}" \
    --source-account "${SOURCE_ACCOUNT}" \
    --network "${STELLAR_NETWORK}"
)"

echo ""
echo "Escrow contract deployed successfully."
echo "Contract ID: ${CONTRACT_ID}"
echo "Record this in ${ROOT_DIR}/contracts/ADDRESSES.md"
