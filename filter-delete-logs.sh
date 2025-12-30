#!/bin/bash
# Filter script to isolate delete message logs
# Usage: ./filter-delete-logs.sh < logfile.txt
# Or: your-command | ./filter-delete-logs.sh

grep -E "DELETE_|🗑️|BACKEND_.*DELETE|❌.*DELETE|Error deleting|DELETE.*messages" | \
  grep -v "OPTIONS" | \
  grep -v "GET.*discussions"




