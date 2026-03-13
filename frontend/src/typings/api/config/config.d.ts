declare namespace Config {
  type ConfigItem = Api.Common.CommonRecord<{
    configKey: string;
    configName: string;
    configValue: string;
  }>;

  type ConfigList = Api.Common.PaginatingQueryRecord<ConfigItem>;

  type ConfigModel = Pick<ConfigItem, 'id' | 'configKey' | 'configName' | 'configValue' | 'status'>;

  type ConfigCreateModel = Pick<ConfigItem, 'configKey' | 'configName' | 'configValue' | 'status'>;

  type ConfigSearchParams = CommonType.RecordNullable<
    Pick<ConfigItem, 'configKey' | 'status'> & Api.Common.CommonSearchParams
  >;
}
