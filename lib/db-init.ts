import { supabase } from "./supabase"

export async function initializeDatabase() {
  try {
    // Check if custom_personalities table exists
    const { error: checkError } = await supabase.from("custom_personalities").select("id").limit(1)

    // If we get a specific error about the relation not existing, create the tables
    if (checkError && checkError.message.includes("relation") && checkError.message.includes("does not exist")) {
      console.log("Creating necessary database tables...")

      // Create custom_personalities table
      await supabase.rpc("create_custom_personalities_table")

      // Create chat_conversations table
      await supabase.rpc("create_chat_conversations_table")

      // Create chat_messages table
      await supabase.rpc("create_chat_messages_table")

      // Create user_preferences table
      await supabase.rpc("create_user_preferences_table")

      console.log("Database tables created successfully")
      return true
    }

    // If no error or a different error, tables likely exist
    return true
  } catch (error) {
    console.error("Error initializing database:", error)
    return false
  }
}
