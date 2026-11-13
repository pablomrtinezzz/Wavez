import { NextRequest, NextResponse } from 'next/server';
import { getSpotClimatologyUseCase } from '@/application/container';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const climatology = await getSpotClimatologyUseCase.execute(id);

    if (!climatology) {
      return NextResponse.json(
        { success: false, error: 'Datos climatológicos no encontrados para este spot' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: climatology,
    });
  } catch (error) {
    if ((error as { digest?: string })?.digest?.startsWith('NEXT_')) {
      throw error;
    }
    console.error(`API /api/spots/[id]/climatology error:`, error);
    return NextResponse.json(
      { success: false, error: 'Error al obtener climatología del spot' },
      { status: 500 }
    );
  }
}
