const fs = require('fs');
const path = require('path');

// Emoji regex pattern
const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F018}-\u{1F270}\u{238C}-\u{23FF}\u{1F004}-\u{1F004}\u{1F0CF}-\u{1F0CF}\u{1F170}-\u{1F251}\u{1F30D}-\u{1F30F}\u{1F315}-\u{1F315}\u{1F31C}-\u{1F31E}\u{1F321}-\u{1F32C}\u{1F336}-\u{1F336}\u{1F378}-\u{1F378}\u{1F37D}-\u{1F37D}\u{1F396}-\u{1F397}\u{1F399}-\u{1F39B}\u{1F39E}-\u{1F39F}\u{1F3C2}-\u{1F3C4}\u{1F3C6}-\u{1F3CA}\u{1F3CC}-\u{1F3CE}\u{1F3D4}-\u{1F3DF}\u{1F3F1}-\u{1F3F3}\u{1F3F5}-\u{1F3F7}\u{1F408}-\u{1F408}\u{1F415}-\u{1F415}\u{1F43F}-\u{1F43F}\u{1F441}-\u{1F441}\u{1F442}-\u{1F442}\u{1F444}-\u{1F444}\u{1F446}-\u{1F449}\u{1F44B}-\u{1F44B}\u{1F44D}-\u{1F44D}\u{1F44F}-\u{1F44F}\u{1F453}-\u{1F453}\u{1F46A}-\u{1F46A}\u{1F47D}-\u{1F47D}\u{1F490}-\u{1F490}\u{1F493}-\u{1F493}\u{1F495}-\u{1F495}\u{1F497}-\u{1F497}\u{1F499}-\u{1F499}\u{1F49B}-\u{1F49B}\u{1F49D}-\u{1F49D}\u{1F4A1}-\u{1F4A1}\u{1F4A4}-\u{1F4A4}\u{1F4A8}-\u{1F4A8}\u{1F4AB}-\u{1F4AB}\u{1F4AD}-\u{1F4AD}\u{1F4AF}-\u{1F4AF}\u{1F4B3}-\u{1F4B3}\u{1F4B9}-\u{1F4B9}\u{1F4BB}-\u{1F4BB}\u{1F4BF}-\u{1F4BF}\u{1F4C8}-\u{1F4C8}\u{1F4CA}-\u{1F4CA}\u{1F4CD}-\u{1F4CD}\u{1F4D6}-\u{1F4D6}\u{1F4DA}-\u{1F4DA}\u{1F4DD}-\u{1F4DD}\u{1F4E3}-\u{1F4E3}\u{1F4E6}-\u{1F4E6}\u{1F4EA}-\u{1F4EB}\u{1F4ED}-\u{1F4ED}\u{1F4EF}-\u{1F4EF}\u{1F4F1}-\u{1F4F1}\u{1F4F6}-\u{1F4F6}\u{1F4F8}-\u{1F4F8}\u{1F4F9}-\u{1F4F9}\u{1F4FB}-\u{1F4FB}\u{1F4FD}-\u{1F4FD}\u{1F4FF}-\u{1F4FF}\u{1F503}-\u{1F503}\u{1F507}-\u{1F507}\u{1F50A}-\u{1F50A}\u{1F50D}-\u{1F50D}\u{1F512}-\u{1F512}\u{1F513}-\u{1F513}\u{1F53A}-\u{1F53A}\u{1F53C}-\u{1F53C}\u{1F550}-\u{1F550}\u{1F557}-\u{1F557}\u{1F57A}-\u{1F57A}\u{1F590}-\u{1F590}\u{1F595}-\u{1F595}\u{1F596}-\u{1F596}\u{1F5A4}-\u{1F5A4}\u{1F5A5}-\u{1F5A5}\u{1F5A8}-\u{1F5A8}\u{1F5B1}-\u{1F5B1}\u{1F5B2}-\u{1F5B2}\u{1F5BC}-\u{1F5BC}\u{1F5C2}-\u{1F5C2}\u{1F5C3}-\u{1F5C3}\u{1F5C4}-\u{1F5C4}\u{1F5D1}-\u{1F5D1}\u{1F5D2}-\u{1F5D2}\u{1F5D3}-\u{1F5D3}\u{1F5DC}-\u{1F5DC}\u{1F5DD}-\u{1F5DD}\u{1F5DE}-\u{1F5DE}\u{1F5E1}-\u{1F5E1}\u{1F5E3}-\u{1F5E3}\u{1F5E8}-\u{1F5E8}\u{1F5EF}-\u{1F5EF}\u{1F5F3}-\u{1F5F3}\u{1F5FA}-\u{1F5FA}\u{1F5FB}-\u{1F5FB}\u{1F5FC}-\u{1F5FC}\u{1F5FD}-\u{1F5FD}\u{1F5FE}-\u{1F5FE}\u{1F5FF}-\u{1F5FF}\u{1F600}-\u{1F600}\u{1F601}-\u{1F601}\u{1F602}-\u{1F602}\u{1F603}-\u{1F603}\u{1F604}-\u{1F604}\u{1F605}-\u{1F605}\u{1F606}-\u{1F606}\u{1F607}-\u{1F607}\u{1F608}-\u{1F608}\u{1F609}-\u{1F609}\u{1F60A}-\u{1F60A}\u{1F60B}-\u{1F60B}\u{1F60C}-\u{1F60C}\u{1F60D}-\u{1F60D}\u{1F60E}-\u{1F60E}\u{1F60F}-\u{1F60F}\u{1F610}-\u{1F610}\u{1F611}-\u{1F611}\u{1F612}-\u{1F612}\u{1F613}-\u{1F613}\u{1F614}-\u{1F614}\u{1F615}-\u{1F615}\u{1F616}-\u{1F616}\u{1F617}-\u{1F617}\u{1F618}-\u{1F618}\u{1F619}-\u{1F619}\u{1F61A}-\u{1F61A}\u{1F61B}-\u{1F61B}\u{1F61C}-\u{1F61C}\u{1F61D}-\u{1F61D}\u{1F61E}-\u{1F61E}\u{1F61F}-\u{1F61F}\u{1F620}-\u{1F620}\u{1F621}-\u{1F621}\u{1F622}-\u{1F622}\u{1F623}-\u{1F623}\u{1F624}-\u{1F624}\u{1F625}-\u{1F625}\u{1F626}-\u{1F626}\u{1F627}-\u{1F627}\u{1F628}-\u{1F628}\u{1F629}-\u{1F629}\u{1F62A}-\u{1F62A}\u{1F62B}-\u{1F62B}\u{1F62C}-\u{1F62C}\u{1F62D}-\u{1F62D}\u{1F62E}-\u{1F62E}\u{1F62F}-\u{1F62F}\u{1F630}-\u{1F630}\u{1F631}-\u{1F631}\u{1F632}-\u{1F632}\u{1F633}-\u{1F633}\u{1F634}-\u{1F634}\u{1F635}-\u{1F635}\u{1F636}-\u{1F636}\u{1F637}-\u{1F637}\u{1F638}-\u{1F638}\u{1F639}-\u{1F639}\u{1F63A}-\u{1F63A}\u{1F63B}-\u{1F63B}\u{1F63C}-\u{1F63C}\u{1F63D}-\u{1F63D}\u{1F63E}-\u{1F63E}\u{1F63F}-\u{1F63F}\u{1F640}-\u{1F640}\u{1F641}-\u{1F641}\u{1F642}-\u{1F642}\u{1F643}-\u{1F643}\u{1F644}-\u{1F644}\u{1F645}-\u{1F645}\u{1F646}-\u{1F646}\u{1F647}-\u{1F647}\u{1F648}-\u{1F648}\u{1F649}-\u{1F649}\u{1F64A}-\u{1F64A}\u{1F64B}-\u{1F64B}\u{1F64C}-\u{1F64C}\u{1F64D}-\u{1F64D}\u{1F64E}-\u{1F64E}\u{1F64F}-\u{1F64F}]/gu;

// Specific emojis to remove
const specificEmojis = [
  '📚', '📖', '📄', '✓', '❌', '⚠️', '🎓', '👨‍🏫', '👨‍🎓', '💡', '📐', '🔬',
  '📌', '🎯', '📊', '📈', '✅', '❓', '💬', '🔍', '📝', '📋', '🗂️', '📁', '📂',
  '🔗', '🌐', '💻', '📱', '⚡', '🔔', '🔑', '🔒', '👤', '👥', '🏠', '📍', '📅',
  '🕐', '⏰', '📞', '✉️', '💼', '⭐', '🎓', '🟢', '🟡', '🔴', '💪', '🎉', '👏',
  '🤔', '😃', '😊', '😎', '🤓', '📸', '🎨', '🎭', '🎪', '🎢', '🎡', '🎠', '🎁',
  '🎄', '🎃', '🎂', '🎈', '🎊', '🎐', '🎀', '🎗️', '🎟️', '🎫', '🎖️', '🏆', '🏅',
  '🥇', '🥈', '🥉', '🏃', '🚴', '🚶', '🏂', '🏄', '🏊', '🚣', '🛀', '🛌', '🛏️',
  '🛋️', '🚽', '🚿', '🛁', '🧴', '🧹', '🧺', '🧻', '🧼', '🧽', '🧯', '🛒', '🚬',
  '⚰️', '⚱️', '🗿', '🛂', '🛃', '🛄', '🛅', '📿', '💈', '⚗️', '🔭', '🔬', '🕳️',
  '💊', '💉', '🌡️', '🏷️', '🔖', '🛍️', '🛎️', '🗝️', '🛠️', '🔧', '🔨', '⚒️',
  '🛡️', '⛓️', '🧲', '🔫', '🔪', '🗡️', '⚔️', '🛠️', '🔩', '⚙️', '🧰', '🧳',
  '⌛', '⏳', '⌚', '⏰', '⏱️', '⏲️', '🕰️', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖',
  '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣',
  '🕤', '🕥', '🕦', '🕧', '🌑', '🌒', '🌓', '🌔', '🌕', '🌖', '🌗', '🌘', '🌙',
  '🌚', '🌛', '🌜', '🌝', '🌞', '🌟', '🌠', '☁️', '⛅', '⛈️', '🌤️', '🌥️', '🌦️',
  '🌧️', '🌨️', '🌩️', '🌪️', '🌫️', '🌬️', '🌀', '🌈', '🌂', '☂️', '☔', '⛱️',
  '⚡', '❄️', '☃️', '⛄', '☄️', '🔥', '💧', '🌊', '🍎', '🍐', '🍊', '🍋', '🍌',
  '🍉', '🍇', '🍓', '🍈', '🍒', '🍑', '🍍', '🥝', '🥭', '🍅', '🥑', '🍆', '🥔',
  '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨',
  '🥯', '🥞', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮',
  '🌯', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧂', '🥫', '🍱', '🍘', '🍙',
  '🍚', '🍛', '🍜', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🥮', '🍡', '🥟', '🥠',
  '🥡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭',
  '🍮', '🍯', '🍼', '🥛', '☕', '🍵', '🍶', '🍾', '🍷', '🍸', '🍹', '🍺', '🍻',
  '🥂', '🥃', '🥤', '🥢', '🍽️', '🍴', '🥄', '🔪', '🏺', '🌍', '🌎', '🌏', '🌐',
  '🗺️', '🗾', '🧭', '🏔️', '⛰️', '🌋', '🗻', '🏕️', '🏖️', '🏜️', '🏝️', '🏞️',
  '🏟️', '🏛️', '🏗️', '🧱', '🏘️', '🏚️', '🏠', '🏡', '🏢', '🏣', '🏤', '🏥',
  '🏦', '🏨', '🏩', '🏪', '🏫', '🏬', '🏭', '🏯', '🏰', '💒', '🗼', '🗽', '⛪',
  '🕌', '🕍', '⛩️', '🕋', '⛲', '⛺', '🌁', '🌃', '🏙️', '🌄', '🌅', '🌆', '🌇',
  '🌉', '♨️', '🎠', '🎡', '🎢', '💈', '🎪', '🚂', '🚃', '🚄', '🚅', '🚆', '🚇',
  '🚈', '🚉', '🚊', '🚝', '🚞', '🚋', '🚌', '🚍', '🚎', '🚐', '🚑', '🚒', '🚓',
  '🚔', '🚕', '🚖', '🚗', '🚘', '🚙', '🚚', '🚛', '🚜', '🚲', '🛴', '🛹', '🛵',
  '🚏', '🛣️', '🛤️', '⛽', '🚨', '🚥', '🚦', '🛑', '🚧', '⚓', '⛵', '🛶', '🚤',
  '🛳️', '⛴️', '🛥️', '🚢', '✈️', '🛩️', '🛫', '🛬', '🚀', '🛸', '🚁', '🛷', '🚠',
  '🚡', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚇', '🚊', '🚉', '🚆',
  '🚂', '🚎', '🚍', '🚌', '🚐', '🚑', '🚒', '🚓', '🚔', '🚕', '🚖', '🚗', '🚘',
  '🚙', '🚚', '🚛', '🚜', '🚲', '🛴', '🛹', '🛵', '🚏', '⛽', '🚨', '🚥', '🚦',
  '🛑', '🚧', '💰', '💴', '💵', '💶', '💷', '💸', '💳', '🧾', '💹', '💱', '💲',
  '✉️', '📧', '📨', '📩', '📤', '📥', '📦', '📫', '📪', '📬', '📭', '📮', '🗳️',
  '✏️', '✒️', '🖋️', '🖊️', '🖌️', '🖍️', '📝', '💼', '📁', '📂', '🗂️', '📅',
  '📆', '🗒️', '🗓️', '📇', '📈', '📉', '📊', '📋', '📌', '📍', '📎', '🖇️', '📏',
  '📐', '✂️', '🗃️', '🗄️', '🗑️', '🔒', '🔓', '🔏', '🔐', '🔑', '🗝️', '🔨', '🪓',
  '⛏️', '⚒️', '🛠️', '🗡️', '⚔️', '🔫', '🏹', '🛡️', '🔧', '🔩', '⚙️', '🗜️', '⚖️',
  '🦯', '🔗', '⛓️', '🧰', '🧲', '🧪', '🧫', '🧬', '🔬', '🔭', '📡', '💉', '🩸',
  '💊', '🩹', '🩺', '🚪', '🛏️', '🛋️', '🚽', '🚿', '🛁', '🧴', '🧹', '🧺', '🧻',
  '🧼', '🧽', '🧯', '🛒', '🚬', '⚰️', '⚱️', '🗿', '🧳', '⌛', '⏳', '⌚', '⏰',
  '⏱️', '⏲️', '🕰️', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚',
  '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧',
];

// Directories to scan
const dirsToScan = [
  path.join(__dirname, 'src', 'app'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src', 'hooks'),
  path.join(__dirname, 'src', 'lib'),
  path.join(__dirname, 'src', 'services'),
  path.join(__dirname, 'src', 'types'),
];

let totalFilesProcessed = 0;
let totalEmojisRemoved = 0;

function removeEmojisFromFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Remove specific emojis
    let count = 0;
    specificEmojis.forEach(emoji => {
      const regex = new RegExp(emoji.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      const matches = content.match(regex);
      if (matches) {
        count += matches.length;
        content = content.replace(regex, '');
      }
    });
    
    // Remove remaining emojis with regex
    const emojiMatches = content.match(emojiRegex);
    if (emojiMatches) {
      count += emojiMatches.length;
      content = content.replace(emojiRegex, '');
    }
    
    if (count > 0) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`✓ ${filePath} - Removed ${count} emojis`);
      totalEmojisRemoved += count;
    }
    
    totalFilesProcessed++;
  } catch (error) {
    console.error(`✗ Error processing ${filePath}:`, error.message);
  }
}

function scanDirectory(dir) {
  if (!fs.existsSync(dir)) {
    console.log(`Directory not found: ${dir}`);
    return;
  }
  
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        scanDirectory(filePath);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      removeEmojisFromFile(filePath);
    }
  });
}

console.log('🚀 Starting emoji removal...\n');

dirsToScan.forEach(dir => {
  console.log(`Scanning: ${dir}`);
  scanDirectory(dir);
});

console.log(`\n✅ Complete!`);
console.log(`Files processed: ${totalFilesProcessed}`);
console.log(`Emojis removed: ${totalEmojisRemoved}`);
