# Presentations

## OOM killer

A 17-slide class presentation on how Linux handles running out of memory. It is built around six questions. It asks what it means for a process to use memory, and why Linux overcommits (with the three `vm.overcommit_memory` policies). It covers how the kernel measures available memory, what the OOM killer is, and why the kernel kills a process instead of failing the allocation. That part walks through `oom_badness()` and `oom_score_adj`. The last question is what happens after the kill. It closes with OOM inside cgroups and Kubernetes and with the traces the kernel always leaves behind.

- [`oom-killer.pdf`](oom-killer.pdf): readable on GitHub
- [`oom-killer.pptx`](oom-killer.pptx): original slides (Spanish)

Tarea 3 later put the same topic into practice, see [tarea3-oom-killer-incident](../assignments/tarea3-oom-killer-incident).
