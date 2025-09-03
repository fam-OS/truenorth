import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required')
});

export async function POST(request: Request) {
  try {
    console.log('Signup request received');
    const body = await request.json();
    console.log('Parsed request data:', { email: body.email, name: body.name, hasPassword: !!body.password });

    // Validate input data first
    const validatedData = signupSchema.parse(body);
    const { email, password, name } = validatedData;

    console.log('Checking for existing user...');
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists:', email);
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      );
    }

    console.log('Hashing password...');
    // Hash password - import bcrypt dynamically
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(validatedData.password, 12);

    console.log('Creating user...');
    // Create user with explicit ID
    const user = await prisma.user.create({
      data: {
        id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        email,
        name: name || null,
        passwordHash,
      },
    });

    console.log('User created successfully:', user.id);
    return NextResponse.json(
      { 
        message: 'User created successfully', 
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Signup error details:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.issues },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
