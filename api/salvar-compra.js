import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    const { date, total, items, budget, paymentMethod } = request.body;

    await sql`
      INSERT INTO compras (data, total, itens, meta, pagamento)
      VALUES (${date}, ${total}, ${JSON.stringify(items)}, ${budget || null}, ${paymentMethod || null})
    `;

    return response.status(201).json({ message: 'Compra salva com sucesso!' });
  } catch (error) {
    console.error('Erro API:', error);
    return response.status(500).json({ error: 'Erro ao salvar compra no banco.' });
  }
}