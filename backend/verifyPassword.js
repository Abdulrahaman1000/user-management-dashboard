require('dotenv').config();
const bcrypt = require('bcryptjs');
const hash = "$2b$10$oT/y.RJWc4G0fgqoNF/14un02iKWxyZNWslBbsemytchdeyn2j7Ce";

async function verify() {
  const match = await bcrypt.compare("Admin@123", hash);
  console.log("Password matches?", match);
}

verify();