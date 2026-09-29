#!/usr/bin/env bash
set -euo pipefail
# Reuse the same backup, validation, publication and health-check flow.
exec bash /www/finpilot/deploy/deploy-server.sh --update
