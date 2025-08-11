import Module from '../models/Module';
import crypto from 'crypto';

export interface RegisterModuleInput {
  name: string;
  version: string;
  description?: string;
  ownerId: string;
  manifest: any;
  endpoints: {
    rest: string;
    ws?: string;
  };
  [key: string]: any;
}

/**
 * Registers a module and stores its metadata in the database.
 * Returns the created module along with a generated integration token.
 */
export async function registerModule(data: RegisterModuleInput) {
  const existingModule = await Module.findOne({
    name: data.name,
    ownerId: data.ownerId,
  });

  if (existingModule) {
    Object.assign(existingModule, data);
    await existingModule.save();
    return {
      module: existingModule,
      integrationToken: existingModule.integrationToken,
    };
  }

  const integrationToken = crypto.randomBytes(32).toString('hex');
  const savedModule = await Module.create({ ...data, integrationToken });
  return { module: savedModule, integrationToken };
}

/**
 * Retrieves the list of registered modules.
 */
export async function getModules() {
  return Module.find();
}
