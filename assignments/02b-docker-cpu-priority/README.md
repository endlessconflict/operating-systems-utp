# Assignment 2b: Process priority with Docker and CPU limits

![type](https://img.shields.io/badge/type-assignment-fd9330?style=flat-square) ![env](https://img.shields.io/badge/env-Ubuntu%2018.04%20%C2%B7%20Docker%2024-262626?style=flat-square) ![report](https://img.shields.io/badge/report-Spanish-262626?style=flat-square)

The course provides `app.py`, a small Flask service whose `/login` route sleeps 2 seconds (a fake database call) and then burns about 0.5 seconds of CPU on SHA-256 hashes. The task is to run it in a CPU-limited container, make it compete with 20 CPU-bound processes, and then give it priority, proving the result with response times and `htop`.

## Setup

- **`stress.py`** (written by me, the course did not ship one). It starts `STRESS_WORKERS` processes that spin in `while True`. I used processes rather than threads because Python threads share the GIL, and 20 threads would behave roughly like one.
- **`docker-compose.yml`**. `cpus: "1.0"` caps the container at one CPU through the cgroup quota. `cpuset: "0"` pins it to core 0, so everything fights over one core. `cap_add: SYS_NICE` is needed because Docker drops that capability by default, and without it a process cannot lower its nice value below 0 inside the container.
- **`Dockerfile`**. It runs `exec nice -n ${APP_NICE} python app.py`, so the app is PID 1 with whatever priority the variable sets.
- **`medir.py`**. It calls `/login` several times and appends each result to `resultados.csv`.

Changing scenario only means changing two environment variables:

```bash
docker compose build
docker compose up -d                                               # E1 and E2
APP_NICE=10  STRESS_NICE=0  docker compose up -d --force-recreate  # E3
APP_NICE=-10 STRESS_NICE=19 docker compose up -d --force-recreate  # E4
curl localhost:5000/start-cpu-stress
python3 medir.py E4 5
```

## Results

| Scenario | App nice | Stress nice | Avg. CPU part (s) | Avg. total (s) | vs. baseline | CPU share predicted by CFS weights |
| --- | --- | --- | --- | --- | --- | --- |
| E1 no stress | 0 | none | 0.495 | 2.502 | 1.0x | 100 % |
| E2 same priority | 0 | 0 | 10.206 | 12.313 | 4.9x | 1/21 ≈ 4.8 % |
| E3 stress has priority | 10 | 0 | 103.865 | 105.905 | 42.3x | 110/20590 ≈ 0.53 % |
| E4 app has priority | -10 | 19 | 0.487 | 2.495 | 1.0x | 9548/9848 ≈ 97 % |

The 2-second wait never changes, because a sleeping thread does not need the CPU. All of the slowdown lands on the hashing part. CFS weights predicted 10.5 s for E2 (measured 10.2 s) and about 94 s for E3 (measured 104 s). The gap in E3 probably comes from context switching among 21 processes. Between E3 and E4 only the two nice values changed, and login time went from almost two minutes back to 2.5 seconds while the 20 stress processes kept running.

The CPU limit and nice do different jobs. `cpus` and `cpuset` decide how much CPU the container gets in total, and nice decides how that CPU is split among the processes inside it.

## Files

- [`report.pdf`](report.pdf): submitted report (Spanish)
- [`src/`](src): `app.py` (from the course), `stress.py`, `Dockerfile`, `docker-compose.yml`, `medir.py` and the raw `resultados.csv`
- [`screenshots/`](screenshots): build, each scenario and the `htop` views
