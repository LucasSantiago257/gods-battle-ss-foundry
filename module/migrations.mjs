// Migração do source, sem escrever recursos, bônus, descrições ou cópias do mundo.
export function migrateKnightSource(source) {
  // Source sem versão é criação nova; os defaults atuais serão aplicados.
  if (source.schemaVersion === undefined || source.schemaVersion >= 3) return source;
  if(source.schemaVersion<2) source.automation ??= {enabled: false};
  source.creationGuide ??= {status:"",initializeResources:false};
  source.schemaVersion = 3;
  return source;
}
