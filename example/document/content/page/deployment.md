---
title: Deploy Your Blog
date: 2013-06-11 23:39:40
---

### Deploy to Your GitHub Pages

Just add all files in `website` folder to your github pages repository, and push it.

### Deploy to Your Node.JS Server


    cd /path/to/blog/folder
    npm install
    nohup node . &


When you use Nginx as reverse proxy to Node.JS, and your blog url is `http://www.example.com/blog/`, you need to add the following to your `nginx.conf` file.

    http {
        server {
            listen       80;
            server_name  www.example.com;            
            location ^~ /blog/ {
                proxy_pass   http://127.0.0.1:4040;
            }
    }

Now you could update your blog in desktop or mobile browsers.