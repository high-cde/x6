# ZDOS VPS State - Tue Nov 10 01:15:58 CET 2026

## Servizi attivi
  nginx.service               loaded active running A high performance web server and a reverse proxy server
  velvethub.service           loaded active running VelvetHub backend
  zdos-faucet.service         loaded active running ZDOS Real DSN Faucet Backend
  zdos-miner.service          loaded active running ZDOS Real zAI Miner Worker

## Nginx sites-enabled
total 12
drwxr-xr-x 2 root root 4096 Nov  8 00:01 .
drwxr-xr-x 8 root root 4096 Nov  9 09:26 ..
lrwxrwxrwx 1 root root   36 Nov  2 00:12 enet-live -> /etc/nginx/sites-available/enet-live
lrwxrwxrwx 1 root root   36 Oct 26 02:08 ourvelvet -> /etc/nginx/sites-available/ourvelvet
lrwxrwxrwx 1 root root   36 Nov  7 19:13 velvethub -> /etc/nginx/sites-available/velvethub
-rw-r--r-- 1 root root  206 Oct 27 14:22 velvethub.art
lrwxrwxrwx 1 root root   40 Oct 27 14:13 x-zdos-portal -> /etc/nginx/sites-available/x-zdos-portal
lrwxrwxrwx 1 root root   32 Nov  8 00:01 zswap -> /etc/nginx/sites-available/zswap

## Directory principali
### /var/www
total 56
drwxr-xr-x 11 root     root     4096 Nov  8 00:01 .
drwxr-xr-x 14 root     root     4096 Sep  9 18:21 ..
lrwxrwxrwx  1 root     root       17 Oct 15 19:36 app.x-zdos.it -> /srv/zv40/current
lrwxrwxrwx  1 root     root       40 Oct 15 00:36 app.x-zdos.it.current -> /srv/zv40/releases/zv40-20261014T223552Z
drwxr-xr-x  2 www-data www-data 4096 Nov  2 00:11 enet-live
drwxr-xr-x 16 www-data www-data 4096 Nov  6 19:42 html
drwxr-xr-x  5 www-data www-data 4096 Oct 24 00:27 hub-zdos
drwxr-xr-x  2 www-data www-data 4096 Oct 26 02:08 ourvelvet
-rw-r--r--  1 root     root       82 Oct 19 22:56 package-lock.json
drwxr-xr-x  4 www-data www-data 4096 Sep 25 01:22 velvet.art
drwxr-xr-x 11 www-data www-data 4096 Nov  6 20:30 velvethub
-rwxr-xr-x  1 www-data www-data 4316 Oct 19 23:45 x-
drwxr-xr-x 18 www-data www-data 4096 Nov  2 00:00 x-zdos
drwxr-xr-x  3 root     root     4096 Oct 27 14:13 x-zdos-portal
lrwxrwxrwx  1 root     root       17 Oct 15 19:36 x-zdos.it -> /srv/zv40/current
lrwxrwxrwx  1 root     root       40 Oct 15 00:36 x-zdos.it.current -> /srv/zv40/releases/zv40-20261014T223552Z
drwxr-xr-x  3 www-data www-data 4096 Nov  8 00:44 zswap

### /opt
total 72
drwxr-xr-x 18 root      root      4096 Nov 10 01:12 .
drwxr-xr-x 19 root      root      4096 Sep  9 20:22 ..
drwxr-xr-x  8 root      root      4096 Nov  3 00:17 Zdos-K.I.R.A
drwxr-xr-x 10 root      root      4096 Oct  5 00:33 android-sdk
drwx--x--x  4 root      root      4096 Nov  3 00:18 containerd
drwxr-xr-x  8 root      root      4096 Sep 16 21:40 red-velvet
drwxr-xr-x 19 velvethub velvethub 4096 Nov  7 19:03 velvethub
drwxr-xr-x  4 root      root      4096 Nov  7 12:21 x-zdos-dsn
drwxr-xr-x  4 root      root      4096 Sep 10 00:21 xzdos-portfolio
drwxr-xr-x 10 root      root      4096 Sep 10 20:35 xzdos-unified-webapp
drwxr-xr-x 10 root      root      4096 Sep  9 22:31 xzdos-vps-bundle
drwxr-x--- 13 root      root      4096 Oct  5 00:48 zdos-agent
drwxr-xr-x  6 root      root      4096 Sep  9 20:25 zdos-build
drwxr-xr-x  3 zdos-node zdos-node 4096 Sep  9 19:17 zdos-node
drwxr-x---  2 root      zdos-node 4096 Sep  9 21:14 zdos-supernode
drwxr-xr-x  2 zquest    zquest    4096 Nov 10 01:12 zquest
drwxr-xr-x  9 ubuntu    ubuntu    4096 Oct 15 00:19 zv40
drwxr-xr-x  9 ubuntu    ubuntu    4096 Oct 15 00:19 zv40.backup.20261014T223552Z
