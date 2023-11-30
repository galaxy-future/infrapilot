# 使用 Nginx 基础镜像
FROM nginx:1.25.2-alpine-slim
# 复制自定义 Nginx 配置文件到 /etc/nginx/conf.d/ 目录
COPY my-nginx-config.conf /etc/nginx/conf.d/default.conf
# 设置工作目录
WORKDIR /usr/share/nginx/html

# 复制本地的 BuildSSO 文件夹内的静态 HTML 内容到容器的工作目录
COPY Build/ .

# 暴露 Nginx 默认 HTTP 端口
EXPOSE 80

# 启动 Nginx
CMD ["nginx", "-g", "daemon off;"]
# 编译
# docker build  -t my-nginx .
# 运行
# docker run -d -p 8080:80 my-nginx