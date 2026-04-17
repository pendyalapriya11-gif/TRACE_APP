require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('./db');

// ✅ REAL PROBLEMS DATASET
const questions = [

/* ===== ARRAY ===== */
["Two Sum","Array","LeetCode","Easy","https://leetcode.com/problems/two-sum/"],
["Maximum Subarray","Array","LeetCode","Medium","https://leetcode.com/problems/maximum-subarray/"],
["Best Time to Buy and Sell Stock","Array","LeetCode","Easy","https://leetcode.com/problems/best-time-to-buy-and-sell-stock/"],
["Product of Array Except Self","Array","LeetCode","Medium","https://leetcode.com/problems/product-of-array-except-self/"],
["Subarray Sum Equals K","Array","LeetCode","Medium","https://leetcode.com/problems/subarray-sum-equals-k/"],
["Kadane's Algorithm","Array","GFG","Medium","https://www.geeksforgeeks.org/problems/kadanes-algorithm-1587115620/1"],

/* ===== STRING ===== */
["Longest Substring Without Repeating Characters","String","LeetCode","Medium","https://leetcode.com/problems/longest-substring-without-repeating-characters/"],
["Valid Anagram","String","LeetCode","Easy","https://leetcode.com/problems/valid-anagram/"],
["Group Anagrams","String","LeetCode","Medium","https://leetcode.com/problems/group-anagrams/"],
["Palindrome Number","String","LeetCode","Easy","https://leetcode.com/problems/palindrome-number/"],
["Longest Palindromic Substring","String","LeetCode","Medium","https://leetcode.com/problems/longest-palindromic-substring/"],

/* ===== HASH TABLE ===== */
["Contains Duplicate","Hash Table","LeetCode","Easy","https://leetcode.com/problems/contains-duplicate/"],
["Top K Frequent Elements","Hash Table","LeetCode","Medium","https://leetcode.com/problems/top-k-frequent-elements/"],
["Two Sum II","Hash Table","LeetCode","Medium","https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/"],

/* ===== DP ===== */
["Climbing Stairs","Dynamic Programming","LeetCode","Easy","https://leetcode.com/problems/climbing-stairs/"],
["House Robber","Dynamic Programming","LeetCode","Medium","https://leetcode.com/problems/house-robber/"],
["Coin Change","Dynamic Programming","LeetCode","Medium","https://leetcode.com/problems/coin-change/"],
["Longest Increasing Subsequence","Dynamic Programming","LeetCode","Medium","https://leetcode.com/problems/longest-increasing-subsequence/"],
["Edit Distance","Dynamic Programming","LeetCode","Hard","https://leetcode.com/problems/edit-distance/"],

/* ===== TREE ===== */
["Maximum Depth of Binary Tree","Tree","LeetCode","Easy","https://leetcode.com/problems/maximum-depth-of-binary-tree/"],
["Same Tree","Tree","LeetCode","Easy","https://leetcode.com/problems/same-tree/"],
["Invert Binary Tree","Tree","LeetCode","Easy","https://leetcode.com/problems/invert-binary-tree/"],
["Binary Tree Level Order Traversal","Tree","LeetCode","Medium","https://leetcode.com/problems/binary-tree-level-order-traversal/"],
["Validate Binary Search Tree","Tree","LeetCode","Medium","https://leetcode.com/problems/validate-binary-search-tree/"],

/* ===== GRAPH ===== */
["Number of Islands","Graph","LeetCode","Medium","https://leetcode.com/problems/number-of-islands/"],
["Clone Graph","Graph","LeetCode","Medium","https://leetcode.com/problems/clone-graph/"],
["Course Schedule","Graph","LeetCode","Medium","https://leetcode.com/problems/course-schedule/"],
["Word Ladder","Graph","LeetCode","Hard","https://leetcode.com/problems/word-ladder/"],

/* ===== SLIDING WINDOW ===== */
["Longest Repeating Character Replacement","Sliding Window","LeetCode","Medium","https://leetcode.com/problems/longest-repeating-character-replacement/"],
["Minimum Window Substring","Sliding Window","LeetCode","Hard","https://leetcode.com/problems/minimum-window-substring/"],

/* ===== TWO POINTERS ===== */
["Container With Most Water","Two Pointers","LeetCode","Medium","https://leetcode.com/problems/container-with-most-water/"],
["3Sum","Two Pointers","LeetCode","Medium","https://leetcode.com/problems/3sum/"],

/* ===== STACK ===== */
["Valid Parentheses","Stack","LeetCode","Easy","https://leetcode.com/problems/valid-parentheses/"],
["Min Stack","Stack","LeetCode","Medium","https://leetcode.com/problems/min-stack/"],
["Daily Temperatures","Stack","LeetCode","Medium","https://leetcode.com/problems/daily-temperatures/"],

/* ===== BINARY SEARCH ===== */
["Binary Search","Binary Search","LeetCode","Easy","https://leetcode.com/problems/binary-search/"],
["Search in Rotated Sorted Array","Binary Search","LeetCode","Medium","https://leetcode.com/problems/search-in-rotated-sorted-array/"],
["Find Peak Element","Binary Search","LeetCode","Medium","https://leetcode.com/problems/find-peak-element/"],

/* ===== LINKED LIST ===== */
["Reverse Linked List","Linked List","LeetCode","Easy","https://leetcode.com/problems/reverse-linked-list/"],
["Merge Two Sorted Lists","Linked List","LeetCode","Easy","https://leetcode.com/problems/merge-two-sorted-lists/"],
["Linked List Cycle","Linked List","LeetCode","Easy","https://leetcode.com/problems/linked-list-cycle/"],

/* ===== CODECHEF ===== */
["ATM","Math","CodeChef","Easy","https://www.codechef.com/problems/HS08TEST"],
["Add Two Numbers","Math","CodeChef","Easy","https://www.codechef.com/problems/FLOW001"],
["Enormous Input Test","Array","CodeChef","Easy","https://www.codechef.com/problems/INTEST"],

/* ===== CODEFORCES ===== */
["Watermelon","Math","Codeforces","Easy","https://codeforces.com/problemset/problem/4/A"],
["Way Too Long Words","String","Codeforces","Easy","https://codeforces.com/problemset/problem/71/A"],
["Next Round","Math","Codeforces","Easy","https://codeforces.com/problemset/problem/158/A"],

/* ===== HACKERRANK ===== */
["Solve Me First","Math","HackerRank","Easy","https://www.hackerrank.com/challenges/solve-me-first/problem"],
["Simple Array Sum","Array","HackerRank","Easy","https://www.hackerrank.com/challenges/simple-array-sum/problem"],
["Compare the Triplets","Array","HackerRank","Easy","https://www.hackerrank.com/challenges/compare-the-triplets/problem"],

/* ===== ARRAY / PREFIX / GREEDY ===== */
["Merge Intervals","Array","LeetCode","Medium","https://leetcode.com/problems/merge-intervals/"],
["Insert Interval","Array","LeetCode","Medium","https://leetcode.com/problems/insert-interval/"],
["Jump Game","Greedy","LeetCode","Medium","https://leetcode.com/problems/jump-game/"],
["Jump Game II","Greedy","LeetCode","Medium","https://leetcode.com/problems/jump-game-ii/"],
["Gas Station","Greedy","LeetCode","Medium","https://leetcode.com/problems/gas-station/"],
["Candy","Greedy","LeetCode","Hard","https://leetcode.com/problems/candy/"],

/* ===== MATRIX ===== */
["Set Matrix Zeroes","Matrix","LeetCode","Medium","https://leetcode.com/problems/set-matrix-zeroes/"],
["Spiral Matrix","Matrix","LeetCode","Medium","https://leetcode.com/problems/spiral-matrix/"],
["Rotate Image","Matrix","LeetCode","Medium","https://leetcode.com/problems/rotate-image/"],

/* ===== BACKTRACKING ===== */
["Subsets","Backtracking","LeetCode","Medium","https://leetcode.com/problems/subsets/"],
["Permutations","Backtracking","LeetCode","Medium","https://leetcode.com/problems/permutations/"],
["Combination Sum","Backtracking","LeetCode","Medium","https://leetcode.com/problems/combination-sum/"],
["N-Queens","Backtracking","LeetCode","Hard","https://leetcode.com/problems/n-queens/"],

/* ===== HEAP ===== */
["Kth Largest Element in an Array","Heap","LeetCode","Medium","https://leetcode.com/problems/kth-largest-element-in-an-array/"],
["Find Median from Data Stream","Heap","LeetCode","Hard","https://leetcode.com/problems/find-median-from-data-stream/"],

/* ===== TRIE ===== */
["Implement Trie","Trie","LeetCode","Medium","https://leetcode.com/problems/implement-trie-prefix-tree/"],
["Word Search II","Trie","LeetCode","Hard","https://leetcode.com/problems/word-search-ii/"],

/* ===== UNION FIND ===== */
["Number of Connected Components","Union-Find","LeetCode","Medium","https://leetcode.com/problems/number-of-connected-components-in-an-undirected-graph/"],
["Redundant Connection","Union-Find","LeetCode","Medium","https://leetcode.com/problems/redundant-connection/"],

/* ===== GRAPH ADVANCED ===== */
["Pacific Atlantic Water Flow","Graph","LeetCode","Medium","https://leetcode.com/problems/pacific-atlantic-water-flow/"],
["Network Delay Time","Graph","LeetCode","Medium","https://leetcode.com/problems/network-delay-time/"],
["Cheapest Flights Within K Stops","Graph","LeetCode","Medium","https://leetcode.com/problems/cheapest-flights-within-k-stops/"],

/* ===== DP ADVANCED ===== */
["Word Break","Dynamic Programming","LeetCode","Medium","https://leetcode.com/problems/word-break/"],
["Decode Ways","Dynamic Programming","LeetCode","Medium","https://leetcode.com/problems/decode-ways/"],
["Partition Equal Subset Sum","Dynamic Programming","LeetCode","Medium","https://leetcode.com/problems/partition-equal-subset-sum/"],
["Longest Common Subsequence","Dynamic Programming","LeetCode","Medium","https://leetcode.com/problems/longest-common-subsequence/"],

/* ===== BINARY TREE ADVANCED ===== */
["Path Sum","Tree","LeetCode","Easy","https://leetcode.com/problems/path-sum/"],
["Diameter of Binary Tree","Tree","LeetCode","Easy","https://leetcode.com/problems/diameter-of-binary-tree/"],
["Lowest Common Ancestor","Tree","LeetCode","Medium","https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/"],

/* ===== LINKED LIST ADVANCED ===== */
["Add Two Numbers","Linked List","LeetCode","Medium","https://leetcode.com/problems/add-two-numbers/"],
["Copy List with Random Pointer","Linked List","LeetCode","Medium","https://leetcode.com/problems/copy-list-with-random-pointer/"],
["LRU Cache","Linked List","LeetCode","Medium","https://leetcode.com/problems/lru-cache/"],

/* ===== STACK ADVANCED ===== */
["Evaluate Reverse Polish Notation","Stack","LeetCode","Medium","https://leetcode.com/problems/evaluate-reverse-polish-notation/"],
["Largest Rectangle in Histogram","Stack","LeetCode","Hard","https://leetcode.com/problems/largest-rectangle-in-histogram/"],

/* ===== SLIDING WINDOW ADVANCED ===== */
["Find All Anagrams in a String","Sliding Window","LeetCode","Medium","https://leetcode.com/problems/find-all-anagrams-in-a-string/"],
["Permutation in String","Sliding Window","LeetCode","Medium","https://leetcode.com/problems/permutation-in-string/"],

/* ===== CODEFORCES MORE ===== */
["Beautiful Matrix","Math","Codeforces","Easy","https://codeforces.com/problemset/problem/263/A"],
["HQ9+","Implementation","Codeforces","Easy","https://codeforces.com/problemset/problem/133/A"],

/* ===== CODECHEF MORE ===== */
["Small Factorial","Math","CodeChef","Easy","https://www.codechef.com/problems/FCTRL"],
["Turbo Sort","Sorting","CodeChef","Easy","https://www.codechef.com/problems/TSORT"],

/* ===== HACKERRANK MORE ===== */
["Diagonal Difference","Array","HackerRank","Easy","https://www.hackerrank.com/challenges/diagonal-difference/problem"],
["Plus Minus","Array","HackerRank","Easy","https://www.hackerrank.com/challenges/plus-minus/problem"],
/* ===== EXTRA SET ===== */

["Trapping Rain Water","Array","LeetCode","Hard","https://leetcode.com/problems/trapping-rain-water/"],
["Move Zeroes","Array","LeetCode","Easy","https://leetcode.com/problems/move-zeroes/"],
["Find Minimum in Rotated Sorted Array","Binary Search","LeetCode","Medium","https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/"],
["Search a 2D Matrix","Binary Search","LeetCode","Medium","https://leetcode.com/problems/search-a-2d-matrix/"],

["Word Search","Backtracking","LeetCode","Medium","https://leetcode.com/problems/word-search/"],
["Letter Combinations of a Phone Number","Backtracking","LeetCode","Medium","https://leetcode.com/problems/letter-combinations-of-a-phone-number/"],

["Reorder List","Linked List","LeetCode","Medium","https://leetcode.com/problems/reorder-list/"],
["Remove Nth Node From End","Linked List","LeetCode","Medium","https://leetcode.com/problems/remove-nth-node-from-end-of-list/"],

["Course Schedule II","Graph","LeetCode","Medium","https://leetcode.com/problems/course-schedule-ii/"],
["Rotting Oranges","Graph","LeetCode","Medium","https://leetcode.com/problems/rotting-oranges/"],

["Unique Paths","Dynamic Programming","LeetCode","Medium","https://leetcode.com/problems/unique-paths/"],
["Minimum Path Sum","Dynamic Programming","LeetCode","Medium","https://leetcode.com/problems/minimum-path-sum/"],

["Implement Queue using Stacks","Stack","LeetCode","Easy","https://leetcode.com/problems/implement-queue-using-stacks/"],
["Next Greater Element I","Stack","LeetCode","Easy","https://leetcode.com/problems/next-greater-element-i/"],

["Intersection of Two Arrays","Hash Table","LeetCode","Easy","https://leetcode.com/problems/intersection-of-two-arrays/"],
["Isomorphic Strings","Hash Table","LeetCode","Easy","https://leetcode.com/problems/isomorphic-strings/"],

["Minimum Size Subarray Sum","Sliding Window","LeetCode","Medium","https://leetcode.com/problems/minimum-size-subarray-sum/"],
["Max Consecutive Ones III","Sliding Window","LeetCode","Medium","https://leetcode.com/problems/max-consecutive-ones-iii/"],

["Find First and Last Position","Binary Search","LeetCode","Medium","https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/"],

["Balanced Binary Tree","Tree","LeetCode","Easy","https://leetcode.com/problems/balanced-binary-tree/"],
["Symmetric Tree","Tree","LeetCode","Easy","https://leetcode.com/problems/symmetric-tree/"],

["Roman to Integer","String","LeetCode","Easy","https://leetcode.com/problems/roman-to-integer/"],
["Integer to Roman","String","LeetCode","Medium","https://leetcode.com/problems/integer-to-roman/"],

["Plus One","Math","LeetCode","Easy","https://leetcode.com/problems/plus-one/"],
["Sqrt(x)","Math","LeetCode","Easy","https://leetcode.com/problems/sqrtx/"],

["Frog Jump","Dynamic Programming","LeetCode","Hard","https://leetcode.com/problems/frog-jump/"],
["Burst Balloons","Dynamic Programming","LeetCode","Hard","https://leetcode.com/problems/burst-balloons/"],

["Sudoku Solver","Backtracking","LeetCode","Hard","https://leetcode.com/problems/sudoku-solver/"],
["Word Break II","Dynamic Programming","LeetCode","Hard","https://leetcode.com/problems/word-break-ii/"],

["Detect Cycle in Graph","Graph","GFG","Medium","https://www.geeksforgeeks.org/problems/detect-cycle-in-a-directed-graph/1"],
["Dijkstra Algorithm","Graph","GFG","Medium","https://www.geeksforgeeks.org/problems/implementing-dijkstra-set-1-adjacency-matrix/1"],

["Binary Tree Zigzag Level Order","Tree","LeetCode","Medium","https://leetcode.com/problems/binary-tree-zigzag-level-order-traversal/"],
["Flatten Binary Tree","Tree","LeetCode","Medium","https://leetcode.com/problems/flatten-binary-tree-to-linked-list/"]

];
const cleanQuestions = questions.filter(q => 
  Array.isArray(q) && q.length === 5
);

async function seed() {
  try {
    console.log("Inserting real problems...");

    await db.query(
  `INSERT INTO question_bank 
   (question_name, topic, platform, difficulty, question_url) 
   VALUES ?`,
  [cleanQuestions]
);
    console.log("✅ Real dataset inserted successfully!");
    process.exit();

  } catch (err) {
    console.error("❌ Error:", err);
    process.exit(1);
  }
}

seed();