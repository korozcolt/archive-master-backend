export class ConfigurationHistoryResponseDto {
  id: string;
  configurationId: string;
  oldValue: string;
  newValue: string;
  changeNotes?: string;
  createdById: string;
  createdAt: Date;
}
