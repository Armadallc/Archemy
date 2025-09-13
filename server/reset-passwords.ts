import { db } from "./db";
import { users } from "@shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcrypt";

async function recreateUsers() {
  console.log("Updating demo users with fresh password hashes...");

  // Create fresh password hash
  const password = "password123";
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  
  console.log(`Generated hash for password "${password}": ${hashedPassword.substring(0, 20)}...`);

  // Update existing users with fresh password hashes
  const userEmails = [
    "sarah@monarch.com",
    "john@monarch.com", 
    "lisa@monarch.com",
    "mike@monarch.com",
    "maria@monarch.com"
  ];

  for (const email of userEmails) {
    const result = await db
      .update(users)
      .set({ passwordHash: hashedPassword })
      .where(eq(users.email, email))
      .returning();
    
    if (result.length > 0) {
      console.log(`Updated password for ${email} (${result[0].role})`);
      
      // Test password verification
      const isValid = await bcrypt.compare(password, result[0].passwordHash);
      console.log(`  Password verification: ${isValid ? 'PASS' : 'FAIL'}`);
    } else {
      console.log(`User not found: ${email}`);
    }
  }

  console.log("Password update completed!");
}

recreateUsers().catch(console.error);