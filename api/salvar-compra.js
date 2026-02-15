import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { date, total, items } = request.body;

    // Ajustado para inserir na coluna 'data' e 'itens' (nomes reais no banco)
    await sql`
      INSERT INTO compras (data, total, itens)
      VALUES (${date}, ${total}, ${JSON.stringify(items)})
    `;

    return response.status(201).json({ message: 'Compra salva com sucesso!' });
  } catch (error) {
    console.error('Erro API:', error);
    return response.status(500).json({ error: 'Erro ao salvar compra no banco.' });
  }
}