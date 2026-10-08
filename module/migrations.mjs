// Migração do source, sem escrever recursos, bônus, descrições ou cópias do mundo.
export function migrateKnightSource(source) {
  if ((source.schemaVersion ?? 1) >= 2) return source;
  source.automation ??= {enabled: false};
  source.schemaVersion = 2;
  return source;
}
