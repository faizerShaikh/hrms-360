import { publicTables, schemaTables } from "../models";

export const getModelProvider = () => {
  const publicModelProviders = publicTables.map((item) => ({
    provide: item.name,
    useValue: item,
  }));
  const schemaModelsProviders = schemaTables.map((item) => ({
    provide: item.name,
    useValue: item,
  }));
  return [...publicModelProviders, ...schemaModelsProviders];
};
