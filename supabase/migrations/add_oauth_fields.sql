-- Add OAuth-related fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS auth_provider text DEFAULT 'email',
ADD COLUMN IF NOT EXISTS avatar_url text;

-- Add index for auth provider
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);

-- Update audit logs to support OAuth actions
ALTER TABLE audit_logs 
ADD COLUMN IF NOT EXISTS ip_address text,
ADD COLUMN IF NOT EXISTS user_agent text;

-- Create OAuth connections table for tracking linked accounts
CREATE TABLE IF NOT EXISTS oauth_connections (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    provider text NOT NULL,
    provider_user_id text NOT NULL,
    provider_email text,
    provider_data jsonb,
    connected_at timestamptz DEFAULT now(),
    last_used timestamptz DEFAULT now(),
    UNIQUE(provider, provider_user_id)
);

-- Create index for OAuth connections
CREATE INDEX idx_oauth_connections_user_id ON oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_provider ON oauth_connections(provider);

-- Add comment
COMMENT ON TABLE oauth_connections IS 'Tracks OAuth provider connections for users';

-- Grant permissions
GRANT SELECT ON oauth_connections TO authenticated;
GRANT INSERT, UPDATE ON oauth_connections TO service_role;