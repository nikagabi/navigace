const url = process.env.SUPABASE_URL;
const serviceKey = process.env.BOOTSTRAP_SERVICE_ROLE_KEY;
const email = process.argv[2];
const password = process.argv[3];

if (!url || !serviceKey || !email || !password) {
  console.error('Usage: node bootstrap-admin.mjs <email> <password> (needs SUPABASE_URL + BOOTSTRAP_SERVICE_ROLE_KEY in .env)');
  process.exit(1);
}

const res = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
  },
  body: JSON.stringify({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Admin' },
  }),
});

const data = await res.json();
console.log('status:', res.status);
console.log(JSON.stringify(data, null, 2));
