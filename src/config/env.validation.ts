import Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),
  PORT: Joi.number().default(3000),

  // Database
  DB_HOST: Joi.string().required().default('localhost'),
  DB_PORT: Joi.number().default(3306),
  DB_USERNAME: Joi.string().required().default('root'),
  DB_PASSWORD: Joi.string().allow('').default('root'),
  DB_DATABASE: Joi.string().required().default('huellas_del_valle'),
  DB_SYNCHRONIZE: Joi.boolean().default(false),
  DB_LOGGING: Joi.boolean().default(false),
  DB_SSL: Joi.boolean().default(false),
  DB_MIGRATIONS_RUN: Joi.boolean().default(true),

  // Auth / JWT
  JWT_SECRET: Joi.string().required().min(4),
  JWT_EXPIRES_IN: Joi.string().default('2h'),
});

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const { error, value } = envValidationSchema.validate(config, {
    allowUnknown: true,
    abortEarly: false,
  });
  if (error) {
    throw new Error(`Environment validation error: ${error.message}`);
  }
  return value as Record<string, unknown>;
}
