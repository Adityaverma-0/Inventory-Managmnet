import fs from 'node:fs';
import crypto from 'node:crypto';
import { hashPassword } from './security.js';
const envPath = new URL('./.env', import.meta.url);
const contents = fs.existsSync(envPath) ? fs.readFileSync(envPath,'utf8') : '';
if (/^ADMIN_PASSWORD_HASH=.+/m.test(contents)) {
  console.log('Admin credentials already configured; no changes made.');
} else {
  const password = crypto.randomBytes(24).toString('base64url');
  fs.writeFileSync(new URL('./admin-bootstrap.txt',import.meta.url), `Username: admin\nPassword: ${password}\nKeep this file private. It is excluded from Git.\n`, {mode:0o600,flag:'wx'});
  fs.appendFileSync(envPath, `\nADMIN_USERNAME=admin\nADMIN_PASSWORD_HASH=${hashPassword(password)}\n`,{mode:0o600});
  fs.chmodSync(envPath,0o600);
  console.log('Admin configured. Initial credentials are in backend/admin-bootstrap.txt (owner access only).');
}
