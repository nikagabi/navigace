import { Pool } from 'pg';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SEED_SERVICE_ROLE_KEY;
const DB_URL = process.env.MIGRATION_DATABASE_URL;
const MOCK_PASSWORD = process.env.MOCK_SEED_PASSWORD;
if (!MOCK_PASSWORD) {
  console.error('Nastav MOCK_SEED_PASSWORD v env (heslo pro nově vytvořené mock účty).');
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_KEY || !DB_URL) {
  console.error('Potřebuju SUPABASE_URL, SEED_SERVICE_ROLE_KEY a MIGRATION_DATABASE_URL v env.');
  process.exit(1);
}

function toAscii(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function isoDate(d) {
  return d.toISOString().slice(0, 10);
}

function randomDateBetween(yearsAgoMax, yearsAgoMin) {
  const now = Date.now();
  const ms = randomInt(yearsAgoMin * 365, yearsAgoMax * 365) * 24 * 60 * 60 * 1000;
  return new Date(now - ms);
}

const MALE_NAMES = ['Jan', 'Petr', 'Tomáš', 'Martin', 'Jakub', 'Lukáš', 'Michal', 'Ondřej', 'Filip', 'David', 'Daniel', 'Vojtěch', 'Adam', 'Matěj', 'Šimon', 'Marek', 'Pavel', 'Radek', 'Roman', 'Karel'];
const FEMALE_NAMES = ['Eva', 'Lucie', 'Tereza', 'Kateřina', 'Jana', 'Petra', 'Lenka', 'Veronika', 'Markéta', 'Hana', 'Alena', 'Barbora', 'Kristýna', 'Monika', 'Simona', 'Anna', 'Klára', 'Zuzana', 'Michaela', 'Andrea'];

const SURNAMES = [
  ['Novák', 'Nováková'], ['Svoboda', 'Svobodová'], ['Novotný', 'Novotná'], ['Dvořák', 'Dvořáková'],
  ['Černý', 'Černá'], ['Procházka', 'Procházková'], ['Kučera', 'Kučerová'], ['Veselý', 'Veselá'],
  ['Horák', 'Horáková'], ['Němec', 'Němcová'], ['Pokorný', 'Pokorná'], ['Marek', 'Marková'],
  ['Pospíšil', 'Pospíšilová'], ['Hájek', 'Hájková'], ['Jelínek', 'Jelínková'], ['Král', 'Králová'],
  ['Růžička', 'Růžičková'], ['Beneš', 'Benešová'], ['Fiala', 'Fialová'], ['Sedláček', 'Sedláčková'],
  ['Zeman', 'Zemanová'], ['Kolář', 'Kolářová'], ['Bartoš', 'Bartošová'], ['Vaněk', 'Vaňková'],
  ['Doležal', 'Doležalová'], ['Mareš', 'Marešová'], ['Holub', 'Holubová'], ['Urban', 'Urbanová'],
  ['Kopecký', 'Kopecká'], ['Šimek', 'Šimková'], ['Vlček', 'Vlčková'], ['Musil', 'Musilová'], ['Krejčí', 'Krejčová'],
];

const CITIES = [
  ['Praha', '110 00'], ['Brno', '602 00'], ['Ostrava', '702 00'], ['Plzeň', '301 00'],
  ['Liberec', '460 01'], ['Olomouc', '779 00'], ['Hradec Králové', '500 02'], ['Pardubice', '530 02'],
  ['Zlín', '760 01'], ['Jihlava', '586 01'],
];

const ZAMESTNANEC_POSITIONS = ['Operátor výroby', 'Skladník', 'Montážní dělník', 'Technik kvality', 'Obsluha CNC', 'Svářeč', 'Logistik', 'Pracovník údržby'];
const ZAMESTNANEC_TASKS = ['Montáž dílů na lince 2', 'Kontrola kvality výstupní dávky', 'Naskladnění materiálu', 'Obsluha CNC frézky', 'Svařování konstrukčních dílů', 'Údržba výrobní linky', 'Příprava zakázky k expedici', 'Balení hotových výrobků'];

const people = [];

function buildPerson(role, crew) {
  const gender = Math.random() < 0.5 ? 'M' : 'F';
  const firstName = pick(gender === 'M' ? MALE_NAMES : FEMALE_NAMES);
  const surnamePair = SURNAMES[people.length % SURNAMES.length];
  const lastName = gender === 'M' ? surnamePair[0] : surnamePair[1];
  const [city, postal] = pick(CITIES);
  const birthDate = randomDateBetween(58, 22);
  const hireDate = randomDateBetween(8, 0.2);

  return {
    role,
    crew,
    gender,
    firstName,
    lastName,
    email: `${toAscii(firstName)}.${toAscii(lastName)}@navigace.local`,
    birthDate: isoDate(birthDate),
    phone: `+420 6${randomInt(0, 9)}${randomInt(100, 999)} ${randomInt(100, 999)}`,
    personalEmail: `${toAscii(firstName)}.${toAscii(lastName)}@gmail-mock.test`,
    address: `${pick(['Hlavní', 'Lipová', 'Krátká', 'Polní', 'Nádražní'])} ${randomInt(1, 99)}`,
    city,
    postal,
    maritalStatus: pick(['svobodný/á', 'vdaný/ženatý', 'rozvedený/á']),
    education: pick(['středoškolské s maturitou', 'vyučen/a', 'vysokoškolské']),
    emergencyContactName: `${pick(gender === 'M' ? FEMALE_NAMES : MALE_NAMES)} ${lastName}`,
    emergencyContactPhone: `+420 7${randomInt(0, 9)}${randomInt(100, 999)} ${randomInt(100, 999)}`,
    bankAccount: `${randomInt(100000000, 999999999)}/0100`,
    department: 'Výroba',
    hireDate: isoDate(hireDate),
    employmentType: 'plný úvazek',
    contractType: Math.random() < 0.85 ? 'na dobu neurčitou' : 'na dobu určitou',
  };
}

people.push({ ...buildPerson('manazer', null), positionTitle: 'Provozní manažer' });
people.push({ ...buildPerson('mistr', 'A'), positionTitle: 'Mistr výroby – Směna A' });
people.push({ ...buildPerson('mistr', 'B'), positionTitle: 'Mistr výroby – Směna B' });
for (let i = 0; i < 15; i++) {
  people.push({ ...buildPerson('zamestnanec', 'A'), positionTitle: pick(ZAMESTNANEC_POSITIONS) });
}
for (let i = 0; i < 15; i++) {
  people.push({ ...buildPerson('zamestnanec', 'B'), positionTitle: pick(ZAMESTNANEC_POSITIONS) });
}

function salaryFor(role) {
  if (role === 'manazer') return 58000;
  if (role === 'mistr') return randomInt(42000, 48000);
  return randomInt(28000, 38000);
}

function vacationFor(role) {
  return role === 'manazer' ? 25 : 20;
}

async function createAuthUser(person) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
    body: JSON.stringify({
      email: person.email,
      password: MOCK_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: `${person.firstName} ${person.lastName}` },
    }),
  });
  const data = await res.json();
  if (res.ok) return data.id;

  // Už existuje z předchozího (přerušeného) běhu — najdi ho v DB.
  const existing = await pool.query('select id from auth.users where email = $1', [person.email]);
  if (existing.rows.length > 0) return existing.rows[0].id;

  throw new Error(`Vytvoření ${person.email} selhalo: ${JSON.stringify(data)}`);
}

const pool = new Pool({ connectionString: DB_URL, ssl: { rejectUnauthorized: false }, max: 3 });

async function main() {
  const { rows } = await pool.query("select id from auth.users where email = 'admin@navigace.local'");
  if (rows.length === 0) throw new Error('admin@navigace.local nenalezen — nejdřív vytvoř ředitele.');
  const directorId = rows[0].id;

  await pool.query(
    `insert into public.employee_profiles (user_id, first_name, last_name, position_title, department, hire_date, employment_type, contract_type)
     values ($1, 'Admin', 'Ředitel', 'Ředitel společnosti', 'Vedení', current_date, 'plný úvazek', 'na dobu neurčitou')
     on conflict (user_id) do nothing`,
    [directorId]
  );

  console.log('Vytvářím účty...');
  for (const person of people) {
    person.userId = await createAuthUser(person);
    process.stdout.write('.');
  }
  console.log('\nVšechny účty vytvořeny (nové i znovu nalezené z předchozího běhu).');

  const manazer = people.find(p => p.role === 'manazer');
  const mistrA = people.find(p => p.role === 'mistr' && p.crew === 'A');
  const mistrB = people.find(p => p.role === 'mistr' && p.crew === 'B');

  for (const person of people) {
    const supervisorId =
      person.role === 'manazer' ? directorId :
      person.role === 'mistr' ? manazer.userId :
      person.crew === 'A' ? mistrA.userId : mistrB.userId;

    // role: 'employee' navíc, aby fungoval i původní dokumentový chat
    await pool.query(
      `insert into public.user_roles (user_id, role) values ($1, 'employee') on conflict do nothing`,
      [person.userId]
    );
    await pool.query(
      `insert into public.user_roles (user_id, role) values ($1, $2) on conflict do nothing`,
      [person.userId, person.role]
    );

    await pool.query(
      `insert into public.employee_profiles
        (user_id, first_name, last_name, birth_date, phone, personal_email, address, city, postal_code,
         marital_status, education, emergency_contact_name, emergency_contact_phone, bank_account,
         position_title, department, crew_name, hire_date, employment_type, contract_type, supervisor_id)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       on conflict (user_id) do nothing`,
      [
        person.userId, person.firstName, person.lastName, person.birthDate, person.phone, person.personalEmail,
        person.address, person.city, person.postal, person.maritalStatus, person.education,
        person.emergencyContactName, person.emergencyContactPhone, person.bankAccount,
        person.positionTitle, person.department, person.crew ? `Směna ${person.crew}` : null,
        person.hireDate, person.employmentType, person.contractType, supervisorId,
      ]
    );

    // Idempotence: smaž případná data z přerušeného běhu, než vložíš nová.
    await pool.query('delete from public.payslips where user_id = $1', [person.userId]);
    await pool.query('delete from public.benefits where user_id = $1', [person.userId]);
    await pool.query('delete from public.business_trips where user_id = $1', [person.userId]);
    await pool.query('delete from public.work_logs where user_id = $1', [person.userId]);

    const entitled = vacationFor(person.role);
    const used = randomInt(0, 15);
    await pool.query(
      `insert into public.vacation_balances (user_id, year, days_entitled, days_used)
       values ($1, extract(year from current_date)::int, $2, $3)
       on conflict (user_id, year) do nothing`,
      [person.userId, entitled, used]
    );

    const baseSalary = salaryFor(person.role);
    for (let m = 0; m < 3; m++) {
      const period = new Date();
      period.setMonth(period.getMonth() - m);
      const periodStr = `${period.getFullYear()}-${String(period.getMonth() + 1).padStart(2, '0')}`;
      const bonus = randomInt(0, 3000);
      const gross = baseSalary + bonus;
      const net = Math.round(gross * 0.78);
      await pool.query(
        `insert into public.payslips (user_id, period, gross_salary, net_salary, bonuses, deductions)
         values ($1, $2, $3, $4, $5, $6)`,
        [person.userId, periodStr, gross, net, bonus, Math.round(gross * 0.22)]
      );
    }

    const benefitPool = [
      ['Stravenky', 150, 'Hodnota stravenky na den'],
      ['MultiSport karta', 800, 'Měsíční příspěvek na sportovní aktivity'],
      ['Příspěvek na penzijní připojištění', 500, 'Měsíční příspěvek'],
    ];
    if (person.role === 'manazer') benefitPool.push(['Home office', null, '2 dny týdně']);
    const benefitCount = randomInt(1, 3);
    for (const [name, value, desc] of benefitPool.slice(0, benefitCount)) {
      await pool.query(
        `insert into public.benefits (user_id, name, value_czk, description) values ($1, $2, $3, $4)`,
        [person.userId, name, value, desc]
      );
    }

    if (Math.random() < 0.3) {
      const start = randomDateBetween(0.3, 0.05);
      const end = new Date(start.getTime() + randomInt(1, 4) * 24 * 60 * 60 * 1000);
      await pool.query(
        `insert into public.business_trips (user_id, destination, purpose, start_date, end_date, status)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          person.userId,
          pick(['Brno', 'Ostrava', 'Plzeň', 'Mnichov', 'Vídeň', 'Bratislava']),
          pick(['Jednání se zákazníkem', 'Servisní zásah', 'Školení', 'Audit kvality']),
          isoDate(start), isoDate(end),
          pick(['planovana', 'probiha', 'dokoncena']),
        ]
      );
    }

    for (let d = 0; d < 5; d++) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const status = Math.random() < 0.1 ? pick(['chybi', 'nedokonceno']) : 'odvedeno';
      await pool.query(
        `insert into public.work_logs (user_id, work_date, description, hours, status)
         values ($1, $2, $3, $4, $5)`,
        [person.userId, isoDate(date), pick(ZAMESTNANEC_TASKS), randomInt(6, 9), status]
      );
    }

    process.stdout.write('.');
  }
  console.log('\nHR data vyplněna.');

  await pool.query('delete from public.work_orders');
  await pool.query('delete from public.warehouse_items');

  const clients = ['AutoTech s.r.o.', 'Metalplast a.s.', '022 Industries', 'Nordic Parts', 'ElektroVer s.r.o.'];
  const assignable = people.filter(p => p.role !== 'manazer');
  for (let i = 0; i < 12; i++) {
    const assignee = pick(assignable);
    const start = randomDateBetween(1, 0);
    const end = new Date(start.getTime() + randomInt(3, 20) * 24 * 60 * 60 * 1000);
    await pool.query(
      `insert into public.work_orders (name, client, status, assigned_to, start_date, end_date, notes)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        `Zakázka #2026-${String(i + 1).padStart(3, '0')}`,
        pick(clients),
        pick(['planovana', 'probiha', 'hotovo']),
        assignee.userId,
        isoDate(start), isoDate(end),
        'Mock zakázka pro demo účely',
      ]
    );
  }

  const items = [
    ['Ocelový plech 2mm', 'ks'], ['Šrouby M8', 'ks'], ['Pracovní rukavice', 'ks'], ['Olej hydraulický', 'l'],
    ['Svařovací drát', 'kg'], ['Palety EUR', 'ks'], ['Ochranné brýle', 'ks'], ['Filtry vzduchové', 'ks'],
    ['Barva základní', 'l'], ['Lepicí páska', 'ks'], ['Kabel elektrický', 'm'], ['Hadice pneumatická', 'm'],
  ];
  for (const [name, unit] of items) {
    await pool.query(
      `insert into public.warehouse_items (item_name, quantity, unit, location) values ($1, $2, $3, $4)`,
      [name, randomInt(5, 500), unit, pick(['Sklad A - regál 1', 'Sklad A - regál 2', 'Sklad B - regál 1'])]
    );
  }

  console.log('\n=== PŘIHLAŠOVACÍ ÚDAJE (mock, sdílené heslo pro testování) ===');
  console.log(`Heslo pro všechny nové účty: ${MOCK_PASSWORD}\n`);
  console.log('Email'.padEnd(40), 'Role'.padEnd(14), 'Jméno', '(směna)');
  for (const p of people) {
    console.log(
      p.email.padEnd(40),
      p.role.padEnd(14),
      `${p.firstName} ${p.lastName}`,
      p.crew ? `(Směna ${p.crew})` : ''
    );
  }
}

main()
  .catch(err => { console.error('CHYBA:', err.message); process.exitCode = 1; })
  .finally(() => pool.end());
