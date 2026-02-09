
CREATE TYPE pee_status AS ENUM ('yes', 'no');

ALTER TABLE activity_records 
  ADD COLUMN pee_status pee_status DEFAULT 'yes',
  ADD COLUMN notes text;
