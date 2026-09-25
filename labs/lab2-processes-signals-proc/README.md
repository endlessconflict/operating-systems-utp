# Lab 2: Processes, signals and /proc

Hands-on work with Linux processes in three phases. First I generated CPU load and followed PIDs, PPIDs and states up to PID 1. Then I sent POSIX signals to a script that catches them with `trap`, and the last phase went through `/proc/<PID>/` to look at open file descriptors, context switches and resource limits. The lab also has two debugging challenges. Guide: [lab2_proceso_senales](https://github.com/isacioutp/Sistema-Operativo-utp/tree/main/lab2_proceso_senales).

## Environment

The Lab 1 VM would not boot. The VirtualBox log had the reason in one line.

```text
HM: HMR3Init: Attempting fall back to NEM: AMD-V is not available
```

Hyper-V is active on the host for WSL2 and Docker Desktop, so VirtualBox cannot use AMD-V directly and the boot hung at `Loading essential drivers`. However, turning Hyper-V off would have broken WSL and Docker, and this lab only needs a Linux kernel, so I ran it on Ubuntu 26.04 under WSL2 (kernel 6.6, 16 CPUs, systemd as PID 1).

## Highlights

- **Debugging challenge 1.** `ps aux --sort=-%cpu | awk '{print $2, $3, $11}' | head -n 3` returns two processes, not three, because the `ps` header uses up one of the three lines. The fix is `awk 'NR>1 ...'`, or letting `ps` do the work with `ps -eo pid,pcpu,comm --sort=-pcpu --no-headers`.
- **Debugging challenge 2.** The signal script failed with `Permission denied` and exit code 126 because new files are created without the execute bit. `chmod u+x` fixed it.
- The `sha256sum` load processes did not hang from my shell. The `( ... & )` subshell exits right away, so they were orphaned and adopted by a WSL `Relay` process. A plain `sleep 300 &` shows the expected `bash ─── sleep` parent link.
- `trap` caught SIGINT and SIGTERM, and the script kept running. The handler message showed up with up to 2 seconds of delay, because bash only runs it after the current `sleep 2` returns. SIGKILL ended the script, since it cannot be caught.
- `/proc/<PID>/status` reports 0 bytes in `ls -l`, but a copy of it is 1460 bytes. The contents are generated on `read()`, so the inode has no size to report.
- `strace` on `ps` shows it opens `stat`, `status` and `cmdline` under `/proc/<n>` for almost every process on the system, even with `-p`.
- For the questionnaire I also reproduced a zombie with `bash -c 'sleep 1 & exec sleep 60' &`. It survived `kill -9` and disappeared once its parent died.

## Files

- [`report.pdf`](report.pdf): submitted report with the technical questionnaire (Spanish)
- [`servicio_senales.sh`](servicio_senales.sh): the script used for the signal tests
