# CLI Server PHP

Aplikasi CLI Node.js ringan untuk menjalankan PHP built-in server secara instan dengan alokasi port acak otomatis dan langsung membuka browser bawaan.

## Penggunaan

1. Menjalankan server pada direktori saat ini:
   ```bash
   server
   ```
   Menjalankan: `php -S localhost:[portAcak]` lalu membuka browser ke alamat tersebut.

2. Menjalankan server pada sub-folder tertentu:
   ```bash
   server public
   ```
   Menjalankan: `php -S localhost:[portAcak] -t public` lalu membuka browser ke alamat tersebut.

## Instalasi Lokal (Development)

Untuk mengaktifkan perintah `server` di terminal Anda secara langsung dari repository lokal:
```bash
npm link
```

## Publish ke NPM Registry

```bash
npm login
npm publish --access public
```
