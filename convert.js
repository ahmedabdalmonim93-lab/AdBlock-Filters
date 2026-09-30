// سكربت Node.js لتحميل الفلاتر وتحويلها
// أمر التشغيل: node convert.js
const fs = require('fs');

async function processFilters() {
  console.log('جاري تحميل الفلاتر من EasyList...');
  try {
    const response = await fetch('https://easylist.to/easylist/easylist.txt');
    const text = await response.text();
    
    const networkRules = [];
    const cosmeticRules = [];
    let ruleId = 1;

    const lines = text.split('\n');
    for (const line of lines) {
      const rule = line.trim();
      if (!rule || rule.startsWith('!')) continue;

      // فرز الفلاتر التجميلية
      if (rule.includes('##')) {
        const parts = rule.split('##');
        const domains = parts[0] ? parts[0].split(',') : ['*'];
        const selector = parts[1];
        cosmeticRules.push({ domains, selector });
        continue;
      }

      // فرز فلاتر الشبكة
      let urlFilter = rule;
      if (urlFilter.startsWith('||')) urlFilter = '*' + urlFilter.substring(2);
      if (urlFilter.endsWith('^')) urlFilter = urlFilter.substring(0, urlFilter.length - 1) + '*';
      
      // تخطي القواعد المعقدة جداً مؤقتاً لتجنب الأخطاء، والقواعد القصيرة جداً
      if (urlFilter.length < 5 || urlFilter.includes('#')) continue;

      networkRules.push({
        id: ruleId++,
        priority: 1,
        action: { type: 'block' },
        condition: {
          urlFilter: urlFilter,
          resourceTypes: ["main_frame", "sub_frame", "stylesheet", "script", "image", "xmlhttprequest"]
        }
      });

      // حد Manifest V3 للقواعد الديناميكية هو 30,000
      if (ruleId > 29000) break; 
    }

    fs.writeFileSync('latest-dynamic-rules.json', JSON.stringify(networkRules, null, 2));
    fs.writeFileSync('cosmetic-rules.json', JSON.stringify(cosmeticRules, null, 2));
    
    console.log(`تم بنجاح تحويل ${networkRules.length} قاعدة شبكة.`);
    console.log(`تم بنجاح تحويل ${cosmeticRules.length} قاعدة تجميلية.`);
    console.log('الملفات جاهزة للعمل مع الإضافة.');
  } catch (e) {
    console.error('حدث خطأ:', e);
  }
}

processFilters();
