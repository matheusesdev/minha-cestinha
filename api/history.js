import { neon } from '@neondatabase/serverless';

export default async function handler(request, response) {
  try {
    const sql = neon(process.env.DATABASE_URL);

    // Ajustamos para buscar 'data' e dar o apelido de 'date' para o React não quebrar
    const result = await sql`
      SELECT id, data as date, total, itens, meta, pagamento 
      FROM compras 
      ORDER BY data DESC 
      LIMIT 50
    `;

    const formattedHistory = result.map(row => {
      const items = typeof row.itens === 'string' ? JSON.parse(row.itens) : row.itens;
      return {
        id: row.id,
        date: row.date,
        total: Number(row.total),
        items: Array.isArray(items) ? items : [],
        itemCount: Array.isArray(items) ? items.length : 0,
        budget: row.meta ? Number(row.meta) : null,
        paymentMethod: row.pagamento || null
      };
    });

    return response.status(200).json(formattedHistory);
  } catch (error) {
    console.error("ERRO NO BANCO:", error);
    return response.status(500).json({ error: "Erro ao buscar histórico", details: error.message });
  }
}