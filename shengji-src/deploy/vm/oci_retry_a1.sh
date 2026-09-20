#!/bin/bash
# Keep trying to create an Always Free Ampere A1 instance on Oracle Cloud
# until the region has capacity ("Out of host capacity" is the usual answer
# for hours or days). Every INTERVAL seconds it tries each availability
# domain once; Ctrl-C stops it. Nothing is created until one attempt
# succeeds, and then it prints the public IP to put into DuckDNS.
#
# Needs the OCI CLI signed in (`brew install oci-cli && oci setup config`,
# then add the generated public key under Profile > My profile > API keys),
# and an existing VCN with a public subnet (Networking > Virtual cloud
# networks > Start VCN Wizard > "VCN with Internet Connectivity").
#
#   ./oci_retry_a1.sh <public-subnet-ocid> <ssh-public-key-file> [name]
#
# Environment overrides: OCPUS (1), MEMORY_GB (6), INTERVAL (60 seconds),
# COMPARTMENT (defaults to the tenancy in ~/.oci/config), IMAGE_ID (defaults
# to the newest Canonical Ubuntu 24.04 build for A1).
set -u

SUBNET_ID=${1:?usage: $0 <public-subnet-ocid> <ssh-public-key-file> [name]}
SSH_KEY_FILE=${2:?usage: $0 <public-subnet-ocid> <ssh-public-key-file> [name]}
NAME=${3:-shengji}
OCPUS=${OCPUS:-1}
MEMORY_GB=${MEMORY_GB:-6}
INTERVAL=${INTERVAL:-60}
SHAPE=VM.Standard.A1.Flex

if ! command -v oci >/dev/null 2>&1; then
  echo "oci CLI not found: brew install oci-cli && oci setup config" >&2
  exit 1
fi
if [ ! -r "$SSH_KEY_FILE" ]; then
  echo "cannot read ssh public key file: $SSH_KEY_FILE" >&2
  exit 1
fi

if [ -z "${COMPARTMENT:-}" ]; then
  COMPARTMENT=$(awk -F= '/^tenancy/ { gsub(/[[:space:]]/, "", $2); print $2; exit }' ~/.oci/config)
fi
if [ -z "$COMPARTMENT" ]; then
  echo "no compartment: set COMPARTMENT=<ocid> or run oci setup config" >&2
  exit 1
fi

ERR=$(mktemp)
trap 'rm -f "$ERR"' EXIT

echo "==> availability domains"
ADS=$(oci iam availability-domain list --compartment-id "$COMPARTMENT" --query 'data[].name' --raw-output 2>"$ERR" \
  | python3 -c 'import json, sys; print("\n".join(json.load(sys.stdin)))' 2>>"$ERR") || true
if [ -z "$ADS" ]; then
  echo "could not list availability domains (is the CLI configured?):" >&2
  cat "$ERR" >&2
  exit 1
fi
echo "$ADS" | sed 's/^/    /'

if [ -z "${IMAGE_ID:-}" ]; then
  echo "==> newest Canonical Ubuntu 24.04 image for $SHAPE"
  IMAGE_ID=$(oci compute image list --compartment-id "$COMPARTMENT" \
    --operating-system "Canonical Ubuntu" --operating-system-version "24.04" \
    --shape "$SHAPE" --sort-by TIMECREATED --sort-order DESC \
    --query 'data[0].id' --raw-output 2>"$ERR") || true
  if [ "${IMAGE_ID#ocid1.image}" = "$IMAGE_ID" ]; then
    echo "could not find the image:" >&2
    cat "$ERR" >&2
    exit 1
  fi
fi
echo "    $IMAGE_ID"

echo "==> trying every $INTERVAL s: $SHAPE, $OCPUS OCPU, $MEMORY_GB GB, name $NAME (Ctrl-C stops)"
attempt=0
while :; do
  attempt=$((attempt + 1))
  for ad in $ADS; do
    printf '%s attempt %d, %s: ' "$(date '+%H:%M:%S')" "$attempt" "$ad"
    INSTANCE_ID=$(oci compute instance launch \
      --compartment-id "$COMPARTMENT" \
      --availability-domain "$ad" \
      --shape "$SHAPE" \
      --shape-config "{\"ocpus\": $OCPUS, \"memoryInGBs\": $MEMORY_GB}" \
      --image-id "$IMAGE_ID" \
      --subnet-id "$SUBNET_ID" \
      --assign-public-ip true \
      --display-name "$NAME" \
      --ssh-authorized-keys-file "$SSH_KEY_FILE" \
      --query 'data.id' --raw-output 2>"$ERR")
    if [ -n "$INSTANCE_ID" ] && [ "${INSTANCE_ID#ocid1.instance}" != "$INSTANCE_ID" ]; then
      echo "created!"
      echo "==> instance $INSTANCE_ID"
      break 2
    fi
    if grep -qi 'capacity' "$ERR"; then
      echo "out of capacity"
    elif grep -qi 'TooManyRequests' "$ERR"; then
      echo "rate limited, waiting"
      sleep "$INTERVAL"
    else
      echo "failed with an error that retrying will not fix:"
      cat "$ERR" >&2
      exit 1
    fi
  done
  sleep "$INTERVAL"
done

echo "==> waiting for it to run"
while :; do
  STATE=$(oci compute instance get --instance-id "$INSTANCE_ID" --query 'data."lifecycle-state"' --raw-output 2>/dev/null)
  echo "    $STATE"
  [ "$STATE" = "RUNNING" ] && break
  sleep 10
done

IP=$(oci compute instance list-vnics --instance-id "$INSTANCE_ID" --query 'data[0]."public-ip"' --raw-output 2>/dev/null)
echo "==> public IP: $IP"
echo "Next: put that IP into DuckDNS, open ports 80 and 443 in the subnet's"
echo "security list (DEPLOY.md, Oracle Cloud step 3), then ssh ubuntu@$IP"
