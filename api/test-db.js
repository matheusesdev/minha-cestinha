import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  // Pega a URL segura do ambiente
  const sql = neon(process.env.DATABASE_URL);

  try {
    // Tenta buscar a versão do banco só para testar a conexão
    const result = await sql`SELECT version()`;

    return response.status(200).json({ 
      status: 'Conectado com sucesso!', 
      version: result[0].version 
    });
  } catch (error) {
    return response.status(500).json({ 
      error: 'Erro ao conectar', 
      details: error.message 
    });
  }
}