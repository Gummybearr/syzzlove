import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelIds = searchParams.get('modelIds')?.split(',') || [];
    
    const csvPath = path.join(process.cwd(), '../backend/defect_rate.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    let data = records.map((record: any) => ({
      ModelID: record.ModelID,
      LotID: record.LotID,
      DefectRate: parseFloat(record.DefectRate)
    }));

    if (modelIds.length > 0) {
      data = data.filter((item: any) => modelIds.includes(item.ModelID));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading defect rate data:', error);
    return NextResponse.json({ error: 'Failed to load defect rate data' }, { status: 500 });
  }
}