import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const supabaseUrl = 'https://xgptcribksljbincffia.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhncHRjcmlia3NsamJpbmNmZmlhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MjMzOTYsImV4cCI6MjA3MjE5OTM5Nn0.5JKb4REp6KUycVLWqM_02jyC7NHM3inS6U3VllL1UnM'

export const supabase = createClient(supabaseUrl, supabaseKey)

export const createMod = async (modData) => {
  try {
    const { data, error } = await supabase
      .from('mods')
      .insert([modData])
      .select()
    
    if (error) throw error
    return data[0]
  } catch (error) {
    console.error('Error creating mod:', error)
    throw error
  }
}

export const getMods = async (platform = null) => {
  try {
    let query = supabase.from('mods').select('*')
    
    if (platform) {
      query = query.eq('platform', platform)
    }
    
    const { data, error } = await query.order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching mods:', error)
    throw error
  }
}

export const getModById = async (id) => {
  try {
    const { data, error } = await supabase
      .from('mods')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching mod:', error)
    throw error
  }
}
