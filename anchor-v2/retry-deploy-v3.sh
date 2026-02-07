#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/share/solana/install/active_release/bin:$HOME/.avm/bin:$PATH"
KEYPAIR="$HOME/.config/solana/degen-roulette.json"
SO="/Users/nova/projects/degen-roulette/anchor-v2/target/deploy/degen_roulette_v2.so"
PROGRAM_ID="BA7ZDtCNiRAPWVbyCJaDXcmC1izr7e9E48n3wmGYLdnz"
RPC="https://devnet.helius-rpc.com/?api-key=7124a08e-c445-4648-86af-6d569f3dbbe6"

need=2.30

echo "[retry-deploy] start $(date)"
for i in $(seq 1 36); do
  bal=$(solana balance --url "$RPC" --keypair "$KEYPAIR" | awk '{print $1}')
  echo "[retry-deploy] attempt $i balance=$bal"

  python3 - <<PY "$bal" "$need"
import sys
bal=float(sys.argv[1]); need=float(sys.argv[2])
sys.exit(0 if bal>=need else 1)
PY
  if [[ $? -eq 0 ]]; then
    echo "[retry-deploy] balance sufficient, deploying..."
    if solana program deploy "$SO" --url "$RPC" --keypair "$KEYPAIR" --program-id "$PROGRAM_ID"; then
      echo "[retry-deploy] DEPLOY SUCCESS $(date)"
      exit 0
    else
      echo "[retry-deploy] deploy failed, retrying"
    fi
  fi

  solana airdrop 0.5 --url "$RPC" --keypair "$KEYPAIR" || true
  sleep 300
done

echo "[retry-deploy] exhausted retries $(date)"
exit 1
