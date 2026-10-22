#!/bin/bash
# LAB 0 — baseline: kernel + servicio + page cache (sin sudo, con o sin Redis)
set -u
# Redis del lab (7777) o tu shell. NO usar sshd/nginx: /proc/<pid>/fd daría Permission denied.
SVC=$(pgrep -of '[r]edis-server.*7777' 2>/dev/null || echo $$)
echo "PID_SERVICIO=$SVC"
tr '\0' ' ' < /proc/$SVC/cmdline 2>/dev/null; echo
grep -E "Name|PPid|Threads|VmRSS|State" /proc/$SVC/status 2>/dev/null
uname -r; cat /proc/version; uptime -p
echo "--- mem ---"
free -h
grep -E '^(MemTotal|MemFree|MemAvailable|Cached|Dirty|Writeback):' /proc/meminfo
echo "--- fds servicio ---"
ls -l /proc/$SVC/fd/ 2>/dev/null | head -15
grep "open files" /proc/$SVC/limits 2>/dev/null
ulimit -n
