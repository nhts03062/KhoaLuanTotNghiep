import { FunctionDeclaration } from '@google/genai';

export const getUserProfileDecl: FunctionDeclaration = {
  name: 'getUserProfile',
  description: 'Get user profile for recommendations',
  parametersJsonSchema: {
    type: 'object',
    properties: {},
    required: [],
  },
};

export const listPackagesDecl: FunctionDeclaration = {
  name: 'listPackages',
  description: 'List active packages (global) from DB',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      hasPt: { type: 'boolean' },
      unit: { type: 'string', enum: ['DAY', 'MONTH'] },
    },
  },
};

export const listProgramsDecl: FunctionDeclaration = {
  name: 'listPrograms',
  description: 'List active programs from DB',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'] },
      daysPerWeek: { type: 'number' },
    },
  },
};

export const calcNutritionMacrosDecl: FunctionDeclaration = {
  name: 'calcNutritionMacros',
  description: 'Rule-based macro calculator',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      weightKg: { type: 'number' },
      heightCm: { type: 'number' },
      goal: {
        type: 'string',
        enum: [
          'LOSE_WEIGHT',
          'GAIN_MUSCLE',
          'IMPROVE_HEALTH',
          'MAINTAIN_WEIGHT',
        ],
      },
      activityLevel: {
        type: 'string',
        enum: ['SEDENTARY', 'LIGHT', 'MODERATE', 'HIGH'],
      },
    },
    required: ['weightKg', 'heightCm', 'goal'],
  },
};

export const TOOL_DECLS: FunctionDeclaration[] = [
  getUserProfileDecl,
  listPackagesDecl,
  listProgramsDecl,
  calcNutritionMacrosDecl,
];
