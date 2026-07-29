#!/usr/bin/env bash

# Ping Claude API or status page until status clears / incident is resolved.

URL="${1:-https://api.anthropic.com/v1/messages}"
INTERVAL="${2:-5}"

echo "=========================================="
echo " Pinging Claude ($URL)"
echo " Checking every $INTERVAL seconds..."
echo "=========================================="

while true; do
  TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

  # Check statuspage incident URL
  if [[ "$URL" == *"/incidents/"* ]]; then
    JSON_URL="${URL%.html}.json"
    if [[ "$JSON_URL" != *.json ]]; then
      JSON_URL="${JSON_URL}.json"
    fi
    INCIDENT_STATUS=$(curl -s "$JSON_URL" | grep -o '"status":"[^"]*"' | head -n 1 | cut -d'"' -f4)
    if [ "$INCIDENT_STATUS" = "resolved" ] || [ "$INCIDENT_STATUS" = "postmortem" ]; then
      echo "[$TIMESTAMP] SUCCESS! Incident status: $INCIDENT_STATUS"
      echo -e "\a"
      if command -v notify-send >/dev/null 2>&1; then
        notify-send "Claude Incident Resolved!" "Status: $INCIDENT_STATUS"
      fi
      exit 0
    elif [ -n "$INCIDENT_STATUS" ]; then
      echo "[$TIMESTAMP] Incident status: $INCIDENT_STATUS. Retrying in ${INTERVAL}s..."
    else
      # Fallback HTML check
      if curl -s "$URL" | grep -qi "Resolved"; then
        echo "[$TIMESTAMP] SUCCESS! Incident resolved."
        echo -e "\a"
        if command -v notify-send >/dev/null 2>&1; then
          notify-send "Claude Incident Resolved!" "Status: resolved"
        fi
        exit 0
      else
        echo "[$TIMESTAMP] Incident not yet resolved. Retrying in ${INTERVAL}s..."
      fi
    fi
  else
    METHOD="-X GET"
    if [[ "$URL" == *"/v1/"* ]]; then
      METHOD="-X POST"
    fi

    # Fetch HTTP response status code
    if [ -n "$ANTHROPIC_API_KEY" ]; then
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $METHOD -H "x-api-key: $ANTHROPIC_API_KEY" -H "anthropic-version: 2023-06-01" "$URL")
    else
      HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $METHOD "$URL")
    fi

    if [ "$HTTP_CODE" = "529" ]; then
      echo "[$TIMESTAMP] Status 529: Claude is overloaded. Retrying in ${INTERVAL}s..."
    elif [ "$HTTP_CODE" = "405" ]; then
      echo "[$TIMESTAMP] Status 405: Method Not Allowed. Retrying in ${INTERVAL}s..."
    elif [ "$HTTP_CODE" = "000" ]; then
      echo "[$TIMESTAMP] Status 000: Network/connection error. Retrying in ${INTERVAL}s..."
    elif [ "$HTTP_CODE" -ge 500 ] 2>/dev/null; then
      echo "[$TIMESTAMP] Status $HTTP_CODE: Server error. Retrying in ${INTERVAL}s..."
    else
      echo "[$TIMESTAMP] SUCCESS! Status code: $HTTP_CODE (No longer 529)"
      echo -e "\a"
      if command -v notify-send >/dev/null 2>&1; then
        notify-send "Claude Available!" "Status code: $HTTP_CODE"
      fi
      exit 0
    fi
  fi

  sleep "$INTERVAL"
done
