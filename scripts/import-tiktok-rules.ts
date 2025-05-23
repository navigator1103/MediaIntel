import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importTikTokRules() {
  try {
    console.log('Starting TikTok Rules import...');
    
    // Read the rules file
    const rulesFilePath = path.join(process.cwd(), 'tiktok-rules.txt');
    const rulesContent = fs.readFileSync(rulesFilePath, 'utf8');
    const rulesLines = rulesContent.split('\n').filter(line => line.trim() !== '');
    
    // Parse the rules
    const rules = rulesLines.map(line => {
      const [id, platform, title, category, status, priority] = line.split('|');
      return {
        id: parseInt(id),
        platform,
        title,
        description: title, // Using title as description for now
        category,
        status: status || 'active',
        priority: priority || 'medium'
      };
    });
    
    console.log(`Found ${rules.length} TikTok rules to import`);
    
    // Import the rules, preserving their IDs
    for (const rule of rules) {
      // Check if a rule with this ID already exists
      const existingRule = await prisma.rule.findUnique({
        where: { id: rule.id }
      });
      
      if (existingRule) {
        // Update the existing rule
        await prisma.rule.update({
          where: { id: rule.id },
          data: {
            platform: rule.platform,
            title: rule.title,
            description: rule.description,
            category: rule.category,
            status: rule.status,
            priority: rule.priority
          }
        });
        console.log(`Updated rule #${rule.id}: ${rule.title}`);
      } else {
        // Create a new rule with the specified ID
        await prisma.rule.create({
          data: {
            id: rule.id,
            platform: rule.platform,
            title: rule.title,
            description: rule.description,
            category: rule.category,
            status: rule.status,
            priority: rule.priority
          }
        });
        console.log(`Created rule #${rule.id}: ${rule.title}`);
      }
    }
    
    console.log('TikTok Rules import completed successfully!');
  } catch (error) {
    console.error('Error importing TikTok Rules:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
importTikTokRules()
  .then(() => console.log('Script completed'))
  .catch(e => console.error('Script failed:', e));
