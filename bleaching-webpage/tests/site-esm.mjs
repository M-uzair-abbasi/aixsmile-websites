// The site has no package.json (Vercel serves it as plain files), so Node
// takes the module type of js/*.js from the nearest package.json further up
// the disk, which may say "commonjs". The browser loads these files as ES
// modules; this hook tells Node the same. Test files import it first, then
// import the site's modules dynamically.
import { register } from 'node:module';

const site = new URL('../js/', import.meta.url).href;
register(`data:text/javascript,${encodeURIComponent(`
export async function load(url, context, next) {
  if (url.startsWith(${JSON.stringify(site)}) && url.endsWith('.js')) return next(url, { ...context, format: 'module' });
  return next(url, context);
}`)}`);
