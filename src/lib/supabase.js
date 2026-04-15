import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: { params: { eventsPerSecond: 10 } }
})

// Table names
export const TABLES = {
  USERS: 'users_olshopper',
  STORES: 'stores_olshopper',
  STORE_VISITS: 'store_visits_olshopper',
  MESSAGES: 'messages_olshopper',
  CONVERSATIONS: 'conversations_olshopper',
  FOLLOWERS: 'followers_olshopper',
  NOTIFICATIONS: 'notifications_olshopper',
  REPORTS: 'reports_olshopper',
  GLOBAL_CHAT: 'global_chat_olshopper',
}

export const initDatabase = async () => {
  // Users table
  await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        pin_hash TEXT NOT NULL,
        avatar_url TEXT,
        bio TEXT DEFAULT '',
        is_admin BOOLEAN DEFAULT false,
        is_banned BOOLEAN DEFAULT false,
        ban_reason TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        follower_count INT DEFAULT 0,
        following_count INT DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS ${TABLES.STORES} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
        username TEXT UNIQUE NOT NULL,
        store_name TEXT NOT NULL,
        tagline TEXT DEFAULT '',
        description TEXT DEFAULT '',
        template TEXT DEFAULT 'minimal',
        primary_color TEXT DEFAULT '#000000',
        secondary_color TEXT DEFAULT '#ffffff',
        accent_color TEXT DEFAULT '#888888',
        bg_color TEXT DEFAULT '#ffffff',
        font_family TEXT DEFAULT 'Outfit',
        header_style TEXT DEFAULT 'centered',
        logo_url TEXT,
        banner_url TEXT,
        gallery_images JSONB DEFAULT '[]',
        products JSONB DEFAULT '[]',
        social_links JSONB DEFAULT '{"whatsapp":"","instagram":"","telegram":"","tiktok":"","youtube":"","twitter":"","facebook":"","email":"","phone":""}',
        address TEXT DEFAULT '',
        city TEXT DEFAULT '',
        province TEXT DEFAULT '',
        custom_buttons JSONB DEFAULT '[]',
        is_published BOOLEAN DEFAULT true,
        visit_count INT DEFAULT 0,
        weekly_visits INT DEFAULT 0,
        monthly_visits INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ${TABLES.STORE_VISITS} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        store_id UUID REFERENCES ${TABLES.STORES}(id) ON DELETE CASCADE,
        visitor_ip TEXT,
        visited_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ${TABLES.CONVERSATIONS} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        participant_1 UUID REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
        participant_2 UUID REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
        last_message TEXT DEFAULT '',
        last_message_at TIMESTAMPTZ DEFAULT NOW(),
        unread_1 INT DEFAULT 0,
        unread_2 INT DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ${TABLES.MESSAGES} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        conversation_id UUID REFERENCES ${TABLES.CONVERSATIONS}(id) ON DELETE CASCADE,
        sender_id UUID REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ${TABLES.FOLLOWERS} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        follower_id UUID REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
        following_id UUID REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(follower_id, following_id)
      );

      CREATE TABLE IF NOT EXISTS ${TABLES.NOTIFICATIONS} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        body TEXT DEFAULT '',
        is_read BOOLEAN DEFAULT false,
        from_user_id UUID,
        ref_id TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ${TABLES.REPORTS} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        reporter_id UUID REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
        reported_user_id UUID,
        reported_store_id UUID,
        type TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ${TABLES.GLOBAL_CHAT} (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID REFERENCES ${TABLES.USERS}(id) ON DELETE CASCADE,
        username TEXT NOT NULL,
        avatar_url TEXT,
        message TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
  })
}

// Hash function (simple for demo - use bcrypt in production)
export const hashString = async (str) => {
  const encoder = new TextEncoder()
  const data = encoder.encode(str + 'alnafyweb_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export const verifyHash = async (str, hash) => {
  const computed = await hashString(str)
  return computed === hash
}
