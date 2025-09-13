import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { nanoid } from 'nanoid';

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

// Process and save organization logo
export async function processLogo(buffer: Buffer, organizationId: string): Promise<string> {
  console.log(`📋 Processing logo for organization: ${organizationId}`);
  console.log(`📋 Buffer size: ${buffer.length} bytes`);
  
  // Check if file is SVG by looking at the buffer content
  const bufferStart = buffer.toString('utf8', 0, Math.min(100, buffer.length));
  const isSVG = bufferStart.includes('<svg');
  console.log(`📋 File type detected: ${isSVG ? 'SVG' : 'Other image format'}`);
  
  if (isSVG) {
    // Handle SVG files directly without Sharp processing
    const filename = `logo-${organizationId}-${nanoid()}.svg`;
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
    const filename = `logo-${organizationId}-${nanoid()}.png`;
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