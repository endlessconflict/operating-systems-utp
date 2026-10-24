# Assignment 5: Redis and the Linux kernel

![type](https://img.shields.io/badge/type-assignment-fd9330?style=flat-square) ![env](https://img.shields.io/badge/env-Ubuntu%2018.04%20VM-262626?style=flat-square) ![report](https://img.shields.io/badge/report-Spanish-262626?style=flat-square)

A short guided lab ("Lab 0 Redis") worth two participation points. It follows `redis-server` down into the kernel without root, and ends with a closing table that ties each observation to what it means for Redis.

| What I saw | Tool | What it means for Redis |
| --- | --- | --- |
| 600 MB of `buff/cache` | `free -h`, `/proc/meminfo` | Not lost memory. It is page cache the kernel lends to `dump.rdb` and the AOF. |
| Separate inodes for `dump.rdb` and `appendonly.aof` | `stat`, `ls -i`, `df -i` | Every file has its own inode and a copy gets a new one, so space and inodes run out independently. |
| First read 0.452 s, second 0.040 s | `dd`, `posix_fadvise` | With the file in page cache a reload is about ten times faster. |
| 9 descriptors against a limit of 10032 | `/proc/<pid>/fd`, `/proc/<pid>/limits` | Sockets, epoll and the AOF. The limit is `maxclients` plus 32. |
| `appendfsync` no, everysec, always | Python demo with `os.fsync` | Without `fsync` the data lives in page cache and may not survive a crash. Redis defaults to `everysec`, so it loses at most a second. |
| `EMFILE` against `ENOSPC` | `ulimit -n 128`, a 128-inode loop filesystem | `EMFILE` belongs to the process. `ENOSPC` belongs to the filesystem, here by inode exhaustion. |

## Files

- [`report.pdf`](report.pdf): report with the closing table (Spanish)
- [`src/`](src): `baseline.sh` and `redis-lab0.sh` from the guide
- [`screenshots/`](screenshots): captures for each step
