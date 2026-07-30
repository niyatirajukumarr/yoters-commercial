-- Add unique constraints for email and phone to prevent duplicates per user

-- Add unique constraint on email (allow NULL for users without email)
ALTER TABLE profiles ADD CONSTRAINT unique_email_per_user
  UNIQUE (email) WHERE email IS NOT NULL;

-- Add unique constraint on phone (allow NULL for users without phone)
ALTER TABLE profiles ADD CONSTRAINT unique_phone_per_user
  UNIQUE (phone) WHERE phone IS NOT NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
