# Lab 1: Preparing the Linux environment

The goal was to deploy the Linux VM used for the rest of the semester and prove it works: SSH access, the `test_proc` test program, and the four tools the course relies on (`gcc`, `make`, `strace`, `htop`). The guide offers two ways to build it, Terraform (option A) or Vagrant (option B). Guide: [lab1-preparacion-entorno](https://github.com/isacioutp/Sistema-Operativo-utp/tree/main/lab1-preparacion-entorno).

## What happened

I tried Terraform first. `terraform init` and `terraform plan` worked, and `terraform apply` did create and boot the VM, but after about 90 seconds it gave up with this error.

```text
Error: [ERROR] Wait VM until ready: waiting for VM (vm-sistemas-operativos) to become ready:
[ERROR] can't convert vbox network to terraform data: No match with get guestproperty output
```

The `terra-farm/virtualbox` provider asks VirtualBox for the guest IP, and that answer comes from the Guest Additions service inside the VM. `VBoxManage showvminfo` showed `GuestAdditionsRunLevel=0`, so the service was not running. The box ships Guest Additions built for VirtualBox 6.x, which do not load on 7.2. On top of that, `main.tf` gives the VM a single host-only adapter with no NAT, so provisioning could not have reached the internet anyway. The provider is still alpha and was never updated for VirtualBox 7.

So I deleted the half-built VM and switched to Vagrant, which finished without problems. Vagrant does not need the guest to report back, and it connects over a forwarded port (`127.0.0.1:2222` to the guest's port 22) with the private key it keeps in `.vagrant/`.

## Result

| Tool | Version |
| --- | --- |
| gcc | 7.5.0 |
| make | GNU Make 4.1 |
| strace | prints `UNKNOWN` (known Ubuntu 18.04 packaging quirk, the binary works) |
| htop | 2.1.0 |

The VM runs Ubuntu 18.04.6 LTS with kernel 4.15.0-212, 2 vCPUs, 1.9 GB of RAM and a 39 GB disk. `./test_proc` prints its PID, which changes on every run because each new process gets a fresh one from the kernel.

## Files

- [`report.pdf`](report.pdf): submitted report (Spanish)
- [`entrega.md`](entrega.md): the filled-in delivery template with every command and output
- [`infra/`](infra): `main.tf`, `variables.tf`, `Vagrantfile` and `scripts/setup_env.sh` from the course. I later added a forwarded port 8080 to the `Vagrantfile` for a Docker test
- [`screenshots/`](screenshots): evidence captures

## Reproduce

```bash
cd infra
vagrant up
vagrant ssh
cd ~/laboratorios/unidad1 && ./test_proc
```

The `.box` image and the `.vagrant/` folder are not in the repo. Vagrant downloads `ubuntu/bionic64` on the first `vagrant up`.
