import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id, market } = request.body;
    if (!id) {
      return response.status(400).json({ error: 'Id obrigatorio' });
    }

    const sql = neon(process.env.DATABASE_URL);
    await sql`
      UPDATE compras
      SET mercado = ${market || null}
      WHERE id = ${id}
    `;

    return response.status(200).json({ message: 'Mercado atualizado com sucesso!' });
  } catch (error) {
    console.error('Erro API:', error);
    return response.status(500).json({ error: 'Erro ao atualizar mercado no banco.' });
  }
}
