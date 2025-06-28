const http = require('http');

const routes = [
  '/login',
  '/signup', 
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/confirm',
  '/forgot-password' // test if old route still exists
];

console.log('Testing auth routes on http://localhost:3000...\n');

routes.forEach(route => {
  http.get(`http://localhost:3000${route}`, (res) => {
    console.log(`${route}: ${res.statusCode} ${res.statusMessage}`);
  }).on('error', (err) => {
    console.log(`${route}: ERROR - ${err.message}`);
  });
});