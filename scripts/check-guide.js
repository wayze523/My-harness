const fs = require('fs');
const path = require('path');

function loadEnvToken() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return process.env.FIGMA_TOKEN;
  const line = fs.readFileSync(envPath, 'utf8')
    .split('\n')
    .find((l) => l.trim().startsWith('FIGMA_TOKEN='));
  return line ? line.split('=').slice(1).join('=').trim() : process.env.FIGMA_TOKEN;
}

function parseFigmaUrl(url) {
  const fileMatch = url.match(/figma\.com\/(?:file|design)\/([a-zA-Z0-9]+)/);
  const nodeMatch = url.match(/node-id=([^&]+)/);
  if (!fileMatch || !nodeMatch) {
    throw new Error('Figma URL에서 file key 또는 node-id를 찾을 수 없음');
  }
  return {
    fileKey: fileMatch[1],
    nodeId: decodeURIComponent(nodeMatch[1]).replace('-', ':'),
  };
}

const ALLOWED_HEX = new Set([
  '#141414', '#0066ff', '#ffffff', '#f3f3f3',
  '#f0f0f0', '#e0e0e0', '#262626', '#707070', '#adadad',
]);

function toHex(c) {
  const h = (n) => Math.round(n * 255).toString(16).padStart(2, '0');
  return `#${h(c.r)}${h(c.g)}${h(c.b)}`;
}

function isAllowedRadius(radius, width, height) {
  if ([0, 16, 24].includes(radius)) return true;
  if (radius >= 9999 || radius >= Math.min(width, height) / 2 - 0.5) return true;
  return false;
}

function isSquircleOk(radius, width, height) {
  const expected = 0.3 * Math.min(width, height);
  return Math.abs(radius - expected) <= 1;
}

function walk(node, violations) {
  const box = node.absoluteBoundingBox;

  if (Array.isArray(node.fills)) {
    for (const fill of node.fills) {
      if (fill.type === 'SOLID' && fill.visible !== false) {
        const hex = toHex(fill.color);
        if (!ALLOWED_HEX.has(hex)) {
          violations.push(`- [${node.id}] fill ${hex} → 허용 목록에 없음`);
        }
      }
    }
  }

  if (typeof node.cornerRadius === 'number' && box) {
    const isIconNode = /icon|squircle/i.test(node.name || '');
    const ok = isIconNode
      ? isSquircleOk(node.cornerRadius, box.width, box.height)
      : isAllowedRadius(node.cornerRadius, box.width, box.height);
    if (!ok) {
      violations.push(`- [${node.id}] cornerRadius=${node.cornerRadius}px → 0/16/24/9999 아님 (squircle 예외 대상 아님)`);
    }
  }

  for (const child of node.children || []) walk(child, violations);
}

async function main() {
  const url = process.argv[2];
  if (!url) {
    console.error('사용법: node scripts/check-guide.js <figma-url>');
    process.exit(1);
  }

  const token = loadEnvToken();
  if (!token) {
    console.error('FIGMA_TOKEN이 설정되지 않음 (.env 확인)');
    process.exit(1);
  }

  const { fileKey, nodeId } = parseFigmaUrl(url);
  const res = await fetch(
    `https://api.figma.com/v1/files/${fileKey}/nodes?ids=${encodeURIComponent(nodeId)}`,
    { headers: { 'X-Figma-Token': token } },
  );
  const data = await res.json();
  const root = data.nodes[nodeId]?.document;
  if (!root) {
    console.error('노드를 찾을 수 없음');
    process.exit(1);
  }

  const violations = [];
  walk(root, violations);

  console.log(`GATE② 결과: 위반 ${violations.length}건`);
  violations.forEach((v) => console.log(v));

  process.exit(violations.length > 0 ? 1 : 0);
}

main();
