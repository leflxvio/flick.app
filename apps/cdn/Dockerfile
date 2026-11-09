FROM nginx:stable-alpine
RUN rm -f /usr/share/nginx/html/index.html /usr/share/nginx/html/50x.html
COPY apps/cdn/nginx.conf /etc/nginx/conf.d/default.conf
COPY apps/cdn/public/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 CMD wget -q -O /dev/null http://127.0.0.1/health || exit 1
