import { NextApiRequest, NextApiResponse } from 'next';
import { NextRequest, NextResponse } from 'next/server';

export interface MockApiResponse extends NextApiResponse {
  _getJSONData: () => any;
  _getData: () => any;
  _getStatusCode: () => number;
  _getHeaders: () => Record<string, string>;
}

export function createMockResponse(): MockApiResponse {
  const res: Partial<MockApiResponse> = {};
  let statusCode = 200;
  let jsonData: any = null;
  let data: any = null;
  const headers: Record<string, string> = {};

  res.status = (code: number) => {
    statusCode = code;
    return res as NextApiResponse;
  };

  res.json = (responseData: any) => {
    jsonData = responseData;
    return res as NextApiResponse;
  };

  res.send = (responseData: any) => {
    data = responseData;
    return res as NextApiResponse;
  };

  res.setHeader = (name: string, value: string | number | readonly string[]) => {
    headers[name.toLowerCase()] = String(value);
    return res as MockApiResponse;
  };

  res._getJSONData = () => jsonData;
  res._getData = () => data;
  res._getStatusCode = () => statusCode;
  res._getHeaders = () => headers;

  return res as MockApiResponse;
}

export function createMockRequest(
  method: string = 'GET',
  body: any = null,
  query: Record<string, any> = {},
  headers: Record<string, string> = {},
  url: string = '/'
): NextRequest & { query: Record<string, any> } {
  return {
    method,
    body: body ? JSON.stringify(body) : null,
    json: () => Promise.resolve(body || {}),
    headers: headers as any,
    url,
    nextUrl: {
      searchParams: new URLSearchParams(
        Object.entries(query).map(([key, value]) => [key, String(value)])
      ),
    },
    query,
  } as any;
}
