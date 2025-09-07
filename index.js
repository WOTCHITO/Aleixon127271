import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(request, response) {
  try {
    const { id, name, description, version, developer, download_link, search } = request.query;

    let query = supabase.from('mods').select('id, name, description, version, developer, download_link');

    if (id) {
      query = query.eq('id', id);
    }
    if (name) {
      query = query.ilike('name', `%${name}%`);
    }
    if (description) {
      query = query.ilike('description', `%${description}%`);
    }
    if (version) {
      query = query.ilike('version', `%${version}%`);
    }
    if (developer) {
      query = query.ilike('developer', `%${developer}%`);
    }
    if (download_link) {
      query = query.ilike('download_link', `%${download_link}%`);
    }
    if (search) {
        // This will use the full-text search capabilities we're setting up
        // Ensure your Supabase table has the search_vector column and trigger
        query = query.textSearch('search_vector', search);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return response.status(500).json({ error: error.message });
    }

    return response.status(200).json(data);
  } catch (error) {
    console.error('API handler error:', error);
    return response.status(500).json({ error: 'Internal Server Error' });
  }
}
