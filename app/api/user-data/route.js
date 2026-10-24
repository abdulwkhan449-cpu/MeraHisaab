import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function POST(request) {
  try {
    const { name, total_income, total_withdrawals, expenses } = await request.json();
    
    const client = await pool.connect();
    const query = `
      INSERT INTO user_data (name, total_income, total_withdrawals, expenses)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [name, total_income, total_withdrawals, JSON.stringify(expenses)];
    const result = await client.query(query, values);
    client.release();

    return NextResponse.json(
      { message: 'User data saved successfully', data: result.rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error('Database insertion error:', error);
    return NextResponse.json(
      { error: 'Failed to save user data' },
      { status: 500 }
    );
  }
}
