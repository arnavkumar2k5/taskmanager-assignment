import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ok<T>(message: string, data?: T, pagination?: ApiResponse['pagination']) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, message, data, pagination },
    { status: 200 }
  );
}

export function created<T>(message: string, data?: T) {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, message, data },
    { status: 201 }
  );
}

export function badRequest(message: string, errors?: Record<string, string[]>) {
  return NextResponse.json<ApiResponse>(
    { success: false, message, errors },
    { status: 400 }
  );
}

export function unauthorized(message = 'Unauthorized') {
  return NextResponse.json<ApiResponse>(
    { success: false, message },
    { status: 401 }
  );
}

export function forbidden(message = 'Forbidden') {
  return NextResponse.json<ApiResponse>(
    { success: false, message },
    { status: 403 }
  );
}

export function notFound(message = 'Not found') {
  return NextResponse.json<ApiResponse>(
    { success: false, message },
    { status: 404 }
  );
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json<ApiResponse>(
    { success: false, message },
    { status: 500 }
  );
}
