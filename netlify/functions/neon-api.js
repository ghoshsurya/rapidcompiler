const { Client } = require('pg');
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Auth0 Configuration
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE;

const client = jwksClient({
  jwksUri: `https://${AUTH0_DOMAIN}/.well-known/jwks.json`
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function verifyToken(token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, {
      audience: AUTH0_AUDIENCE,
      issuer: `https://${AUTH0_DOMAIN}/`,
      algorithms: ['RS256']
    }, (err, decoded) => {
      if (err) {
        reject(err);
      } else {
        resolve(decoded);
      }
    });
  });
}

async function getDbClient() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  return client;
}

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/neon-api', '');
  const method = event.httpMethod;

  try {
    // Verify Auth0 token for protected routes
    if (path !== '/health' && path !== '/run' && !path.startsWith('/share/')) {
      const authHeader = event.headers.authorization;
      if (!authHeader) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Authorization header missing' })
        };
      }

      const token = authHeader.split(' ')[1];
      const decoded = await verifyToken(token);
      event.user = decoded;
    }

    const dbClient = await getDbClient();

    try {
      if (path === '/health' && method === 'GET') {
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ status: 'healthy', database: 'neon' })
        };
      }

      if (path.startsWith('/users') && method === 'GET') {
        const userId = path.split('/')[2];
        if (userId) {
          const result = await dbClient.query('SELECT * FROM users WHERE id = $1', [userId]);
          const user = result.rows[0];
          
          if (!user) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'User not found' })
            };
          }

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              id: user.id,
              email: user.email,
              username: user.username,
              full_name: user.full_name,
              avatar_url: user.avatar_url,
              is_admin: user.is_admin,
              created_at: user.created_at
            })
          };
        }
      }

      if (path === '/users' && method === 'POST') {
        const userData = JSON.parse(event.body);
        
        const result = await dbClient.query(`
          INSERT INTO users (id, email, username, full_name, avatar_url, is_admin, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          userData.id,
          userData.email,
          userData.username,
          userData.full_name || '',
          userData.avatar_url,
          userData.is_admin || false,
          new Date()
        ]);

        const user = result.rows[0];
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            username: user.username,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            is_admin: user.is_admin,
            created_at: user.created_at
          })
        };
      }

      if (path === '/projects' && method === 'GET') {
        const result = await dbClient.query(
          'SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC',
          [event.user.sub]
        );

        const projects = result.rows.map(p => ({
          id: p.id,
          title: p.title,
          language: p.language,
          share_id: p.share_id,
          created_at: p.created_at
        }));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(projects)
        };
      }

      if (path.startsWith('/projects/') && method === 'GET') {
        const projectId = path.split('/')[2];
        
        const result = await dbClient.query(
          'SELECT * FROM projects WHERE id = $1 AND user_id = $2',
          [projectId, event.user.sub]
        );

        const project = result.rows[0];
        if (!project) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Project not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(project)
        };
      }

      if (path === '/projects' && method === 'POST') {
        const projectData = JSON.parse(event.body);
        
        const result = await dbClient.query(`
          INSERT INTO projects (user_id, title, language, code, is_public, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `, [
          event.user.sub,
          projectData.title,
          projectData.language,
          projectData.code,
          true,
          new Date(),
          new Date()
        ]);

        const project = result.rows[0];
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({
            id: project.id,
            title: project.title,
            language: project.language,
            share_id: project.share_id
          })
        };
      }

      if (path.startsWith('/projects/') && method === 'PUT') {
        const projectId = path.split('/')[2];
        const projectData = JSON.parse(event.body);
        
        const result = await dbClient.query(`
          UPDATE projects 
          SET title = $1, language = $2, code = $3, updated_at = $4
          WHERE id = $5 AND user_id = $6
          RETURNING *
        `, [
          projectData.title,
          projectData.language,
          projectData.code,
          new Date(),
          projectId,
          event.user.sub
        ]);

        const project = result.rows[0];
        if (!project) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Project not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            id: project.id,
            title: project.title,
            language: project.language,
            share_id: project.share_id
          })
        };
      }

      // Public share endpoint - no auth required
      if (path.startsWith('/share/') && method === 'GET') {
        const shareId = path.split('/')[2];
        console.log('Looking for share_id:', shareId);
        
        const result = await dbClient.query(
          'SELECT * FROM projects WHERE share_id = $1 AND is_public = true',
          [shareId]
        );

        console.log('Query result:', result.rows.length, 'projects found');
        const project = result.rows[0];
        if (!project) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Project not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            id: project.id,
            title: project.title,
            language: project.language,
            code: project.code,
            share_id: project.share_id,
            created_at: project.created_at
          })
        };
      }

      if (path.startsWith('/projects/') && method === 'DELETE') {
        const projectId = path.split('/')[2];
        
        const result = await dbClient.query(
          'DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING *',
          [projectId, event.user.sub]
        );

        const project = result.rows[0];
        if (!project) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Project not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Project deleted successfully' })
        };
      }

      if (path.startsWith('/users/') && method === 'PUT') {
        const userId = path.split('/')[2];
        const userData = JSON.parse(event.body);
        
        if (userId !== event.user.sub) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Unauthorized' })
          };
        }
        
        const result = await dbClient.query(`
          UPDATE users 
          SET username = $1, full_name = $2, updated_at = $3
          WHERE id = $4
          RETURNING *
        `, [
          userData.username,
          userData.full_name,
          new Date(),
          userId
        ]);

        const user = result.rows[0];
        if (!user) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            id: user.id,
            email: user.email,
            username: user.username,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            is_admin: user.is_admin,
            created_at: user.created_at
          })
        };
      }

      if (path.startsWith('/users/') && method === 'DELETE') {
        const userId = path.split('/')[2];
        
        if (userId !== event.user.sub) {
          return {
            statusCode: 403,
            headers,
            body: JSON.stringify({ error: 'Unauthorized' })
          };
        }
        
        // Delete all user's projects first
        await dbClient.query('DELETE FROM projects WHERE user_id = $1', [userId]);
        
        // Delete user
        const result = await dbClient.query(
          'DELETE FROM users WHERE id = $1 RETURNING *',
          [userId]
        );

        const user = result.rows[0];
        if (!user) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'User not found' })
          };
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ message: 'Account deleted successfully' })
        };
      }

      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Route not found' })
      };

    } finally {
      await dbClient.end();
    }

  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};