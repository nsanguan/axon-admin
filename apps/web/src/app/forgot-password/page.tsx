'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../../lib/api';
import { toast } from 'sonner';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';

const emailSchema = z.object({ email: z.string().email('Invalid email') });
type EmailForm = z.infer<typeof emailSchema>;

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const { register, handleSubmit, formState: { errors } } = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const onSubmit = async (data: EmailForm) => {
    setLoading(true);
    try {
      // In a real implementation this would hit /api/auth/forgot-password
      await new Promise((r) => setTimeout(r, 800)); // simulate request
      setSentEmail(data.email);
      setSubmitted(true);
    } catch {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
        <div className="w-full max-w-md text-center space-y-4">
          <CheckCircle size={48} className="mx-auto text-green-500" />
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-[var(--muted-foreground)] text-sm">
            We sent a password reset link to <strong>{sentEmail}</strong>. Check your inbox and spam folder.
          </p>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-[var(--primary)] hover:underline">
            <ArrowLeft size={14} /> Back to sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] px-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Forgot password?</h1>
          <p className="mt-2 text-[var(--muted-foreground)] text-sm">
            Enter your email and we&apos;ll send a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-2xl border border-[var(--border)] p-8 bg-[var(--background)]">
          <div>
            <label className="block text-sm font-medium mb-1">Email address</label>
            <input
              {...register('email')}
              type="email"
              autoComplete="email"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              placeholder="admin@example.com"
            />
            {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {loading ? 'Sending…' : 'Send reset link'}
          </button>

          <div className="text-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]">
              <ArrowLeft size={12} /> Back to sign in
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
