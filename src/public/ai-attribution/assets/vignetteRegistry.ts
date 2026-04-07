const vignetteModules = import.meta.glob('./vigs/*.html', {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>;

const availableVignetteIds = Object.keys(vignetteModules)
  .map((path) => {
    const match = path.match(/\/(\d+)\.html$/);
    return match ? Number.parseInt(match[1], 10) : null;
  })
  .filter((id): id is number => id !== null)
  .sort((a, b) => a - b);

function getVignettePath(vignetteId: number): string | null {
  const paddedKey = `./vigs/${String(vignetteId).padStart(3, '0')}.html`;
  return vignetteModules[paddedKey] ? paddedKey : null;
}

function getVignetteHtml(vignetteId: number): string | null {
  const path = getVignettePath(vignetteId);
  return path ? vignetteModules[path] : null;
}

export { availableVignetteIds, getVignetteHtml, vignetteModules };
