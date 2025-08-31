import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET() {
  try {
    const csvPath = path.join(process.cwd(), '../backend/defect_rate.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    const uniqueModels = [...new Set(records.map((record: any) => record.ModelID))].sort();

    return NextResponse.json(uniqueModels);
  } catch (error) {
    console.error('Error reading model data:', error);
    return NextResponse.json({ error: 'Failed to load model data' }, { status: 500 });
  }
}