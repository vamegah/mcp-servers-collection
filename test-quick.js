#!/usr/bin/env node
/**
 * Quick test script for Node.js MCP servers
 */

const { spawn } = require('child_process');
const { writeFileSync, mkdirSync, existsSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');

async function testServer(serverPath, serverName, env = {}) {
  console.log(`🧪 Testing ${serverName}...`);
  
  return new Promise((resolve) => {
    const proc = spawn('node', ['src/index.js'], {
      cwd: serverPath,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, ...env }
    });

    let output = '';
    let hasResponse = false;

    // Send list_tools request
    const request = {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list"
    };

    proc.stdout.on('data', (data) => {
      output += data.toString();
      if (!hasResponse && output.includes('"result"')) {
        hasResponse = true;
        try {
          const lines = output.split('\n');
          for (const line of lines) {
            if (line.trim() && line.includes('"result"')) {
              const response = JSON.parse(line);
              const tools = response.result?.tools || [];
              console.log(`  ✅ ${serverName}: Found ${tools.length} tools`);
              console.log(`  📋 Tools: ${tools.map(t => t.name).join(', ')}`);
              break;
            }
          }
        } catch (e) {
          console.log(`  ⚠️  ${serverName}: Response parsing failed`);
        }
        proc.kill();
        resolve(true);
      }
    });

    proc.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.includes('Error') || error.includes('error')) {
        console.log(`  ❌ ${serverName}: ${error.trim()}`);
      }
    });

    // Send the request
    proc.stdin.write(JSON.stringify(request) + '\n');

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!hasResponse) {
        console.log(`  ⏰ ${serverName}: Timeout - no response received`);
        proc.kill();
        resolve(false);
      }
    }, 10000);
  });
}

async function setupTempVault() {
  const vaultPath = join(tmpdir(), 'test-obsidian-vault');
  
  if (!existsSync(vaultPath)) {
    mkdirSync(vaultPath, { recursive: true });
  }
  
  // Create test note
  writeFileSync(join(vaultPath, 'test.md'), `---
tags: [test]
---

# Test Note

This is a test note for MCP server testing.`);

  // Create test canvas
  writeFileSync(join(vaultPath, 'test.canvas'), JSON.stringify({
    nodes: [],
    edges: []
  }));

  return vaultPath;
}

async function checkDependencies() {
  console.log('🔍 Checking Dependencies...\n');
  
  // Check if server directories exist
  const servers = [
    { path: 'mcp-server-obsidian', name: 'Obsidian' },
    { path: 'mcp-server-media', name: 'Media' }
  ];
  
  for (const server of servers) {
    if (existsSync(server.path)) {
      console.log(`  ✅ ${server.name} server directory found`);
      
      // Check package.json
      if (existsSync(join(server.path, 'package.json'))) {
        console.log(`  ✅ ${server.name} package.json found`);
      } else {
        console.log(`  ❌ ${server.name} package.json missing`);
      }
      
      // Check src/index.js
      if (existsSync(join(server.path, 'src', 'index.js'))) {
        console.log(`  ✅ ${server.name} src/index.js found`);
      } else {
        console.log(`  ❌ ${server.name} src/index.js missing`);
      }
    } else {
      console.log(`  ❌ ${server.name} server directory not found`);
    }
  }
  
  console.log();
}

async function main() {
  console.log('🚀 Quick MCP Servers Test\n');
  
  await checkDependencies();
  
  // Setup temp vault for Obsidian
  const vaultPath = await setupTempVault();
  console.log(`📁 Created temp vault: ${vaultPath}\n`);
  
  // Test servers
  const results = [];
  
  if (existsSync('mcp-server-obsidian')) {
    const result = await testServer('mcp-server-obsidian', 'Obsidian', {
      OBSIDIAN_VAULT_PATH: vaultPath
    });
    results.push({ name: 'Obsidian', success: result });
  }
  
  if (existsSync('mcp-server-media')) {
    const result = await testServer('mcp-server-media', 'Media');
    results.push({ name: 'Media', success: result });
  }
  
  // Summary
  console.log('\n' + '='.repeat(40));
  console.log('📊 Test Results:');
  results.forEach(r => {
    console.log(`  ${r.success ? '✅' : '❌'} ${r.name} Server`);
  });
  
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  
  console.log(`\n🎯 ${passed}/${total} servers passed tests`);
  
  if (passed === total) {
    console.log('🎉 All tests passed!');
  } else {
    console.log('⚠️  Some tests failed. Check error messages above.');
  }
}

main().catch(console.error);