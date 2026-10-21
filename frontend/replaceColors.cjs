const fs = require('fs');
const path = require('path');

function replaceInFiles(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            replaceInFiles(fullPath);
        } else if (fullPath.endsWith('.jsx')) {
            let content = fs.readFileSync(fullPath, 'utf8');
            let modified = content;
            
            // Replace rgba(16, 185, 129, alpha) with rgba(var(--accent-rgb), alpha)
            modified = modified.replace(/rgba\(16,\s*185,\s*129,/g, 'rgba(var(--accent-rgb),');
            
            // Replace '#10b981' with 'var(--accent-primary)'
            // We need to be careful with quotes. Usually it's '#10b981'
            modified = modified.replace(/'#10b981'/g, "'var(--accent-primary)'");
            modified = modified.replace(/"#10b981"/g, "'var(--accent-primary)'");
            
            if (content !== modified) {
                fs.writeFileSync(fullPath, modified);
                console.log(`Updated ${fullPath}`);
            }
        }
    }
}

replaceInFiles(path.join(__dirname, 'src'));
console.log('Color replacement done.');
