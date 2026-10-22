# Lab 4: Thrashing and swap

![type](https://img.shields.io/badge/type-lab-6ae0ff) ![env](https://img.shields.io/badge/env-Ubuntu%2018.04%20%C2%B7%20Docker%2024-lightgrey) ![report](https://img.shields.io/badge/report-Spanish-lightgrey)

An incident drill. A Flask service on port 5002 answers `HTTP 200` every time, but `/api/v1/analytics` takes tens of seconds instead of a fraction of one. Nothing crashes and nothing shows up in the app logs. The rule of the lab is that `app.py` stays untouched, so the fix has to live in the container and the operating system.

## What was wrong

The endpoint needs roughly 210 MB. The container was started with 128 MB of RAM and 384 MB of swap, so the overflow went to disk, and since the job rewrites every page three times, the kernel spent its time paging instead of computing. That is thrashing. The numbers from the report:

| | Before | After |
| --- | --- | --- |
| Memory limit | 128 MB | 512 MB |
| Container swap | 384 MB | 0 MB |
| `/analytics` latency | 26 to 438 s | about 0.1 s |
| `vmstat` during a call | `si` up to 21 396, `wa` 17 to 42 % | `si` 0, `so` 0, `wa` 0 |
| `oom_kill` | 0 | 0 |

Five whys led to the sizing and not to the swap. `--memory-swap=512m` is the total, and someone read it as the swap alone. Swap only turned a small limit into slowness instead of a visible error.

## What I did

- Created a 2 GB `/swapfile` first, because the course VM shipped without swap.
- Mitigated with `POST /admin/clear`, which frees about 100 MB, but the next call brought the incident straight back.
- Raised `memory.max` to 512 MB by writing to the cgroup on the host. Docker did not notice, so I then ran `docker update --memory 512m --memory-swap 512m` to make it stick.
- Kernel 4.15 refuses to lower `memory.swap.max` while the swap is in use, so it needed `swapoff -a && swapon -a` before the limit would drop.
- Set `vm.swappiness = 10` as a complement. It does not survive a reboot.

## A finding the guide does not mention

Still, 512 MB is enough for one request at a time and not for two. With a second request in flight the container died with exit code 137 and `OOMKilled=true`, and `dmesg` showed `anon-rss:521348kB`. The endpoint allocates the new buffer before releasing the old one, and Flask serves each request in its own thread, so three 180 MB buffers can be alive together. I explained it from the code and the figure, and did not reproduce it with a deliberate pair of requests. I kept 512 MB because the guide asks for it and evidence 3 checks it.

## Files

- [`report.pdf`](report.pdf): the submitted report with the RCA (Spanish)
- [`src/`](src): `Dockerfile` and `app.py` as provided
- [`screenshots/`](screenshots): `E1` to `E4` are the four required evidences, the numbered ones show each step
