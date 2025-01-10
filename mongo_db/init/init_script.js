var rootUser = _getEnv("MONGO_INITDB_ROOT_USERNAME");
var rootPwd = _getEnv("MONGO_INITDB_ROOT_PASSWORD");
var rootDb = db.getSiblingDB('admin');

if (db.system.users.find({ user: rootUser }).count() === 0) {
  db.createUser({
    user: rootUser,
    pwd: rootPwd,
    roles: [{ role: "root", db: rootDb }]
  });
}

var dbUser = _getEnv("MONGO_DB_USERNAME");
var dbPwd = _getEnv("MONGO_DB_PASSWORD");
var mainDbName = _getEnv("MONGO_INITDB_DATABASE");

if (db.system.users.find({ user: dbUser }).count() === 0) {
  db.createUser({
    user: dbUser,
    pwd: dbPwd,
    roles: [
      { role: "readWrite", db: mainDbName },
      { role: "dbAdmin", db: mainDbName }
    ]
  });
}