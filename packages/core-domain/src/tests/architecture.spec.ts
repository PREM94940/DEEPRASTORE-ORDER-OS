import { describe, it, expect } from 'vitest';
import { Project } from 'ts-morph';
import path from 'path';

describe('Architecture Guardrail Tests', () => {
  it('should ensure core-domain never imports infrastructure or cross-domain schemas', () => {
    const project = new Project();
    const domainPath = path.resolve(__dirname, '../**/*.ts');
    project.addSourceFilesAtPaths([domainPath]);

    const sourceFiles = project.getSourceFiles();
    
    for (const file of sourceFiles) {
      const imports = file.getImportDeclarations();
      for (const imp of imports) {
        const moduleSpecifier = imp.getModuleSpecifierValue();
        
        // Assert no cross-domain infrastructure bleeding
        expect(moduleSpecifier).not.toContain('infrastructure/src/schema/');
      }
    }
    
    // Ensure we actually scanned files
    expect(sourceFiles.length).toBeGreaterThan(0);
  });
});
