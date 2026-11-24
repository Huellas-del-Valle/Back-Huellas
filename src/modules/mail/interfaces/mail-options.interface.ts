export interface SendVaccinationReminderOptions {
  to: string;
  ownerName: string;
  petName: string;
  petCode: string;
  species: string;
  vaccinationType: string;
  vaccinationName: string;
  batchNumber: string;
  applicationDate: string;
  nextDueDate: string;
}

export interface MailSentResult {
  messageId: string;
  accepted: string[];
  rejected: string[];
  simulated: boolean;
  previewUrl?: string | false;
}
