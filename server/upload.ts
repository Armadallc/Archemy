import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';
import { supabase } from './minimal-supabase';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
const avatarsDir = path.join(uploadsDir, 'avatars');
const logosDir = path.join(uploadsDir, 'logos');

// Create directories if they don't exist
[uploadsDir, avatarsDir, logosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: any, cb: any) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Process and save avatar image
export async function processAvatar(buffer: Buffer, userId: string): Promise<string> {
  const filename = `avatar-${userId}-${nanoid()}.webp`;
  const filepath = path.join(avatarsDir, filename);
  
  await sharp(buffer)
    .resize(150, 150, { 
      fit: 'cover',
      position: 'center'
    })
    .webp({ quality: 85 })
    .toFile(filepath);
  
  return `/uploads/avatars/${filename}`;
}

// Process and save program or corporate client logo
export async function processLogo(buffer: Buffer, entityId: string): Promise<string> {
  console.log(`📋 Processing logo for entity: ${entityId}`);
  console.log(`📋 Buffer size: ${buffer.length} bytes`);
  
  // Check if file is SVG by looking at the buffer content
  const bufferStart = buffer.toString('utf8', 0, Math.min(100, buffer.length));
  const isSVG = bufferStart.includes('<svg');
  console.log(`📋 File type detected: ${isSVG ? 'SVG' : 'Other image format'}`);
  
  if (isSVG) {
    // Handle SVG files directly without Sharp processing
    const filename = `logo-${entityId}-${nanoid()}.svg`;
    const filepath = path.join(logosDir, filename);
    
    console.log(`📋 Saving SVG file to: ${filepath}`);
    
    // Save SVG file directly
    fs.writeFileSync(filepath, buffer);
    
    // Verify file was created
    if (fs.existsSync(filepath)) {
      console.log(`✅ SVG file saved successfully: ${filepath}`);
    } else {
      console.error(`❌ Failed to save SVG file: ${filepath}`);
    }
    
    return `/uploads/logos/${filename}`;
  } else {
    // Process other image formats with Sharp
    const filename = `logo-${entityId}-${nanoid()}.png`;
    const filepath = path.join(logosDir, filename);
    
    console.log(`📋 Processing image file to: ${filepath}`);
    
    await sharp(buffer)
      .resize(400, 160, { 
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
        withoutEnlargement: true
      })
      .png({ 
        quality: 100,
        compressionLevel: 0,
        palette: false
      })
      .toFile(filepath);
    
    // Verify file was created
    if (fs.existsSync(filepath)) {
      console.log(`✅ Image file processed successfully: ${filepath}`);
    } else {
      console.error(`❌ Failed to process image file: ${filepath}`);
    }
    
    return `/uploads/logos/${filename}`;
  }
}

// Delete file utility
export function deleteFile(filePath: string): void {
  try {
    // Remove leading slash and use current working directory
    const cleanPath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
    const fullPath = path.join(process.cwd(), cleanPath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      console.log(`📁 Deleted file: ${fullPath}`);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}

// ============================================================================
// SUPABASE STORAGE FUNCTIONS
// ============================================================================

/**
 * Process and upload user avatar to Supabase Storage
 */
export async function processAvatarToSupabase(buffer: Buffer, userId: string): Promise<string> {
  console.log('🖼️ Processing avatar for user:', userId);
  console.log('📦 Buffer size:', buffer.length, 'bytes');
  
  try {
    // Process image with Sharp
    console.log('🔄 Processing image with Sharp...');
    const processedBuffer = await sharp(buffer)
      .resize(150, 150, { 
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 85 })
      .toBuffer();
    
    console.log('✅ Image processed. New size:', processedBuffer.length, 'bytes');

    // Generate file path
    const filename = `avatar-${userId}-${nanoid()}.webp`;
    const filePath = `users/${userId}/${filename}`;
    console.log('📁 File path:', filePath);

    // Upload to Supabase Storage
    console.log('☁️ Uploading to Supabase Storage bucket "avatars"...');
    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(filePath, processedBuffer, {
        contentType: 'image/webp',
        upsert: true
      });

    if (error) {
      console.error('❌ Supabase Storage upload error:', error);
      throw new Error(`Failed to upload avatar to Supabase Storage: ${error.message}`);
    }

    console.log('✅ File uploaded to Supabase Storage:', data?.path);

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    console.log('🔗 Public URL:', urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error: any) {
    console.error('❌ Error in processAvatarToSupabase:', error);
    throw error;
  }
}

/**
 * Process and upload corporate client logo to Supabase Storage
 */
export async function processCorporateLogoToSupabase(buffer: Buffer, corporateClientId: string): Promise<string> {
  // Check if file is SVG
  const bufferStart = buffer.toString('utf8', 0, Math.min(100, buffer.length));
  const isSVG = bufferStart.includes('<svg');

  let processedBuffer: Buffer;
  let filename: string;
  let contentType: string;

  if (isSVG) {
    // Handle SVG files directly
    processedBuffer = buffer;
    filename = `logo-${corporateClientId}-${nanoid()}.svg`;
    contentType = 'image/svg+xml';
  } else {
    // Process other image formats with Sharp
    processedBuffer = await sharp(buffer)
      .resize(400, 160, { 
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
        withoutEnlargement: true
      })
      .png({ 
        quality: 100,
        compressionLevel: 0,
        palette: false
      })
      .toBuffer();
    filename = `logo-${corporateClientId}-${nanoid()}.png`;
    contentType = 'image/png';
  }

  // Generate file path
  const filePath = `corporate-clients/${corporateClientId}/${filename}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, processedBuffer, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload logo to Supabase Storage: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Process and upload program logo to Supabase Storage
 */
export async function processProgramLogoToSupabase(buffer: Buffer, programId: string): Promise<string> {
  // Check if file is SVG
  const bufferStart = buffer.toString('utf8', 0, Math.min(100, buffer.length));
  const isSVG = bufferStart.includes('<svg');

  let processedBuffer: Buffer;
  let filename: string;
  let contentType: string;

  if (isSVG) {
    // Handle SVG files directly
    processedBuffer = buffer;
    filename = `logo-${programId}-${nanoid()}.svg`;
    contentType = 'image/svg+xml';
  } else {
    // Process other image formats with Sharp
    processedBuffer = await sharp(buffer)
      .resize(400, 160, { 
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
        withoutEnlargement: true
      })
      .png({ 
        quality: 100,
        compressionLevel: 0,
        palette: false
      })
      .toBuffer();
    filename = `logo-${programId}-${nanoid()}.png`;
    contentType = 'image/png';
  }

  // Generate file path
  const filePath = `programs/${programId}/${filename}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, processedBuffer, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload logo to Supabase Storage: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Process and upload main application logo to Supabase Storage
 */
export async function processMainLogoToSupabase(buffer: Buffer): Promise<string> {
  // Check if file is SVG
  const bufferStart = buffer.toString('utf8', 0, Math.min(100, buffer.length));
  const isSVG = bufferStart.includes('<svg');

  let processedBuffer: Buffer;
  let filename: string;
  let contentType: string;

  if (isSVG) {
    // Handle SVG files directly
    processedBuffer = buffer;
    filename = `main-logo-${nanoid()}.svg`;
    contentType = 'image/svg+xml';
  } else {
    // Process other image formats with Sharp - resize to 180x180 for sidebar display
    processedBuffer = await sharp(buffer)
      .resize(180, 180, { 
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 },
        withoutEnlargement: false // Allow enlargement to ensure 180x180
      })
      .png({ 
        quality: 100,
        compressionLevel: 0,
        palette: false
      })
      .toBuffer();
    filename = `main-logo-${nanoid()}.png`;
    contentType = 'image/png';
  }

  // Generate file path
  const filePath = `system/main/${filename}`;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('avatars')
    .upload(filePath, processedBuffer, {
      contentType,
      upsert: true
    });

  if (error) {
    throw new Error(`Failed to upload main logo to Supabase Storage: ${error.message}`);
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  return urlData.publicUrl;
}

/**
 * Delete file from Supabase Storage by URL
 */
export async function deleteFileFromSupabase(fileUrl: string): Promise<void> {
  try {
    // Extract path from Supabase Storage URL
    // Format: https://[project-ref].supabase.co/storage/v1/object/public/avatars/[path]
    const urlMatch = fileUrl.match(/\/storage\/v1\/object\/public\/([^\/]+)\/(.+)$/);
    if (!urlMatch) {
      console.warn(`Could not parse Supabase Storage URL: ${fileUrl}`);
      return;
    }

    const [, bucket, filePath] = urlMatch;

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error(`Error deleting file from Supabase Storage: ${error.message}`);
    } else {
      console.log(`✅ Deleted file from Supabase Storage: ${filePath}`);
    }
  } catch (error) {
    console.error('Error deleting file from Supabase Storage:', error);
  }
}