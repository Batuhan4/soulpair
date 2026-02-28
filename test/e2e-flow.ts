/**
 * Soulpair E2E Flow Test
 * Run: npx tsx test/e2e-flow.ts
 *
 * Requires API running on localhost:3001
 */

const API = 'http://localhost:3001';

interface TestResult {
  name: string;
  passed: boolean;
  detail?: string;
}

const results: TestResult[] = [];

function assert(name: string, condition: boolean, detail?: string) {
  results.push({ name, passed: condition, detail });
  const icon = condition ? '✅' : '❌';
  console.log(`  ${icon} ${name}${detail ? ` — ${detail}` : ''}`);
}

async function api(path: string, options?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return res.json();
}

async function testHealthCheck() {
  console.log('\n🔍 Health Check');
  const json = await api('/api/health');
  assert('Health endpoint returns success', json.success === true);
  assert('Has uptime', typeof json.data?.uptime === 'number');
  assert('Has ws stats', typeof json.data?.ws === 'object');
}

async function testProfileCreation() {
  console.log('\n👤 Profile Creation');

  // Create agent1
  const res1 = await api('/api/profile', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: '0x1111111111111111111111111111111111111111',
      flirtMdCID: 'QmTestCID1_agent1_flirtmd_hash',
      twitterHandle: 'agent1_twitter',
    }),
  });
  assert('Create agent1 profile', res1.success === true);

  // Create agent2
  const res2 = await api('/api/profile', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: '0x2222222222222222222222222222222222222222',
      flirtMdCID: 'QmTestCID2_agent2_flirtmd_hash',
      instagramHandle: 'agent2_insta',
    }),
  });
  assert('Create agent2 profile', res2.success === true);

  // Get profile
  const get1 = await api('/api/profile/0x1111111111111111111111111111111111111111');
  assert('Get agent1 profile', get1.success === true);
  assert('Has flirt CID', get1.data?.flirt_md_cid === 'QmTestCID1_agent1_flirtmd_hash');

  // Update profile
  const update = await api('/api/profile', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: '0x1111111111111111111111111111111111111111',
      flirtMdCID: 'QmUpdatedCID_agent1_v2',
    }),
  });
  assert('Update agent1 profile', update.success === true && update.data?.updated === true);

  // List profiles
  const list = await api('/api/profiles');
  assert('List profiles', list.success === true && list.data?.length >= 2);
}

async function testHeartbeatAndMatchmaking() {
  console.log('\n💓 Heartbeat & Matchmaking');

  // Agent1 heartbeat — ready
  const hb1 = await api('/api/heartbeat', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: '0x1111111111111111111111111111111111111111',
      agentId: 'test-agent-1',
      status: 'ready',
    }),
  });
  assert('Agent1 heartbeat accepted', hb1.success === true);

  // Agent2 heartbeat — ready
  const hb2 = await api('/api/heartbeat', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: '0x2222222222222222222222222222222222222222',
      agentId: 'test-agent-2',
      status: 'ready',
    }),
  });
  assert('Agent2 heartbeat accepted', hb2.success === true);

  // Check for pending assignments
  const queue1 = await api('/api/match/queue?wallet=0x1111111111111111111111111111111111111111');
  assert('Agent1 has pending assignment', queue1.success === true && queue1.data?.length > 0, `${queue1.data?.length} assignments`);

  return queue1.data?.[0] || null;
}

async function testMatchResult(assignment: any) {
  console.log('\n📋 Match Result Submission');

  if (!assignment) {
    assert('Has assignment to test', false, 'No assignment from matchmaking');
    return null;
  }

  const conversationId = assignment.conversationId;

  const res = await api('/api/match/result', {
    method: 'POST',
    body: JSON.stringify({
      conversationId,
      agentAddress: assignment.agent1Address,
      result: {
        outcome: 'match',
        confidence: 0.85,
        commonalities: ['Both love trekking', 'Same city'],
        differences: ['Different music taste'],
        reasoning: 'Strong compatibility — shared outdoor interests and location alignment.',
      },
    }),
  });
  assert('Submit match result', res.success === true);
  assert('Result outcome recorded', res.data?.result === 'match');

  return conversationId;
}

async function testMatchApproval() {
  console.log('\n✅ Match Approval Flow');

  // Get matches for agent1
  const matches = await api('/api/matches/0x1111111111111111111111111111111111111111');
  assert('Agent1 has matches', matches.success === true && matches.data?.length > 0, `${matches.data?.length} matches`);

  if (!matches.data?.length) return;

  const matchId = matches.data[0].id;

  // Agent1 approves
  const approve1 = await api('/api/match/approve', {
    method: 'POST',
    body: JSON.stringify({
      matchId,
      approved: true,
      walletAddress: '0x1111111111111111111111111111111111111111',
    }),
  });
  assert('Agent1 approves match', approve1.success === true);
  assert('Not both approved yet', approve1.data?.bothApproved === false);

  // Agent2 approves
  const approve2 = await api('/api/match/approve', {
    method: 'POST',
    body: JSON.stringify({
      matchId,
      approved: true,
      walletAddress: '0x2222222222222222222222222222222222222222',
    }),
  });
  assert('Agent2 approves match', approve2.success === true);
  assert('Both approved — match confirmed!', approve2.data?.bothApproved === true);
}

async function testStats() {
  console.log('\n📊 Dashboard Stats');

  const stats = await api('/api/stats');
  assert('Stats endpoint works', stats.success === true);
  assert('Has profile count', stats.data?.totalProfiles >= 2);
  assert('Has total conversations', typeof stats.data?.totalConversations === 'number');

  const leaderboard = await api('/api/stats/leaderboard');
  assert('Leaderboard endpoint works', leaderboard.success === true);

  const recent = await api('/api/stats/recent-matches');
  assert('Recent matches endpoint works', recent.success === true);
}

async function testEdgeCases() {
  console.log('\n🔒 Edge Cases & Error Handling');

  // Missing profile heartbeat
  const badHb = await api('/api/heartbeat', {
    method: 'POST',
    body: JSON.stringify({
      walletAddress: '0xDEAD000000000000000000000000000000000000',
      agentId: 'ghost',
      status: 'ready',
    }),
  });
  assert('Heartbeat for non-existent profile → 404', badHb.success === false);

  // Invalid profile creation
  const badProfile = await api('/api/profile', {
    method: 'POST',
    body: JSON.stringify({ flirtMdCID: 'test' }), // missing walletAddress
  });
  assert('Invalid profile creation → validation error', badProfile.success === false);

  // 404 route
  const notFound = await api('/api/nonexistent');
  assert('Unknown route → 404', notFound.success === false);

  // Approve non-existent match
  const badApprove = await api('/api/match/approve', {
    method: 'POST',
    body: JSON.stringify({
      matchId: 'non-existent-id',
      approved: true,
      walletAddress: '0x1111111111111111111111111111111111111111',
    }),
  });
  assert('Approve non-existent match → 404', badApprove.success === false);
}

async function testConversationHistory() {
  console.log('\n💬 Conversation History');

  const history = await api('/api/conversations/history/0x1111111111111111111111111111111111111111');
  assert('Conversation history works', history.success === true);
  assert('Has conversation records', history.data?.length > 0, `${history.data?.length} conversations`);
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  🧪 Soulpair E2E Test Suite');
  console.log('═══════════════════════════════════════════');

  try {
    await testHealthCheck();
    await testProfileCreation();
    const assignment = await testHeartbeatAndMatchmaking();
    await testMatchResult(assignment);
    await testMatchApproval();
    await testStats();
    await testConversationHistory();
    await testEdgeCases();

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;

    console.log('\n═══════════════════════════════════════════');
    console.log(`  Results: ${passed} passed, ${failed} failed, ${results.length} total`);
    console.log('═══════════════════════════════════════════');

    if (failed > 0) {
      console.log('\n❌ Failed tests:');
      results.filter(r => !r.passed).forEach(r => {
        console.log(`   • ${r.name}${r.detail ? `: ${r.detail}` : ''}`);
      });
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed!');
      process.exit(0);
    }
  } catch (e: any) {
    console.error('\n💥 Test suite crashed:', e.message);
    console.error('   Is the API running? Start with: npx tsx apps/api/src/server.ts');
    process.exit(1);
  }
}

main();
