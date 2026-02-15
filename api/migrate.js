import { neon } from '@neondatabase/serverless';

// Endpoint de migração (executar uma vez para adicionar colunas meta e pagamento)
// Acesse: /api/migrate
export default async function handler(request, response) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    await sql`
      ALTER TABLE compras 
      ADD COLUMN IF NOT EXISTS meta NUMERIC,
      ADD COLUMN IF NOT EXISTS pagamento TEXT
    `;

    return response.status(200).json({ 
      message: 'Migração concluída! Colunas "meta" e "pagamento" adicionadas à tabela compras.' 
    });
  } catch (error) {
    console.error('Erro na migração:', error);
    return response.status(500).json({ error: 'Erro na migração', details: error.message });
  }
}
