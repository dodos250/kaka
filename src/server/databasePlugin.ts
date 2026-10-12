import fs from 'fs';
import path from 'path';
import type { Plugin } from 'vite';

const DB_DIR = path.resolve(process.cwd(), 'database');
const DB_FILE = path.join(DB_DIR, 'family_tree.json');
const BACKUPS_DIR = path.join(DB_DIR, 'backups');

export function databaseServerPlugin(): Plugin {
  return {
    name: 'database-server-plugin',
    configureServer(server) {
      // Ensure db and backups directory exist
      if (!fs.existsSync(DB_DIR)) {
        fs.mkdirSync(DB_DIR, { recursive: true });
      }
      if (!fs.existsSync(BACKUPS_DIR)) {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
      }

      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];

        // GET /api/tree: Load family tree from persistent database file
        if (req.method === 'GET' && url === '/api/tree') {
          try {
            if (!fs.existsSync(DB_FILE)) {
              res.statusCode = 404;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: 'Database file not initialized' }));
              return;
            }
            const content = fs.readFileSync(DB_FILE, 'utf-8');
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(content);
          } catch (err: any) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        // POST /api/tree: Persist changes to database file with automatic timestamped snapshot backup
        if (req.method === 'POST' && url === '/api/tree') {
          let body = '';
          req.on('data', chunk => {
            body += chunk;
          });
          req.on('end', () => {
            try {
              const data = JSON.parse(body);
              if (!data.people || !Array.isArray(data.people)) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid data format' }));
                return;
              }

              // Create atomic snapshot before overwrite
              if (fs.existsSync(DB_FILE)) {
                const now = new Date().toISOString().replace(/[:.]/g, '-');
                fs.copyFileSync(DB_FILE, path.join(BACKUPS_DIR, `snapshot_${now}.json`));
              }

              fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, count: data.people.length }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

        // POST /api/backup: Force explicit backup creation
        if (req.method === 'POST' && url === '/api/backup') {
          try {
            if (fs.existsSync(DB_FILE)) {
              const now = new Date().toISOString().replace(/[:.]/g, '-');
              const target = path.join(BACKUPS_DIR, `manual_backup_${now}.json`);
              fs.copyFileSync(DB_FILE, target);
              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ success: true, path: target }));
            } else {
              res.statusCode = 404;
              res.end(JSON.stringify({ error: 'No database file' }));
            }
          } catch (err: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          }
          return;
        }

        next();
      });
    },
  };
}
