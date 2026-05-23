import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: 'admin@axon.local' } });
  if (existing) {
    console.log('Already seeded — skipping.');
    return;
  }
  console.log('Seeding axon_admin...');

  // Permissions
  const permDefs = [
    { resource: 'plugins', action: 'read' }, { resource: 'plugins', action: 'write' }, { resource: 'plugins', action: 'delete' },
    { resource: 'tools', action: 'read' }, { resource: 'tools', action: 'write' }, { resource: 'tools', action: 'delete' },
    { resource: 'tokens', action: 'read' }, { resource: 'tokens', action: 'write' },
    { resource: 'users', action: 'read' }, { resource: 'users', action: 'write' },
    { resource: 'logs', action: 'read' },
    { resource: 'settings', action: 'read' }, { resource: 'settings', action: 'write' },
    { resource: 'testing', action: 'read' }, { resource: 'testing', action: 'write' },
  ];
  const permissions = await Promise.all(permDefs.map((p) =>
    prisma.permission.upsert({ where: { resource_action: p }, update: {}, create: { resource: p.resource, action: p.action, description: p.action + ' ' + p.resource } }),
  ));
  console.log('  permissions: ' + permissions.length);

  // Roles
  const adminRole = await prisma.role.upsert({ where: { name: 'Admin' }, update: {}, create: { name: 'Admin', description: 'Full system access' } });
  const devRole = await prisma.role.upsert({ where: { name: 'Developer' }, update: {}, create: { name: 'Developer', description: 'Plugin and tool management' } });
  const viewerRole = await prisma.role.upsert({ where: { name: 'Viewer' }, update: {}, create: { name: 'Viewer', description: 'Read-only access' } });

  for (const perm of permissions) {
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } }, update: {}, create: { roleId: adminRole.id, permissionId: perm.id } });
  }
  for (const perm of permissions.filter((p) => ['plugins', 'tools', 'testing', 'tokens'].includes(p.resource) && ['read', 'write'].includes(p.action))) {
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: devRole.id, permissionId: perm.id } }, update: {}, create: { roleId: devRole.id, permissionId: perm.id } });
  }
  for (const perm of permissions.filter((p) => p.action === 'read')) {
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId: viewerRole.id, permissionId: perm.id } }, update: {}, create: { roleId: viewerRole.id, permissionId: perm.id } });
  }
  console.log('  roles: 3 (Admin, Developer, Viewer)');

  // Users
  const adminUser = await prisma.user.create({ data: { email: 'admin@axon.local', name: 'AXON Admin', passwordHash: await hashPassword('Admin@1234'), isVerified: true, isActive: true } });
  const devUser = await prisma.user.create({ data: { email: 'dev@axon.local', name: 'Dev User', passwordHash: await hashPassword('Dev@1234'), isVerified: true, isActive: true } });
  const viewUser = await prisma.user.create({ data: { email: 'viewer@axon.local', name: 'Viewer User', passwordHash: await hashPassword('Viewer@1234'), isVerified: true, isActive: true } });
  await prisma.userRole.createMany({ data: [{ userId: adminUser.id, roleId: adminRole.id }, { userId: devUser.id, roleId: devRole.id }, { userId: viewUser.id, roleId: viewerRole.id }] });
  console.log('  users: 3');

  // Plugin Group (name @unique)
  const group = await prisma.pluginGroup.upsert({ where: { name: 'Core Services' }, update: {}, create: { name: 'Core Services', description: 'Built-in AXON core plugins' } });

  // Plugins (no unique on name)
  const plugin1 = await prisma.plugin.create({ data: { name: 'AXON Orchestrator', endpoint: 'http://localhost:8200', authMethod: 'api_key', status: 'active', groupId: group.id, createdBy: adminUser.id, headersJson: '{"X-Api-Key":"demo-key"}', timeoutMs: 30000 } });
  const plugin2 = await prisma.plugin.create({ data: { name: 'AI Sidecar', endpoint: 'http://localhost:8210', authMethod: 'none', status: 'active', groupId: group.id, createdBy: adminUser.id, timeoutMs: 60000 } });
  const plugin3 = await prisma.plugin.create({ data: { name: 'Knowledge Base', endpoint: 'http://localhost:8220', authMethod: 'bearer', status: 'inactive', groupId: group.id, createdBy: adminUser.id, timeoutMs: 15000 } });
  console.log('  plugins: 3');

  // Tool Categories (name @unique)
  const catAI = await prisma.toolCategory.upsert({ where: { name: 'AI & LLM' }, update: {}, create: { name: 'AI & LLM', description: 'AI model interaction tools' } });
  const catData = await prisma.toolCategory.upsert({ where: { name: 'Data' }, update: {}, create: { name: 'Data', description: 'Data retrieval and processing' } });

  // Tools (no unique)
  const tool1 = await prisma.tool.create({ data: { name: 'Run Prompt', description: 'Execute a prompt through the orchestrator', pluginId: plugin1.id, categoryId: catAI.id, createdBy: adminUser.id, inputSchemaJson: '{"type":"object","properties":{"prompt":{"type":"string"}},"required":["prompt"]}' } });
  const tool2 = await prisma.tool.create({ data: { name: 'Generate Embedding', description: 'Generate vector embeddings for text', pluginId: plugin2.id, categoryId: catAI.id, createdBy: devUser.id, inputSchemaJson: '{"type":"object","properties":{"text":{"type":"string"}},"required":["text"]}' } });
  await prisma.tool.create({ data: { name: 'Search Knowledge', description: 'Semantic search over knowledge base', pluginId: plugin3.id, categoryId: catData.id, createdBy: devUser.id, inputSchemaJson: '{"type":"object","properties":{"q":{"type":"string"}},"required":["q"]}' } });
  console.log('  tools: 3, categories: 2');

  // Test Collection & Requests (no unique; TestRequest has no method/createdBy)
  const collection = await prisma.testCollection.create({ data: { name: 'Orchestrator API', description: 'Tests for AXON orchestrator endpoints', createdBy: devUser.id } });
  await prisma.testRequest.createMany({ data: [
    { name: 'Health Check', protocol: 'rest', url: 'http://localhost:8200/health', headersJson: '{}', collectionId: collection.id },
    { name: 'Run Prompt Test', protocol: 'rest', url: 'http://localhost:8200/v1/run', headersJson: '{"Content-Type":"application/json"}', bodyJson: '{"prompt":"Hello, AXON!"}', collectionId: collection.id },
  ] });
  console.log('  test collection: 1, requests: 2');

  // Feature Flags (key @unique)
  await prisma.featureFlag.upsert({ where: { key: 'enable_mcp_streaming' }, update: {}, create: { name: 'Enable MCP Streaming', key: 'enable_mcp_streaming', type: 'boolean', defaultValueJson: 'false', isActive: false } });
  await prisma.featureFlag.upsert({ where: { key: 'enable_hitl' }, update: {}, create: { name: 'Enable Human-in-the-Loop', key: 'enable_hitl', type: 'boolean', defaultValueJson: 'true', isActive: true } });
  await prisma.featureFlag.upsert({ where: { key: 'max_concurrent_runs' }, update: {}, create: { name: 'Max Concurrent Runs', key: 'max_concurrent_runs', type: 'number', defaultValueJson: '10', isActive: true } });
  console.log('  feature flags: 3');

  // Environments (slug @unique)
  const envDev = await prisma.environment.upsert({ where: { slug: 'development' }, update: {}, create: { name: 'Development', slug: 'development', isActive: true } });
  const envProd = await prisma.environment.upsert({ where: { slug: 'production' }, update: {}, create: { name: 'Production', slug: 'production', isActive: false } });
  // EnvVariable uses valueEncrypted not value
  await prisma.envVariable.createMany({ skipDuplicates: true, data: [
    { key: 'API_URL', valueEncrypted: 'http://localhost:8200', isSecret: false, environmentId: envDev.id },
    { key: 'LOG_LEVEL', valueEncrypted: 'debug', isSecret: false, environmentId: envDev.id },
    { key: 'API_URL', valueEncrypted: 'https://api.axon.io', isSecret: false, environmentId: envProd.id },
    { key: 'LOG_LEVEL', valueEncrypted: 'warn', isSecret: false, environmentId: envProd.id },
  ] });
  console.log('  environments: 2, env vars: 4');

  // Settings (namespace+key unique; field is valueJson not value)
  for (const s of [
    { namespace: 'general', key: 'site_name', valueJson: '"AXON Admin"' },
    { namespace: 'general', key: 'max_tokens_per_run', valueJson: '4096' },
    { namespace: 'security', key: 'session_timeout_minutes', valueJson: '60' },
    { namespace: 'security', key: 'max_login_attempts', valueJson: '5' },
    { namespace: 'notifications', key: 'email_enabled', valueJson: 'false' },
    { namespace: 'notifications', key: 'slack_enabled', valueJson: 'false' },
  ]) {
    await prisma.setting.upsert({ where: { namespace_key: { namespace: s.namespace, key: s.key } }, update: {}, create: s });
  }
  console.log('  settings: 6');

  // Notifications
  await prisma.notification.createMany({ data: [
    { userId: adminUser.id, type: 'info', title: 'Welcome to AXON Admin', message: 'Your admin environment is ready.', isRead: false },
    { userId: adminUser.id, type: 'warning', title: 'Change default JWT secrets', message: 'Update JWT_SECRET and JWT_REFRESH_SECRET before production.', isRead: false },
    { userId: devUser.id, type: 'info', title: 'Dev account created', message: 'Developer account has plugin and tool access.', isRead: false },
  ] });
  console.log('  notifications: 3');

  // Audit Logs (uses afterJson not details)
  await prisma.auditLog.createMany({ data: [
    { userId: adminUser.id, action: 'CREATE', resourceType: 'Plugin', resourceId: plugin1.id, afterJson: '{"name":"AXON Orchestrator"}' },
    { userId: adminUser.id, action: 'CREATE', resourceType: 'Plugin', resourceId: plugin2.id, afterJson: '{"name":"AI Sidecar"}' },
    { userId: devUser.id, action: 'CREATE', resourceType: 'Tool', resourceId: tool1.id, afterJson: '{"name":"Run Prompt"}' },
    { userId: devUser.id, action: 'CREATE', resourceType: 'Tool', resourceId: tool2.id, afterJson: '{"name":"Generate Embedding"}' },
  ] });
  console.log('  audit logs: 4');

  // System Logs (uses contextJson not context)
  await prisma.systemLog.createMany({ data: [
    { level: 'INFO', message: 'AXON Admin started', contextJson: '{"version":"1.0.0"}' },
    { level: 'INFO', message: 'Database connected', contextJson: '{"host":"202.71.1.13","schema":"axon_admin"}' },
    { level: 'WARN', message: 'JWT secrets using defaults', contextJson: '{"advice":"Update before production"}' },
  ] });
  console.log('  system logs: 3');

  // Orchestrator Runs + Stages
  const now = Date.now();
  const orchRun = await prisma.orchestratorRun.create({ data: { userId: adminUser.id, prompt: 'Analyze the latest sales report and summarize key trends', model: 'gpt-4o', status: 'done', totalDurationMs: 4280, totalInputTokens: 512, totalOutputTokens: 1024 } });
  await prisma.orchestratorStage.createMany({ data: [
    { runId: orchRun.id, stageNumber: 1, stageName: 'Intent Analysis', status: 'done', startedAt: new Date(now - 4200), endedAt: new Date(now - 3900), outputJson: '{"intent":"analyze","domain":"sales"}' },
    { runId: orchRun.id, stageNumber: 2, stageName: 'Plan Generation', status: 'done', startedAt: new Date(now - 3800), endedAt: new Date(now - 3200), outputJson: '{"steps":3,"tools":["search","summarize"]}' },
    { runId: orchRun.id, stageNumber: 3, stageName: 'Data Retrieval', status: 'done', startedAt: new Date(now - 3100), endedAt: new Date(now - 2100), outputJson: '{"rows":150,"source":"sales_db"}' },
    { runId: orchRun.id, stageNumber: 4, stageName: 'Analysis', status: 'done', startedAt: new Date(now - 2000), endedAt: new Date(now - 1000), outputJson: '{"insights":3}' },
    { runId: orchRun.id, stageNumber: 5, stageName: 'Response Synthesis', status: 'done', startedAt: new Date(now - 900), endedAt: new Date(now - 200), outputJson: '{"wordCount":450}' },
  ] });
  await prisma.orchestratorRun.create({ data: { userId: devUser.id, prompt: 'Debug the API connection failure', model: 'gpt-4o-mini', status: 'error', totalDurationMs: 1200, totalInputTokens: 128, totalOutputTokens: 0 } });
  console.log('  orchestrator runs: 2, stages: 5');

  // AI Agent Runs
  await prisma.aiAgentRun.createMany({ data: [
    { userId: adminUser.id, agentName: 'DataAnalysisAgent', modelMode: 'real_model', modelName: 'gpt-4o', prompt: 'Summarize monthly KPIs', status: 'done', totalDurationMs: 3200, inputTokens: 256, outputTokens: 512, outputJson: '{"summary":"KPIs improved by 12% MoM"}' },
    { userId: devUser.id, agentName: 'CodeReviewAgent', modelMode: 'test_model', modelName: 'gpt-4o-mini', prompt: 'Review PR #42 for security issues', status: 'done', totalDurationMs: 2100, inputTokens: 1024, outputTokens: 384, outputJson: '{"issues":0,"suggestions":2}' },
    { userId: devUser.id, agentName: 'ResearchAgent', modelMode: 'real_model', modelName: 'gpt-4o', prompt: 'Research competitors in AI orchestration', status: 'pending' },
  ] });
  console.log('  AI agent runs: 3');

  console.log('\nSeed complete!');
  console.log('  admin@axon.local  / Admin@1234');
  console.log('  dev@axon.local    / Dev@1234');
  console.log('  viewer@axon.local / Viewer@1234');
}

main()
  .catch((e) => { console.error('Seed failed:', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
