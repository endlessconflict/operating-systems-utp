# Case study: sizing Nginx and MySQL, native against Docker

![type](https://img.shields.io/badge/type-case%20study-ff9a35) ![env](https://img.shields.io/badge/env-VirtualBox%20VM%208%20GB%20%2F%204%20vCPU-lightgrey) ![report](https://img.shields.io/badge/report-Spanish-lightgrey)

A small shop goes live with Nginx and MySQL/InnoDB on one server. The nightly peak is 800 to 1 200 concurrent users with 2 to 4 connections each. The case asks for how many processes, how many connections and how much memory to give two servers (A with 8 GB and 4 vCPU, B with 4 GB and 2 vCPU) and two deployment routes, native install and Docker. I calculated everything, then checked every number on a real VM resized to each scenario.

## Results

| | A native | A Docker | B native | B Docker |
| --- | --- | --- | --- | --- |
| Nginx workers | 4 | 2 | 2 | 1 |
| `worker_connections` | 7 204 | 7 202 | 7 202 | 7 201 |
| InnoDB buffer pool (MB) | 6 060 | 4 320 | 2 724 | 2 060 |
| `ab` requests/s (20 000 requests, 0 failed) | 52 337 | 27 938 | 33 023 | 9 714 |
| OOM events | 0 | 0 | 0 | 0 |

## Decisions the statement leaves open

- 1 GB is 1 024 MB, the way Linux and Docker count.
- The safety margin is subtracted after the formula. The formula's cache is the theoretical ceiling, and the buffer pool I configured is that number minus the margin.
- MySQL 5.7 rounds the buffer pool up to a multiple of `innodb_buffer_pool_chunk_size`, 128 MB by default. That would have turned 6 060 MB into 6 144 and eaten the margin, so I set the chunk to 4M with one instance and rounded down.
- `worker_rlimit_nofile` is 16 384, above `worker_connections`, so Nginx does not run out of descriptors before it runs out of connections.

## What I took from it

Native leaves more useful memory for MySQL, 5.92 GB against 4.22 GB in scenario A, because the overhead is 12.5 % and not 25 %. Docker gives hard limits, so an overflow is killed inside its own cgroup without taking the neighbour down. The 25 % Docker overhead is a budget reserve and not what the daemon uses, which I measured at 144 to 159 MB. A CPU quota shows up immediately. With 0.5 vCPU Nginx did less than a third of the native rate. The recommendation is to put MySQL on its own server before adding replicas.

However, two limits apply. The load test only touches Nginx, so the buffer pool was checked as a configured value that fits in RAM and not under query stress. And `ab` ran on the same VM over loopback, so the figures compare routes and are not absolute capacity.

## Files

- [`report.pdf`](report.pdf): 30 pages, 37 figures (Spanish)
- [`src/calc.py`](src/calc.py): the formulas as code
- [`src/`](src): `nginx.conf`, `mysql.cnf` and `docker-compose.yml` for each scenario and route
- [`screenshots/`](screenshots): one capture per step

The compose files use a throwaway root password for a VM that I shut down afterwards.
