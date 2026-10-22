# Lab 5: File descriptors and durability

![type](https://img.shields.io/badge/type-lab-6ae0ff) ![env](https://img.shields.io/badge/env-Ubuntu%2018.04%20VM-lightgrey) ![report](https://img.shields.io/badge/report-Spanish-lightgrey)

Two production tickets, solved separately, each written up as hypothesis, command, result, decision, action.

## Ticket 1043: Nginx answers 502

The error log says `24: Too many open files`, CPU sits at 5 % and the network looks normal. It was neither a network problem nor a CPU one. The process had reached its limit of 1024 descriptors and the kernel refused the next one with `EMFILE`.

Still, measuring first was what helped. `/proc/<pid>/limits` showed the ceiling and `/proc/<pid>/fd` showed the trend, and `strace -c` found the cause without `lsof` or anything extra installed. For the second part I compared three processes. Two of them held the same number of descriptors at one instant, but one was healthy and one was leaking, so only the trend tells them apart, and a snapshot would not. The fix has three layers, which are closing what the code opens, raising the limit where the service is defined, and watching the count against a threshold.

## Ticket 1044: MySQL lost "committed" transactions

After a hard reboot the application believed some writes were safe. A `write()` returns once the data is in the page cache, which can stay only in RAM for up to 30 seconds. In my test the file written without `fsync` came back with 0 bytes after the crash, and the one written with `fsync` was complete. ext4 recovered cleanly in both cases, because the journal protects the structure of the filesystem and not data nobody asked to persist.

## Notes

- Everything ran inside the course VM, not in Docker, because the experiments touch global kernel state or reboot the machine.
- Nginx and MySQL were installed but stopped, so I reproduced the symptoms with equivalent test processes, as the statement allows. Nginx was only started at the end to check the descriptor limit under systemd.

## Files

- [`report.pdf`](report.pdf): submitted report, 26 pages (Spanish)
- [`src/`](src): the three test apps with their fixes in [`src/fix`](src/fix), plus `fakedb.py`
- [`screenshots/`](screenshots): terminal captures in step order
