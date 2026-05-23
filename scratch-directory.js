const fs = require('fs');
const path = require('path');

require('ts-node').register({
  compilerOptions: {
    module: 'commonjs',
    target: 'es2015',
    moduleResolution: 'node',
    allowJs: true,
    esModuleInterop: true,
    jsx: 'react-jsx'
  },
  transpileOnly: true
});

const tsConfigPaths = require('tsconfig-paths');
const tsconfig = require('./tsconfig.json');
tsConfigPaths.register({
  baseUrl: tsconfig.compilerOptions.baseUrl || './',
  paths: tsconfig.compilerOptions.paths || {}
});

// Mock some things to allow importing paths and lessons
global.React = require('react');

const { PATHSHALA_PATHS } = require('./src/lib/pathshala-paths');
const { PATHSHALA_LESSONS } = require('./src/lib/pathshala-lessons');

let md = '# Pathshala Complete Directory\\n\\n';

PATHSHALA_PATHS.forEach(p => {
  md += `## [${p.tradition.toUpperCase()}] ${p.title} (${p.category})\\n`;
  md += `**Description:** ${p.description}\\n`;
  md += `**Total Lessons:** ${p.total_lessons}\\n\\n`;
  
  const pathLessons = Object.values(PATHSHALA_LESSONS).filter(l => l.path_id === p.id);
  
  if (pathLessons.length === 0) {
    md += `*No lessons found for this path.*\\n\\n`;
  } else {
    md += `| Lesson ID | Title | Entries |\\n`;
    md += `|---|---|---|\\n`;
    pathLessons.forEach(l => {
      md += `| \`${l.id}\` | ${l.title} | ${l.entries.length} |\\n`;
    });
    md += `\\n`;
  }
});

fs.writeFileSync('Pathshala_Directory.md', md);
