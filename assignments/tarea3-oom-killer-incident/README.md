# Tarea 3: OOM killer incident and RCA

An incident-response exercise. A Flask microservice on port 5001 keeps dying, and the container shows `Exited (137)`. Acting as SRE, the job is to confirm the symptom, collect evidence, explain the cause, mitigate it and leave a fix. The one hard rule is that `app.py` cannot be edited, so the fix has to come from the container and the OS.

## Preparing the VM

The guide refers to cgroups v2 files (`memory.max`, `memory.events`, `/sys/fs/cgroup/system.slice/docker-<id>.scope`), but Ubuntu 18.04 boots with cgroups v1, and `docker info` reported `Cgroup Version: 1` and `No swap limit support`. I switched the VM to v2 with two kernel parameters in a separate file, so the original GRUB config stays untouched.

```bash
# /etc/default/grub.d/99cgroupv2.cfg
GRUB_CMDLINE_LINUX="$GRUB_CMDLINE_LINUX systemd.unified_cgroup_hierarchy=1 swapaccount=1"
sudo update-grub && sudo reboot
```

Deleting that file and running `update-grub` again undoes the change.

## What was found

The service ran with `--memory=256m --memory-swap=256m --cpus=1 --restart no`. Each `POST /api/v1/process-data?mb=64` allocates a block and writes to every page of it. The block then goes into `LEAK_BUCKETS`, a global list that is never cleared. RSS went 35 → 100 → 166 → 231 MB. The fourth call got no response (curl exit 52), and the container ended with `Exited (137)`.

Four independent sources agree on the cause.

- `dmesg` logs `Killed process (python)` through `mem_cgroup_out_of_memory`, with `memory: usage 262144kB, limit 262144kB`
- `docker inspect` reports `ExitCode=137` and `OOMKilled=true`
- `docker events` has an `oom` event right before `die` with code 137
- `/proc/1/status` and the cgroup files show RSS growing about 65 MB per call against a 256 MB limit with zero swap

137 is 128 + 9, meaning SIGKILL. `docker logs` shows no Python error at all, which fits, since SIGKILL gives the process no chance to write anything. Restarting with the same config reproduced the crash on the same fourth call. `vmstat` showed the VM itself always had more than 1 GB free, so the problem was the container limit, not host memory.

## Mitigation and fix

1. **Mitigation.** The app's `/admin/clear` route empties `LEAK_BUCKETS` without a restart. RSS dropped from 231 MB to 35 MB.
2. **Hot fix at the cgroup level.** Writing `512M` into the container's `memory.max` from the host works immediately. However, Docker does not know about it and would overwrite it on the next restart.
3. **Persistent fix.** `docker update --memory 512m --memory-swap 512m reto1_app`. Passing only `--memory` is rejected, because the memory limit cannot exceed the swap limit already set. With the new limit, six 64 MB calls (384 MB leaked) left the container `Up`, peaking at 409 MiB of 512 MiB with `oom_kill` at 0, and the limit survived `docker restart`.

Detection to resolution took 13 minutes (14:09 to 14:22).

The root cause is still the leak in `/process-data`, and a bigger limit only moves the crash further out. With 512 MB the eighth 64 MB call would fail again. The report's recommendations are a limit of the measured peak plus about 25 %, alerts on `memory.events`, `--restart on-failure`, and a bug report to the developers about the leak. PSI (`/proc/pressure/memory`) would be the natural signal to watch, but it arrived in kernel 4.20 and this VM runs 4.15.

## Files

- [`report.pdf`](report.pdf): full RCA report with timeline and five whys (Spanish)
- [`src/`](src): `app.py` and `Dockerfile` as provided by the course, unmodified
- [`screenshots/`](screenshots): every step, from the cgroup v2 switch to the persistence check
