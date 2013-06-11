---
title: Basic Structure
---

A basic Jekyde site usually looks something like this:

<pre>
|-- content
   |-- post
      |-- some-long-name.md
      |-- 2013-05-10-another-name.md
   |-- page
      |-- about.md
      |-- guide.md
      |-- latex.md
   |-- file
      |-- one.jpg
      |-- two.txt
|-- template
   |-- include
      |-- footer.html
      |-- header.html
      |-- mathjax.html
      |-- navbar.html
   |-- layout
      |-- archive.html
      |-- index.html
      |-- page.html
      |-- post.html
   |-- static
      |-- image.png
      |-- script.js
      |-- style.css
   |-- config.yaml
|-- website
   |-- archive
   |-- file
   |-- page
   |-- post
   |-- static
   |-- index.html
</pre>

An overview of what each of these does:

## content

This folder contains all your content files.

#### content -> post

Your post files written in markdown language. The filename format of these files may be one of the followings:

1. `year-month-day-some-filename.md`
2. `another-long-filename.md`

#### content -> page

Your page files written in markdown language. There is no restriction for filename format of these files.

#### content -> xxxx

Other folders/files used in your blog, such as your photo and pdf files. These folders/files will be copied to `website` folder without any modification.

## template

This folder contains all your template files.

#### template -> config.yml

This file stores configuration data.

#### template -> layout

These are the templates for generating post, page, index and archive files.

#### template -> include

These are parts of template files included by layout files.

#### template -> xxxxxx

Other folders/files used in your templates, such as your css, javascript and image files. These folders/files will be copied to `website` folder without any modification.

## website

This is where the generated site will be placed once Jekyde is done generating it.
