import { existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const src = new URL('../src/', import.meta.url);

export async function resolve(specifier, context, next) {
  let target = specifier;
  if (specifier.startsWith('@/')) target = new URL(specifier.slice(2), src).href;
  else if (specifier.startsWith('.') && context.parentURL) target = new URL(specifier, context.parentURL).href;
  else return next(specifier, context);
  if (!/\.[cm]?[tj]s$/.test(target) && existsSync(fileURLToPath(target + '.ts'))) target += '.ts';
  return next(target, context);
}
