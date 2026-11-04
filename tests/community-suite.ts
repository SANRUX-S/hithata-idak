import assert from "node:assert";
import { checkContentSafety } from "@/lib/moderation";
import {
  createCommunityPost,
  getCommunityPosts,
  getCommunityPostById,
  addCommunityReply,
  reactToCommunityPost,
  reportCommunityPost,
  moderateCommunityPost,
} from "@/lib/store";

// Use an in-memory SQLite database for testing
process.env.DATABASE_PATH = ":memory:";

async function runCommunitySuite() {
  console.log("=================================================");
  console.log("  HITHATA IDAK — COMMUNITY FORUM & SAFETY TESTS  ");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => Promise<void> | void) {
    total++;
    try {
      await fn();
      console.log(`✓ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`✗ [FAIL] ${name}`);
      console.error(err);
      process.exit(1);
    }
  }

  // 1. Content Safety - Clean content
  await test("Content safety allows healthy, supportive community expressions", () => {
    const cleanTexts = [
      "I feel stressed about my exams, how do you manage study anxiety?",
      "Mata ada loku bayak thiyanawa job interview eka gana. Any advice?",
      "Thank you everyone for the kind words, I felt much better today.",
      "හිතට හරිම අමාරුයි, ඒත් මම උත්සාහ කරනවා ඉදිරියට යන්න.",
    ];

    for (const text of cleanTexts) {
      const result = checkContentSafety(text);
      assert.strictEqual(result.isSafe, true, `Expected "${text}" to be allowed`);
    }
  });

  // 2. Content Safety - Block abusive, hate speech, self-harm encouragement
  await test("Content safety strictly blocks toxic, abusive, and self-harm encouraging text", () => {
    const toxicTexts = [
      "you should kill yourself right now",
      "go kill yourself",
      "you should die alone",
      "you are worthless scum",
      "kill urself",
    ];

    for (const text of toxicTexts) {
      const result = checkContentSafety(text);
      assert.strictEqual(result.isSafe, false, `Expected "${text}" to be blocked`);
      assert.ok(result.reason, "Expected a rejection reason");
    }
  });

  // 3. Post Creation and Retrieval
  let createdPostId = "";
  await test("Community post creation stores alias, title, content and category safely", async () => {
    const post = await createCommunityPost(
      "Dealing with work anxiety in Colombo",
      "Traffic and long hours are getting exhausting. How do you unwind in the evenings?",
      "TiredOtter",
      "anxiety"
    );

    assert.ok(post.id);
    assert.strictEqual(post.title, "Dealing with work anxiety in Colombo");
    assert.strictEqual(post.category, "anxiety");
    assert.strictEqual(post.author_alias, "TiredOtter");
    assert.strictEqual(post.reactions_warmth, 0);
    assert.strictEqual(post.reply_count, 0);
    createdPostId = post.id;

    const posts = await getCommunityPosts({ category: "anxiety" });
    const found = posts.find((p) => p.id === post.id);
    assert.ok(found, "Created post should be found in anxiety category list");
  });

  // 4. Replies
  await test("Users can reply anonymously to support each other", async () => {
    const reply = await addCommunityReply(
      createdPostId,
      "I take a 20-minute walk by the beach or listen to calming music. Hang in there!",
      "CalmWave"
    );

    assert.ok(reply.id);
    assert.strictEqual(reply.author_alias, "CalmWave");

    const fullPost = await getCommunityPostById(createdPostId);
    assert.ok(fullPost);
    assert.strictEqual(fullPost.replies.length, 1);
    assert.strictEqual(fullPost.replies[0].content, "I take a 20-minute walk by the beach or listen to calming music. Hang in there!");
  });

  // 5. Supportive Reactions
  await test("Supportive reactions (warmth, alone, insight) update accurately", async () => {
    const r1 = await reactToCommunityPost(createdPostId, "warmth");
    assert.strictEqual(r1.reactions_warmth, 1);

    const r2 = await reactToCommunityPost(createdPostId, "alone");
    assert.strictEqual(r2.reactions_alone, 1);

    const r3 = await reactToCommunityPost(createdPostId, "insight");
    assert.strictEqual(r3.reactions_insight, 1);
  });

  // 6. User Reporting Mechanism
  await test("Community members can report inappropriate or sensitive posts", async () => {
    await reportCommunityPost(createdPostId, "User reported sensitive content needing review");
    const fullPost = await getCommunityPostById(createdPostId);
    assert.ok(fullPost);
    assert.strictEqual(Number(fullPost.is_flagged), 1);
    assert.strictEqual(fullPost.flag_reason, "User reported sensitive content needing review");
  });

  // 7. Supporter Moderation - Dismiss flag
  await test("Supporter can dismiss false-alarm flags and keep post active", async () => {
    await moderateCommunityPost(createdPostId, "approve");
    const fullPost = await getCommunityPostById(createdPostId);
    assert.ok(fullPost);
    assert.strictEqual(Number(fullPost.is_flagged), 0);
  });

  // 8. Supporter Moderation - Remove / Delete post
  await test("Supporter can remove inappropriate posts cleanly", async () => {
    await moderateCommunityPost(createdPostId, "delete");
    const fullPost = await getCommunityPostById(createdPostId);
    assert.strictEqual(fullPost, null, "Deleted post should no longer be retrieved");

    const posts = await getCommunityPosts();
    const found = posts.find((p) => p.id === createdPostId);
    assert.strictEqual(found, undefined, "Deleted post should not appear in community list");
  });

  console.log(`\n=================================================`);
  console.log(`  ALL ${passed}/${total} COMMUNITY TESTS PASSED SUCCESSFULLY!`);
  console.log(`=================================================\n`);
}

runCommunitySuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
