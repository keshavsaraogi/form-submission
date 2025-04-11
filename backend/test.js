import bcrypt from 'bcryptjs';

// This is the password you want to test (plaintext password)
const enteredPassword = 'admin123';

// This is the passwordHash from your MongoDB document
const storedHash = '$2b$10$VVOrzzYYgX9mKW1eZ5XVku1o1lAWoOJaQidmN09lhyfbi/GWwhrUm';

const comparePassword = async () => {
    const match = await bcrypt.compare(enteredPassword, storedHash);

    if (match) {
        console.log('✅ Password is correct!');
    } else {
        console.log('❌ Password is incorrect.');
    }
};

comparePassword();
