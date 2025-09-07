CREATE TABLE mods (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  developer VARCHAR(255) NOT NULL,
  download_link TEXT NOT NULL,
  version VARCHAR(50) NOT NULL,
  platform VARCHAR(20) NOT NULL CHECK (platform IN ('Android', 'Windows', 'iPhone')),
  size VARCHAR(50) NOT NULL,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_mods_updated_at BEFORE UPDATE
    ON mods FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE POLICY "Enable read access for all users" ON mods FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON mods FOR INSERT WITH CHECK (true);

ALTER TABLE mods ENABLE ROW LEVEL SECURITY;

