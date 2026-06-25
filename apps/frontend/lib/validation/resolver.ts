import { zodResolver } from '@hookform/resolvers/zod'
import { Resolver, FieldValues } from 'react-hook-form'
import { ZodType } from 'zod'

/**
 * Thin wrapper around @hookform/resolvers' zodResolver.
 *
 * The npm workspace hoists @hookform/resolvers to the repo root, where its
 * .d.ts resolves `zod` against the backend's zod@3 install (root node_modules)
 * instead of this app's own zod@4 — breaking the resolver's v3/v4 overload
 * detection at the type level only (runtime duck-typing on `_def`/`_zod` still
 * works fine). This wrapper re-types the result against our own zod@4 schema
 * so call sites get correct inference without reaching for `any`.
 */
export function createResolver<TSchema extends ZodType, TFieldValues extends FieldValues>(
  schema: TSchema
): Resolver<TFieldValues> {
  const untypedResolver = zodResolver as unknown as (schema: TSchema) => Resolver<TFieldValues>
  return untypedResolver(schema)
}
