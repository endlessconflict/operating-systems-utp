# Assignment 2a: Comparing operating system structures

![type](https://img.shields.io/badge/type-assignment-fd9330?style=flat-square) ![env](https://img.shields.io/badge/env-research-262626?style=flat-square) ![report](https://img.shields.io/badge/report-Spanish-262626?style=flat-square)

A two-page comparison of five ways to organize an operating system, which are the monolithic, layered, microkernel, virtual machine and client/server designs. The table gives each one's organization, pros and cons, plus real systems built that way, such as Linux, MINIX 3, QNX or VMware ESXi. The report closes with two analysis questions.

**A. A driver crashes on a monolithic kernel and on a microkernel.** On a monolithic kernel the driver runs in the kernel's address space at ring 0, so a bad pointer corrupts kernel memory and the system has to stop (a kernel panic or a blue screen). On a microkernel the driver is an ordinary user-space process. The MMU blocks the invalid access, only that process dies, and it can be restarted. Put simply, the monolithic design bets that its drivers will not fail, while the microkernel assumes they will and is built around that assumption.

**B. Why Linux and Windows NT are called hybrids.** They start from opposite ends. NT was designed with microkernel ideas and moved components into kernel mode for performance, starting with NT 4.0. Linux is monolithic but gained loadable modules that can be added and removed at runtime. Both ended up in the middle.

## Files

- [`report.pdf`](report.pdf): submitted report (Spanish)
