#!/usr/bin/env bash
set -euo pipefail
# Reuse the same backup, validation, publication and health-check flow.
exec bash /www/finpilot-v1/deploy/deploy-server.sh --update
