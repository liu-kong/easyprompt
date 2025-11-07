import { Router } from 'express';
import { ProjectController } from '../controllers/projectController';
import { PromptController } from '../controllers/promptController';
import { ExportController } from '../controllers/exportController';
import { ComparisonController } from '../controllers/comparisonController';
import { CodeGenerationController } from '../controllers/codeGenerationController';
import { DatabaseConfigController } from '../controllers/databaseConfigController';

const router = Router();
const projectController = new ProjectController();
const promptController = new PromptController();
const exportController = new ExportController();
const comparisonController = new ComparisonController();
const codeGenerationController = new CodeGenerationController();
const databaseConfigController = new DatabaseConfigController();

// Project routes
router.post('/projects', projectController.createProject);
router.get('/projects', projectController.getProjects);
router.get('/projects/:id', projectController.getProjectById);
router.put('/projects/:id', projectController.updateProject);
router.delete('/projects/:id', projectController.deleteProject);

// Prompt Table routes
router.post('/prompt-tables', projectController.createPromptTable);
router.get('/projects/:projectId/prompt-tables', projectController.getPromptTables);
router.get('/prompt-tables/:id', projectController.getPromptTableById);
router.put('/prompt-tables/:id', projectController.updatePromptTable);
router.delete('/prompt-tables/:id', projectController.deletePromptTable);

// Prompt routes
router.post('/prompts', promptController.createPrompt);
router.get('/prompts', promptController.getPrompts);
router.get('/prompts/:id', promptController.getPromptById);
router.get('/prompt-tables/:tableId/prompts/:code', promptController.getPromptByCode);
router.put('/prompts/:id', promptController.updatePrompt);
router.delete('/prompts/:id', promptController.deletePrompt);
router.get('/prompts/search', promptController.searchPrompts);

// Prompt Version routes
router.post('/prompt-versions', promptController.createVersion);
router.get('/prompts/:promptId/versions', promptController.getVersions);
router.get('/prompts/:promptId/versions/:version', promptController.getVersion);
router.post('/prompts/:promptId/restore/:version', promptController.restoreVersion);

// Export routes
router.get('/export/table/:tableName/:dbConfigName/:dbName', exportController.exportTableStructure);
router.get('/export/prompts/:tableId', exportController.exportPromptsAsSQL);
router.get('/export/project/:projectId', exportController.exportAllTablesAsSQL);
router.get('/export/table/:tableId/json', exportController.exportTableAsJSON);
router.get('/export/project/:projectId/json', exportController.exportProjectAsJSON);

// Comparison routes
router.get('/compare/tables/:tableId1/:tableId2', comparisonController.compareTables);
router.get('/compare/prompts/:promptId/:version1/:version2', comparisonController.comparePromptVersions);
router.get('/statistics/table/:tableId', comparisonController.getTableStatistics);
router.get('/statistics/project/:projectId', comparisonController.getProjectStatistics);

// Code Generation routes
router.get('/generate/python/:tableId', codeGenerationController.generatePythonCode);
router.get('/generate/java/:tableId', codeGenerationController.generateJavaCode);
router.get('/generate/go/:tableId', codeGenerationController.generateGoCode);
router.get('/generate/:language/:tableId', codeGenerationController.generateCode);

// Database Config routes
router.post('/database-configs', databaseConfigController.createDatabaseConfig);
router.get('/database-configs', databaseConfigController.getDatabaseConfigs);
router.get('/database-configs/:id', databaseConfigController.getDatabaseConfigById);
router.put('/database-configs/:id', databaseConfigController.updateDatabaseConfig);
router.delete('/database-configs/:id', databaseConfigController.deleteDatabaseConfig);
router.post('/database-configs/test', databaseConfigController.testDatabaseConnection);
router.post('/database-configs/:configId/tables', databaseConfigController.getRemoteTableList);
router.get('/database-configs/:configId/tables/:tableName/schema', databaseConfigController.getRemoteTableSchema);
router.get('/database-configs/:configId/tables/:tableName/query', databaseConfigController.queryRemoteTable);

export default router;