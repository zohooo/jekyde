---
title: Introduction
---

Jekyde is a static blog builder, server and writer in Node.JS. Using Jekyde, You could write your blog in Markdown and LaTeX easily.

The main differences between Jekyde and other similar tools are the following three features:

1. Take care of conflicts between Markdown and LaTeX: You only need to write LaTeX formulas as `$...$` and `$$...$$`. No need to put them inside backquotes, and no worry about `\{...\}` and `a_1b_1` broken by markdown.

2. Include a live blog writer inside browser: You could write you markdown + LaTeX articles in browser, and get the live preview of results by marked and MathJax. When you save articles, Your blog website will be regenerated at once.

3. You may write your blog posts in local computer, and push Jekyde-built website to GitHub pages. Also you may deploy Jekyde to your Node.JS server, and write your blog posts in browser, just as using WordPress.

Jekyde is written in Node.JS. You could install it using npm. The template data and file formats are more of less compatible with Jekyll using in GitHub pages.
