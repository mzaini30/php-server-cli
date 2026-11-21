#!/usr/bin/env node

import { spawn } from 'node:child_process';
import net from 'node:net';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

// Periksa ketersediaan port
function checkPortAvailable(port) {
  return new Promise((resolve) => {
    const srv = net.createServer();
    srv.once('error', () => resolve(false));
    srv.once('listening', () => {
      srv.close(() => resolve(true));
    });
    srv.listen(port, '127.0.0.1');
  });
}

// Dapatkan port acak yang belum terpakai
async function getAvailablePort() {
  for (let i = 0; i < 30; i++) {
    const randomPort = Math.floor(Math.random() * (9999 - 3000 + 1)) + 3000;
    if (await checkPortAvailable(randomPort)) {
      return randomPort;
    }
  }

  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on('error', reject);
  });
}

// Buka browser bawaan sistem operasi
function openBrowser(targetUrl) {
  const osType = process.platform;
  try {
    if (osType === 'win32') {
      spawn('cmd.exe', ['/c', 'start', '', targetUrl], { detached: true, stdio: 'ignore' }).unref();
    } else if (osType === 'darwin') {
      spawn('open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
    } else {
      spawn('xdg-open', [targetUrl], { detached: true, stdio: 'ignore' }).unref();
    }
  } catch (err) {
    console.error(`Gagal membuka browser secara otomatis: ${err.message}`);
  }
}

// Tunggu server PHP siap menerima request, lalu buka browser
function waitAndOpenBrowser(url, port) {
  let isOpened = false;
  const launch = () => {
    if (!isOpened) {
      isOpened = true;
      openBrowser(url);
    }
  };

  const startTime = Date.now();
  const timer = setInterval(() => {
    if (Date.now() - startTime > 3500) {
      clearInterval(timer);
      launch();
      return;
    }

    const req = http.get(url, () => {
      clearInterval(timer);
      launch();
    });

    req.on('error', () => {
      // Server belum siap, tunggu interval berikutnya
    });

    req.setTimeout(400, () => {
      req.destroy();
    });
  }, 150);
}

// Eksekusi utama
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Penggunaan:
  server              Menjalankan server di direktori saat ini
  server <folder>     Menjalankan server dengan root direktori tertentu
  server --help, -h   Menampilkan bantuan
`);
    process.exit(0);
  }

  let targetDirectory = null;
  for (const item of args) {
    if (!item.startsWith('-')) {
      targetDirectory = item;
      break;
    }
  }

  if (targetDirectory) {
    const fullPath = path.resolve(process.cwd(), targetDirectory);
    if (!fs.existsSync(fullPath)) {
      console.error(`\x1b[31m[Error] Folder "${targetDirectory}" tidak ditemukan.\x1b[0m`);
      process.exit(1);
    }
    const stat = fs.statSync(fullPath);
    if (!stat.isDirectory()) {
      console.error(`\x1b[31m[Error] "${targetDirectory}" bukan merupakan folder.\x1b[0m`);
      process.exit(1);
    }
  }

  const port = await getAvailablePort();
  const url = `http://localhost:${port}`;

  const phpArgs = ['-S', `localhost:${port}`];
  if (targetDirectory) {
    phpArgs.push('-t', targetDirectory);
  }

  console.log('\x1b[36m%s\x1b[0m', '--------------------------------------------------');
  console.log('\x1b[32m%s\x1b[0m', '⚡ PHP Development Server');
  console.log(`🔗 URL    : \x1b[34m${url}\x1b[0m`);
  console.log(`📂 Folder : \x1b[33m${targetDirectory ? targetDirectory : process.cwd()}\x1b[0m`);
  console.log(`🌐 Membuka browser default...`);
  console.log('Tekan Ctrl+C untuk menghentikan server.');
  console.log('\x1b[36m%s\x1b[0m', '--------------------------------------------------\n');

  waitAndOpenBrowser(url, port);

  const phpProcess = spawn('php', phpArgs, {
    stdio: 'inherit',
    shell: process.platform === 'win32'
  });

  phpProcess.on('error', (err) => {
    if (err.code === 'ENOENT') {
      console.error('\x1b[31m[Error] Perintah "php" tidak ditemukan.\x1b[0m');
      console.error('Pastikan PHP telah terpasang dan terdaftar di Environment PATH.');
    } else {
      console.error(`\x1b[31m[Error] Gagal menjalankan PHP: ${err.message}\x1b[0m`);
    }
    process.exit(1);
  });

  const cleanExit = () => {
    phpProcess.kill();
    process.exit(0);
  };

  process.on('SIGINT', cleanExit);
  process.on('SIGTERM', cleanExit);
}

main().catch((err) => {
  console.error(`Terjadi kesalahan: ${err.message}`);
  process.exit(1);
});
