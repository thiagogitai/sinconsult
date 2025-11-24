import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';

const db = new sqlite3.Database('./database.sqlite');

// Create test user
const email = 'test@example.com';
const password = 'test123';
const hashedPassword = await bcrypt.hash(password, 10);

db.run(`INSERT OR REPLACE INTO users (email, password, name, role) VALUES (?, ?, ?, ?)`, 
  [email, hashedPassword, 'Test User', 'admin'], 
  function(err) {
    if (err) {
      console.error('Error creating user:', err);
    } else {
      console.log('Test user created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
    }
    db.close();
  }
);