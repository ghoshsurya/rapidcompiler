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
    if (path !== '/health' && path !== '/run') {
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
          false,
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