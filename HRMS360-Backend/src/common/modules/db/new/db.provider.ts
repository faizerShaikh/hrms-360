// database.providers.ts
export const databaseProviders = [
  {
    provide: "SEQUELIZE",
    useFactory: async () => {
      // const sequelize = new Sequelize({ ...databaseConfig["development"] });
      // sequelize.addModels([...publicTables, ...schemaTables]);
      // await sequelize.sync();
      // return sequelize;
    },
  },
];
