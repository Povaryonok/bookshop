const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const knex = require('knex')(require('./knexfile').development);
const session = require('express-session');
const app = express();
const port = 3000;

app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}));

// Middleware to check if user is authenticated as admin
function isAuthenticated(req, res, next) {
  if (req.session.user && req.session.user.username === 'admin') {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

// Middleware to check if user is authenticated
function isUserAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  }
  res.status(401).json({ error: 'Unauthorized' });
}

app.get('/api/books', (req, res) => {
  knex('books').select('*')
    .then(books => res.json(books))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/books', isAuthenticated, (req, res) => {
  knex('books').insert(req.body)
    .then(() => res.status(201).json(req.body))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.put('/api/books/:id', isAuthenticated, (req, res) => {
  knex('books').where('id', req.params.id).update(req.body)
    .then(() => res.status(200).json(req.body))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.delete('/api/books/:id', isAuthenticated, (req, res) => {
  knex('books').where('id', req.params.id).del()
    .then(() => res.status(204).send())
    .catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/register', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ error: 'Passwords do not match' });
  }

  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    knex('users').insert({
      username,
      email,
      password: hash
    }).then(() => {
      req.session.user = { username, email };
      res.status(201).json({ username, email });
    }).catch(err => res.status(500).json({ error: err.message }));
  });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;

  knex('users').where({ username }).first()
    .then(user => {
      if (!user) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }

      bcrypt.compare(password, user.password, (err, result) => {
        if (err || !result) {
          return res.status(400).json({ error: 'Invalid username or password' });
        }

        req.session.user = { username: user.username, email: user.email, id: user.id };
        res.status(200).json({ username: user.username, email: user.email });
      });
    }).catch(err => res.status(500).json({ error: err.message }));
});

app.post('/api/logout', (req, res) => {
  req.session.destroy();
  res.status(200).send();
});

// Endpoint to check if user is authenticated
app.get('/api/check-auth', (req, res) => {
  if (req.session.user) {
    res.status(200).json({ authenticated: true, user: req.session.user });
  } else {
    res.status(200).json({ authenticated: false });
  }
});

// Endpoint to handle book purchase or rental
app.post('/api/transaction', isUserAuthenticated, (req, res) => {
  const { book_id, type, duration } = req.body;
  const user_id = req.session.user.id;
  const start_date = new Date();
  let end_date = null;

  if (type === 'rent') {
    if (duration === '2_weeks') {
      end_date = new Date(start_date);
      end_date.setDate(start_date.getDate() + 14);
    } else if (duration === '1_month') {
      end_date = new Date(start_date);
      end_date.setMonth(start_date.getMonth() + 1);
    } else if (duration === '3_months') {
      end_date = new Date(start_date);
      end_date.setMonth(start_date.getMonth() + 3);
    }
  }

  knex('transactions').insert({
    user_id,
    book_id,
    type,
    start_date,
    end_date
  }).then(() => {
    res.status(201).json({ message: 'Transaction successful' });
  }).catch(err => res.status(500).json({ error: err.message }));
});

// Endpoint to get user's books
app.get('/api/user/books', isUserAuthenticated, (req, res) => {
  const user_id = req.session.user.id;

  knex('transactions')
    .join('books', 'transactions.book_id', 'books.id')
    .where('transactions.user_id', user_id)
    .select('books.*', 'transactions.type', 'transactions.start_date', 'transactions.end_date')
    .then(books => res.json(books))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Endpoint to get all users
app.get('/api/users', isAuthenticated, (req, res) => {
  knex('users').select('id', 'username', 'email')
    .then(users => res.json(users))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Endpoint to get books of a specific user
app.get('/api/users/:id/books', isAuthenticated, (req, res) => {
  const user_id = req.params.id;

  knex('transactions')
    .join('books', 'transactions.book_id', 'books.id')
    .where('transactions.user_id', user_id)
    .select('books.*', 'transactions.start_date', 'transactions.end_date')
    .then(books => res.json(books))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Endpoint to create a notification
app.post('/api/notifications', isAuthenticated, (req, res) => {
  const { user_id, message } = req.body;

  knex('notifications').insert({
    user_id,
    message
  }).then(() => {
    res.status(201).json({ message: 'Notification created' });
  }).catch(err => res.status(500).json({ error: err.message }));
});

// Endpoint to get notifications for a user
app.get('/api/notifications', isUserAuthenticated, (req, res) => {
  const user_id = req.session.user.id;

  knex('notifications')
    .where({ user_id, read: false })
    .select('*')
    .then(notifications => res.json(notifications))
    .catch(err => res.status(500).json({ error: err.message }));
});

// Endpoint to mark notifications as read
app.put('/api/notifications/:id/read', isUserAuthenticated, (req, res) => {
  const notification_id = req.params.id;

  knex('notifications')
    .where('id', notification_id)
    .update({ read: true })
    .then(() => res.status(200).json({ message: 'Notification marked as read' }))
    .catch(err => res.status(500).json({ error: err.message }));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
