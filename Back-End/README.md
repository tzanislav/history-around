# History Around Backend

Express server that serves the built app from Back-End/public and exposes API endpoints.

## Active Paths

- Front-end source: ../newFront-end
- Served static bundle: Back-End/public
- Unity loader page: Back-End/public/unity-game.html
- Unity build files: Back-End/public/Build

## Commands

From Back-End:

- npm run dev: run server with nodemon
- npm start: run server in production mode
- npm run build: build ../newFront-end and copy dist into Back-End/public
- npm run copy-build: copy existing ../newFront-end/dist into Back-End/public

## API Endpoints

- GET /api/health
- GET /api/unity-status
- GET /api/history

## Deployment

Use ../upload-unity-files.ps1 from project root. It:

1. Builds newFront-end.
2. Copies build output into Back-End/public.
3. Copies Unity files and unity-game.html from newFront-end/public.
4. Syncs git locally and remotely.
5. Falls back to direct upload if remote git sync fails.
6. Restarts pm2 process history-around on EC2.

## Notes

- The deprecated old front-end was archived under ../_old.
- Legacy docs were moved to ../_old/docs.
