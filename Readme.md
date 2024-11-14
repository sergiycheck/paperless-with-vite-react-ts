# Important Note

A lot of things were simplified for the sake of time, such as the lack of error handling, the lack of proper testing, and the lack of proper documentation. This is not a **production-ready codebase, but rather a proof of concept**.

## How to start

1. Follow instructions to setup paperless in docker [here](https://docs.paperless-ngx.com/setup/)
2. Add environment variables in docker-compose.env file to enable remote user api and allow CORS

```bash
PAPERLESS_ENABLE_HTTP_REMOTE_USER_API=true
PAPERLESS_CORS_ALLOWED_HOSTS=http://localhost:8000,http://localhost:5173
```

3. Run the docker-compose file

```bash
docker-compose up -d
```

4. Access the paperless web interface at http://localhost:8000

5. CD to apps/vite-react run **npm i** and **npm run dev** to start the vite-react app
