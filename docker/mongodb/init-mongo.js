db = new Mongo().getDB('admin');
 
// 创建用户
db.createUser({
  user: 'kweaver',
  pwd: 'Kw1ea2ver',
  roles: [
    { role: 'readWrite', db: 'kweaver' }
  ]
});
