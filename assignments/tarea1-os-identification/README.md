# Tarea 1: Identifying and classifying operating systems

The assignment compares Windows and Linux by looking at the running systems rather than reading about them, and it ends with a comparison table and five reflection questions.

## Part A: Windows 11 Pro

The machine is a Dell Inspiron 16 5645 running Windows 11 Pro build 26200. I checked it through the GUI first, with `winver` and Task Manager, and then again from the command prompt with `systeminfo` and `tasklist`.

Counting processes both ways did not give the same answer. Task Manager showed 208 entries across its three groups, while `tasklist | find /c /v ""` counted 273 processes. However, the gap is only about grouping. A single Task Manager row such as "Microsoft Teams (11)" can stand for eleven processes, and `tasklist` puts every one of them on its own line.

## Part B: Linux in a VM

The guide assumes the professor hands out a `.vdi` with Linux already installed. I did not get one, so I built an equivalent from the official Ubuntu Server 24.04 cloud image.

```bat
VBoxManage clonemedium disk "ubuntu-24.04-server-cloudimg-amd64.vmdk" "Lab1-Linux-DISCO-DOCENTE.vdi" --format VDI
VBoxManage modifymedium disk "Lab1-Linux-DISCO-DOCENTE.vdi" --resize 20480
```

The VM was created from that existing disk with 2 CPUs. Everything after the login was done with commands. `uname -a` and `/etc/os-release` show Ubuntu 24.04.4 LTS with kernel 6.8.0-138-generic, and the rest of the checks used `whoami`, `id`, `ps aux | wc -l`, `df`, `free`, `hostnamectl`, `nproc` and `lsblk`.

## Reflection questions

The five answers go into why the process counts differ and which OS structure a VirtualBox guest belongs to. That one is the virtual machine model, although the system inside it keeps its own monolithic kernel. They also compare how Windows and Linux handle multiple users and multitasking, which both do in different ways, and why Linux administration leans on the terminal.

## Files

- [`report.pdf`](report.pdf): submitted report (Spanish)
- [`screenshots/`](screenshots): `A_*` for Windows, `B_*` for Linux
- [`outputs/`](outputs): full `systeminfo` and `tasklist` output and the process count
