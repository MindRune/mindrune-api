/**
 * Clean target text by removing level information and color tags
 * Ensures the result is never null or empty
 * @param targetText - Target text to clean
 * @returns Cleaned text or default value if result would be empty
 */
export const cleanTargetText = (targetText: string | undefined): string => {
    console.log(`[cleanTargetText] Input:`, JSON.stringify(targetText));
    
    if (!targetText || targetText.trim() === '') {
      console.log(`[cleanTargetText] Empty input, returning "Unknown"`);
      return 'Unknown';
    }
     
    let cleanedText = targetText;
    console.log(`[cleanTargetText] Initial:`, JSON.stringify(cleanedText));
     
    // Store original for comparison
    const original = cleanedText;
    
    // Remove level information
    let levelIndex = cleanedText.indexOf('(level');
    if (levelIndex !== -1) {
      console.log(`[cleanTargetText] Found level info at index ${levelIndex}`);
      cleanedText = cleanedText.substring(0, levelIndex).trim();
      console.log(`[cleanTargetText] After level removal:`, JSON.stringify(cleanedText));
    }
     
    // Remove level information with hyphen
    levelIndex = cleanedText.indexOf('(level-');
    if (levelIndex !== -1) {
      console.log(`[cleanTargetText] Found level-hyphen at index ${levelIndex}`);
      cleanedText = cleanedText.substring(0, levelIndex).trim();
      console.log(`[cleanTargetText] After level-hyphen removal:`, JSON.stringify(cleanedText));
    }
     
    // Check for color tags
    if (cleanedText.includes('<col=') || cleanedText.includes('</col>')) {
      console.log(`[cleanTargetText] Found color tags`);
      const beforeColor = cleanedText;
      cleanedText = cleanedText.replace(/<col=[^>]*>/g, '').replace(/<\/col>/g, '');
      console.log(`[cleanTargetText] After color tag removal:`, JSON.stringify(cleanedText));
      
      // Check if this made the text empty
      if (!cleanedText.trim()) {
        console.log(`[cleanTargetText] WARNING: Text became empty after color tag removal!`);
      }
    }
     
    // Check for other formatting tags
    if (/<\/?[^>]+(>|$)/g.test(cleanedText)) {
      console.log(`[cleanTargetText] Found other formatting tags`);
      const beforeFormatting = cleanedText;
      // This is a very broad regex and might cause issues
      cleanedText = cleanedText.replace(/<\/?[^>]+(>|$)/g, '');
      console.log(`[cleanTargetText] After other tag removal:`, JSON.stringify(cleanedText));
      
      // Check if this made the text empty
      if (!cleanedText.trim()) {
        console.log(`[cleanTargetText] WARNING: Text became empty after other tag removal!`);
        console.log(`[cleanTargetText] Text before:`, JSON.stringify(beforeFormatting));
      }
    }
     
    // Final trim and check
    const trimmedResult = cleanedText.trim();
    
    if (!trimmedResult) {
      console.log(`[cleanTargetText] Empty result after all cleaning, returning "Unknown"`);
      console.log(`[cleanTargetText] Original input was:`, JSON.stringify(original));
      return 'Unknown';
    }
     
    console.log(`[cleanTargetText] Final result:`, JSON.stringify(trimmedResult));
    return trimmedResult;
  };
   
  /**
   * Removes special formatting from item names
   * @param itemName - The item name to clean
   * @returns Cleaned item name
   */
  export const cleanItemName = (itemName: string | undefined): string => {
    console.log(`[cleanItemName] Input:`, JSON.stringify(itemName));
    
    if (!itemName || itemName.trim() === '') {
      console.log(`[cleanItemName] Empty input, returning "Unknown Item"`);
      return 'Unknown Item';
    }
      // Store original for comparison
  const original = itemName;
  
  // Remove any quantity information in parentheses, e.g. "Coins (1000)"
  if (/\s*\(\d+\)$/.test(itemName)) {
    console.log(`[cleanItemName] Found quantity info`);
    let beforeQuantity = itemName;
    itemName = itemName.replace(/\s*\(\d+\)$/, '');
    console.log(`[cleanItemName] After quantity removal:`, JSON.stringify(itemName));
  }
   
  // Remove any charges information, e.g. "Ring of dueling (8)"
  if (/\s*\(\d+\)\s*$/.test(itemName)) {
    console.log(`[cleanItemName] Found charges info`);
    let beforeCharges = itemName;
    itemName = itemName.replace(/\s*\(\d+\)\s*$/, '');
    console.log(`[cleanItemName] After charges removal:`, JSON.stringify(itemName));
  }
   
  // Check for color tags
  if (itemName.includes('<col=') || itemName.includes('</col>')) {
    console.log(`[cleanItemName] Found color tags`);
    let beforeColor = itemName;
    itemName = itemName.replace(/<col=[^>]*>/g, '').replace(/<\/col>/g, '');
    console.log(`[cleanItemName] After color tag removal:`, JSON.stringify(itemName));
    
    // Check if this made the text empty
    if (!itemName.trim()) {
      console.log(`[cleanItemName] WARNING: Text became empty after color tag removal!`);
    }
  }
   
  // Final trim and check
  const trimmedResult = itemName.trim();
  
  if (!trimmedResult) {
    console.log(`[cleanItemName] Empty result after all cleaning, returning "Unknown Item"`);
    console.log(`[cleanItemName] Original input was:`, JSON.stringify(original));
    return 'Unknown Item';
  }
   
  console.log(`[cleanItemName] Final result:`, JSON.stringify(trimmedResult));
  return trimmedResult;
};
 
/**
 * Handles string formatting for NPC names
 * @param npcName - The NPC name to clean
 * @returns Cleaned NPC name
 */
export const cleanNpcName = (npcName: string | undefined): string => {
  console.log(`[cleanNpcName] Input:`, JSON.stringify(npcName));
  
  if (!npcName || npcName.trim() === '') {
    console.log(`[cleanNpcName] Empty input, returning "Unknown NPC"`);
    return 'Unknown NPC';
  }
   
  // Store original for comparison
  const original = npcName;
  let cleanedName = npcName;
   
  // Remove level information
  const levelIndex = cleanedName.indexOf('(level');
  if (levelIndex !== -1) {
    console.log(`[cleanNpcName] Found level info at index ${levelIndex}`);
    cleanedName = cleanedName.substring(0, levelIndex).trim();
    console.log(`[cleanNpcName] After level removal:`, JSON.stringify(cleanedName));
  }
   
  // Check for color tags
  if (cleanedName.includes('<col=') || cleanedName.includes('</col>')) {
    console.log(`[cleanNpcName] Found color tags`);
    let beforeColor = cleanedName;
    cleanedName = cleanedName.replace(/<col=[^>]*>/g, '').replace(/<\/col>/g, '');
    console.log(`[cleanNpcName] After color tag removal:`, JSON.stringify(cleanedName));
    
    // Check if this made the text empty
    if (!cleanedName.trim()) {
      console.log(`[cleanNpcName] WARNING: Text became empty after color tag removal!`);
    }
  }
   
  // Check for other formatting tags
  if (/<\/?[^>]+(>|$)/g.test(cleanedName)) {
    console.log(`[cleanNpcName] Found other formatting tags`);
    let beforeFormatting = cleanedName;
    // This is a very broad regex and might cause issues
    cleanedName = cleanedName.replace(/<\/?[^>]+(>|$)/g, '');
    console.log(`[cleanNpcName] After other tag removal:`, JSON.stringify(cleanedName));
    
    // Check if this made the text empty
    if (!cleanedName.trim()) {
      console.log(`[cleanNpcName] WARNING: Text became empty after other tag removal!`);
      console.log(`[cleanNpcName] Text before:`, JSON.stringify(beforeFormatting));
    }
  }
   
  // Final trim and check
  const trimmedResult = cleanedName.trim();
  
  if (!trimmedResult) {
    console.log(`[cleanNpcName] Empty result after all cleaning, returning "Unknown NPC"`);
    console.log(`[cleanNpcName] Original input was:`, JSON.stringify(original));
    return 'Unknown NPC';
  }
   
  console.log(`[cleanNpcName] Final result:`, JSON.stringify(trimmedResult));
  return trimmedResult;
};

// A debug utility function to log samples of text and characters
export const debugText = (text: string | undefined, label: string = "Text"): void => {
  if (!text) {
    console.log(`[debugText] ${label} is undefined or null`);
    return;
  }
  
  console.log(`[debugText] ${label}: "${text}"`);
  console.log(`[debugText] ${label} length: ${text.length}`);
  console.log(`[debugText] ${label} character codes:`, text.split('').map(c => c.charCodeAt(0)));
  
  // Check for suspicious patterns
  if (text.includes('<') || text.includes('>')) {
    console.log(`[debugText] ${label} contains angle brackets, might be HTML/XML content`);
  }
  
  if (/^\s+$/.test(text)) {
    console.log(`[debugText] ${label} contains only whitespace`);
  }
  
  if (/[\u0000-\u001F\u007F-\u009F]/.test(text)) {
    console.log(`[debugText] ${label} contains control characters`);
  }
};
 
export default {
  cleanTargetText,
  cleanItemName,
  cleanNpcName,
  debugText
};