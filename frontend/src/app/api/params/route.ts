import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const modelIds = searchParams.get('modelIds')?.split(',') || [];
    
    const csvPath = path.join(process.cwd(), '../backend/params.csv');
    const csvData = fs.readFileSync(csvPath, 'utf-8');
    
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
    });

    let data = records.map((record: any) => ({
      LotID: record.LotID,
      DateTime: record.DateTime,
      Type: record.Type,
      Value: parseFloat(record.Value)
    }));

    if (modelIds.length > 0) {
      data = data.filter((item: any) => {
        return modelIds.some(modelId => item.LotID.startsWith(modelId));
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error reading params data:', error);
    return NextResponse.json({ error: 'Failed to load params data' }, { status: 500 });
  }
}