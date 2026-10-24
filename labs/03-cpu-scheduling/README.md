# Lab 3: CPU scheduling

![type](https://img.shields.io/badge/type-lab-67e1fd?style=flat-square) ![env](https://img.shields.io/badge/env-Ubuntu%2018.04%20VM%20%C2%B7%20Python%203.8-262626?style=flat-square) ![report](https://img.shields.io/badge/report-Spanish-262626?style=flat-square)

Two parts, each with its own report. Guide: [lab3_planificacion_CPU](https://github.com/isacioutp/Sistema-Operativo-utp/tree/main/lab3_planificacion_CPU).

## 3A: Real scheduling in Linux

A heavy `sha256sum /dev/urandom` process plays an overloaded service, and the task is to change how Linux shares the CPU with `nice`, `renice`, `chrt` and `taskset` without restarting anything. Done on the Lab 1 VM (2 vCPUs).

- **NI vs PRI.** A process started with `nice -n 10` shows `pri` 9 against 19 for a normal process in `ps`, while the guide expected the nice process to have the higher number. The `pri` column of procps uses an inverted scale (139 minus the kernel priority). The `priority` column and `htop` show the kernel scale, 30 against 20, which matches the guide.
- **renice without privileges.** Raising the nice value works. Lowering it fails with `Permission denied`, even to go back to a value the same user had before. `ulimit -e` is 0, so only a process with `CAP_SYS_NICE` (for example through `sudo`) can lower it.
- **chrt.** Processes default to `SCHED_OTHER` with priority 0. Switching to `SCHED_FIFO` fails for a normal user and works with `sudo`. I tried it on a harmless `sleep` rather than a CPU-bound loop.
- **taskset.** Two processes pinned to core 0 split it 50.5 % / 49.5 % while core 1 sits idle. With three unpinned heavy processes on two cores, `htop` froze and new SSH sessions took minutes to open. The VirtualBox log again pointed at the Hyper-V/NEM fallback on the host.

## 3B: Scheduler simulator

The manager wants a scheduler for four nightly report jobs, and the decision has to come from data.

| Job | Arrival (s) | Burst (s) |
| --- | --- | --- |
| P1 | 0 | 8 |
| P2 | 1 | 4 |
| P3 | 2 | 9 |
| P4 | 3 | 5 |

Ubuntu 18.04 ships Python 3.6.9, which has no `dataclasses` module, so I installed `python3.8` alongside it without touching the system `python3`. The simulator from the course repo has an intentional bug: `sjf()` was a copy of `fcfs()` and sorted by arrival time. I rewrote it as non-preemptive SJF. At each step it takes the shortest burst among the jobs that have already arrived, and if none have arrived it jumps the clock to the next arrival. I checked every timeline by hand before trusting the output.

| Algorithm | Avg. waiting (s) | Avg. turnaround (s) |
| --- | --- | --- |
| FCFS | 8.75 | 15.25 |
| SJF | 7.75 | 14.25 |
| RR q=1 | 12.75 | 19.25 |
| RR q=3 | 13.50 | 20.00 |
| RR q=5 | 11.00 | 17.50 |
| RR q=100 | 8.75 | 15.25 |

The recommendation was non-preemptive SJF for this batch. The effect of the quantum is not monotonic. With q=3, P1 and P3 each need three turns and both finish near the end, so it comes out worse than q=1. A quantum of 100 is just FCFS, since no job ever uses up its slice. However, the simulator has two limits worth knowing. It charges nothing for context switches, and `round_robin()` queues every job at t=0 regardless of its arrival time, which does not change the result for this workload.

## Files

- [`lab3a-report.pdf`](lab3a-report.pdf), [`lab3b-report.pdf`](lab3b-report.pdf): submitted reports (Spanish)
- [`scheduler_sim.py`](scheduler_sim.py): simulator with the fixed `sjf()` and the quantum experiments
- [`timeline-lab3b.drawio`](timeline-lab3b.drawio) and its [PNG](timeline-lab3b.drawio.png): FCFS, SJF and RR (q=3) timelines
- [`screenshots/`](screenshots): `3a_*` and `3b_*` evidence

```bash
python3 scheduler_sim.py   # needs Python 3.7+
```
