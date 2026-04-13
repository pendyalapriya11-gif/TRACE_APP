require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./db');

// 🔥 YOUR TOPICS (EXACT SAME)
const topics = [
  "Array","String","Hash Table","Math","Dynamic Programming","Sorting",
  "Greedy","Depth-First Search","Binary Search","Bit Manipulation","Matrix",
  "Tree","Breadth-First Search","Two Pointers","Prefix Sum","Heap (Priority Queue)",
  "Counting","Graph Theory","Binary Tree","Stack","Sliding Window","Enumeration",
  "Backtracking","Union-Find","Number Theory","Linked List","Ordered Set",
  "Segment Tree","Monotonic Stack","Divide and Conquer","Combinatorics","Trie",
  "Bitmask","Queue","Recursion","Geometry","Binary Indexed Tree","Memoization",
  "Hash Function","Binary Search Tree","Topological Sort","Shortest Path",
  "String Matching","Game Theory","Monotonic Queue","Doubly-Linked List",
  "Merge Sort","Counting Sort","Suffix Array","Probability and Statistics",
  "Minimum Spanning Tree","Bucket Sort"
];

// 🔥 PLATFORM DISTRIBUTION
const platformDistribution = {
  LeetCode: 0.30,
  HackerRank: 0.30,
  Codeforces: 0.15,
  CodeChef: 0.10,
  GFG: 0.15
};

// 🔥 DIFFICULTY DISTRIBUTION
const difficulties = ["Easy", "Medium", "Hard"];

// 🔥 Generate random topic
function getRandomTopic() {
  return topics[Math.floor(Math.random() * topics.length)];
}

// 🔥 Generate difficulty
function getDifficulty() {
  const r = Math.random();
  if (r < 0.4) return "Easy";
  if (r < 0.8) return "Medium";
  return "Hard";
}

// 🔥 Generate fake URL (valid format)
function generateURL(platform, id) {
  const base = {
    LeetCode: "https://leetcode.com/problems/",
    HackerRank: "https://www.hackerrank.com/challenges/",
    Codeforces: "https://codeforces.com/problemset/problem/",
    CodeChef: "https://www.codechef.com/problems/",
    GFG: "https://www.geeksforgeeks.org/"
  };
  return base[platform] + `problem-${id}`;
}

// 🔥 MAIN FUNCTION
async function seed() {
  try {
    const total = 800;
    let idCounter = 1;
    const values = [];

    for (const platform in platformDistribution) {
      const count = Math.floor(total * platformDistribution[platform]);

      for (let i = 0; i < count; i++) {
        const topic = getRandomTopic();
        const difficulty = getDifficulty();

        const question_name = `${platform} ${topic} Problem ${idCounter}`;
        const question_url = generateURL(platform, idCounter);

        values.push([
          question_name,
          topic,
          platform,
          difficulty,
          question_url
        ]);

        idCounter++;
      }
    }

    console.log("Inserting...", values.length, "questions");

    await db.query(
      `INSERT INTO question_bank 
      (question_name, topic, platform, difficulty, question_url) 
      VALUES ?`,
      [values]
    );

    console.log("✅ Seeding completed successfully!");

    process.exit();

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();