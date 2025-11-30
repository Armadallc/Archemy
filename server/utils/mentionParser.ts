/**
 * Utility functions for parsing @mentions from text
 */

/**
 * Parse @mentions from text content
 * Matches patterns like @username, @firstname, @first_name
 * Returns array of mention strings (without the @)
 */
export function parseMentions(text: string): string[] {
  // Match @ followed by word characters (letters, numbers, underscore)
  // This will match @username, @alissa, @user_name, etc.
  const mentionRegex = /@(\w+)/g;
  const mentions: string[] = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    const mention = match[1].toLowerCase();
    if (!mentions.includes(mention)) {
      mentions.push(mention);
    }
  }
  
  return mentions;
}

/**
 * Find users by mention string (first_name or user_name)
 * Returns array of user IDs that match the mention
 */
export async function findUsersByMention(
  mention: string,
  supabase: any,
  currentUserId: string
): Promise<string[]> {
  const mentionLower = mention.toLowerCase();
  
  // Search by first_name (case-insensitive) or user_name (case-insensitive)
  const { data: users, error } = await supabase
    .from('users')
    .select('user_id, first_name, user_name')
    .or(`first_name.ilike.%${mentionLower}%,user_name.ilike.%${mentionLower}%`)
    .neq('user_id', currentUserId); // Don't include the current user
  
  if (error) {
    console.error('Error finding users by mention:', error);
    return [];
  }
  
  // Filter to exact matches (case-insensitive)
  const matchedUserIds = (users || [])
    .filter((user: any) => {
      const firstName = (user.first_name || '').toLowerCase();
      const userName = (user.user_name || '').toLowerCase();
      return firstName === mentionLower || userName === mentionLower;
    })
    .map((user: any) => user.user_id);
  
  return matchedUserIds;
}

/**
 * Find all mentioned users from text content
 * Returns array of user IDs
 */
export async function findMentionedUsers(
  text: string,
  supabase: any,
  currentUserId: string
): Promise<string[]> {
  const mentions = parseMentions(text);
  if (mentions.length === 0) {
    return [];
  }
  
  // Find users for each mention
  const allUserIds: string[] = [];
  for (const mention of mentions) {
    const userIds = await findUsersByMention(mention, supabase, currentUserId);
    allUserIds.push(...userIds);
  }
  
  // Return unique user IDs
  return [...new Set(allUserIds)];
}

