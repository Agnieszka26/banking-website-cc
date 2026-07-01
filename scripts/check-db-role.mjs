import pg from "pg";
import "dotenv/config";

const client = new pg.Client({ connectionString: process.env.DIRECT_URL });
await client.connect();
const whoami = await client.query(
	"SELECT current_user, session_user, current_setting('role', true) AS role",
);
const roles = await client.query(
	"SELECT r.rolname FROM pg_roles r JOIN pg_auth_members m ON m.roleid = r.oid JOIN pg_roles u ON u.oid = m.member WHERE u.rolname = current_user",
);
console.log(whoami.rows);
console.log(roles.rows);
await client.end();
