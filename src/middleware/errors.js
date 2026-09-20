import { ZodError } from 'zod';

export function notFound(req, res) {
  res.status(404).json({ error: 'Route not found' });
}

export function errorHandler(error, req, res, next) {
  if (error instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: error.flatten().fieldErrors });
  }
  if (error.code === '23505') return res.status(409).json({ error: 'This record already exists' });
  console.error(error);
  res.status(500).json({ error: 'Internal server error' });
}
